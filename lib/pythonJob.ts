import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export const YOUTUBE_JOB_TIMEOUT_MS = 60 * 60 * 1000;
export const INSTRUMENTAL_JOB_TIMEOUT_MS = 50 * 60 * 1000;
export const STEMS_JOB_TIMEOUT_MS = 25 * 60 * 1000;

export const PREEMPTED_ERROR = "JOB_PREEMPTED";

export function resolveQuitarVozPath(): string {
  const configured = process.env.QUITAR_VOZ_PATH?.trim();
  if (configured) {
    return path.resolve(configured.replace(/^~(?=$|\/|\\)/, process.env.HOME ?? ""));
  }
  return path.resolve(process.cwd(), "..", "quitar-voz");
}

export function resolvePythonBin(quitarVozPath: string): string {
  const configured = process.env.PYTHON_PATH?.trim();
  if (configured) {
    const resolved = path.resolve(
      configured.replace(/^~(?=$|\/|\\)/, process.env.HOME ?? ""),
    );
    if (fs.existsSync(resolved)) {
      return resolved;
    }
  }

  for (const rel of ["venv/bin/python3", "venv/bin/python", ".venv/bin/python3", ".venv/bin/python"]) {
    const candidate = path.join(quitarVozPath, rel);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return "python3";
}

function lastJsonLine(stdout: string): string {
  return (
    stdout
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .at(-1) ?? ""
  );
}

function killProcessTree(pid: number | undefined) {
  if (!pid) return;
  try {
    process.kill(pid, "SIGKILL");
  } catch {
    // ya terminó
  }
  try {
    process.kill(-pid, "SIGKILL");
  } catch {
    // sin grupo de procesos
  }
}

export function lastJsonPayload(stdout: string): { error?: string } {
  try {
    return JSON.parse(lastJsonLine(stdout) || "{}") as { error?: string };
  } catch {
    return {};
  }
}

type RunOptions = {
  scriptName: string;
  args: string[];
  extraEnv?: Record<string, string | undefined>;
  timeoutMs: number;
  signal?: AbortSignal;
};

export function runPythonScript(options: RunOptions): Promise<string> {
  const quitarVozPath = resolveQuitarVozPath();
  const python = resolvePythonBin(quitarVozPath);
  const scriptPath = path.join(process.cwd(), "scripts", options.scriptName);

  return new Promise((resolve, reject) => {
    if (options.signal?.aborted) {
      reject(new Error(PREEMPTED_ERROR));
      return;
    }

    const child = spawn(python, [scriptPath, ...options.args], {
      env: {
        ...process.env,
        QUITAR_VOZ_PATH: quitarVozPath,
        OMP_NUM_THREADS: "2",
        MKL_NUM_THREADS: "2",
        OPENBLAS_NUM_THREADS: "2",
        NUMEXPR_NUM_THREADS: "2",
        ONNXRUNTIME_INTRA_OP_NUM_THREADS: "2",
        ONNXRUNTIME_INTER_OP_NUM_THREADS: "1",
        ...options.extraEnv,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      options.signal?.removeEventListener("abort", onAbort);
      fn();
    };

    const onAbort = () => {
      killProcessTree(child.pid);
      finish(() => reject(new Error(PREEMPTED_ERROR)));
    };

    const timer = setTimeout(() => {
      killProcessTree(child.pid);
      finish(() =>
        reject(
          new Error(
            `Tiempo agotado (${Math.round(options.timeoutMs / 60000)} min). El proceso se detuvo para no tumbar el servidor.`,
          ),
        ),
      );
    }, options.timeoutMs);

    options.signal?.addEventListener("abort", onAbort, { once: true });

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });

    child.on("error", (err) => {
      finish(() => reject(new Error(`No se pudo ejecutar Python (${python}): ${err.message}`)));
    });

    child.on("close", (code) => {
      if (settled) return;
      if (code === 0) {
        finish(() => resolve(stdout));
        return;
      }
      const payload = lastJsonPayload(stdout);
      finish(() =>
        reject(
          new Error(
            payload.error ??
              (stderr.trim() || stdout.trim() || `Proceso Python falló (código ${code})`),
          ),
        ),
      );
    });
  });
}

export function parseOkJson<T extends { ok?: boolean; error?: string }>(
  stdout: string,
  emptyMessage: string,
): T {
  const last = lastJsonLine(stdout);
  if (!last) {
    throw new Error(emptyMessage);
  }
  const parsed = JSON.parse(last) as T;
  if (!parsed.ok) {
    throw new Error(parsed.error ?? emptyMessage);
  }
  return parsed;
}
