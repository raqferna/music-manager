import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export type TranscribeResult = {
  ok: true;
  lyrics: string;
  language?: string;
  duration?: number;
  model?: string;
};

function resolveQuitarVozPath(): string {
  const configured = process.env.QUITAR_VOZ_PATH?.trim();
  if (configured) {
    return path.resolve(configured.replace(/^~(?=$|\/|\\)/, process.env.HOME ?? ""));
  }
  return path.resolve(process.cwd(), "..", "quitar-voz");
}

function resolvePythonBin(quitarVozPath: string): string {
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

function parseOutput(stdout: string): TranscribeResult {
  const last =
    stdout
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .at(-1) ?? "";
  if (!last) {
    throw new Error("El script de transcripción no devolvió datos.");
  }
  const parsed = JSON.parse(last) as TranscribeResult & { ok?: boolean; error?: string };
  if (!parsed.ok) {
    throw new Error(parsed.error ?? "Error desconocido al transcribir");
  }
  return parsed;
}

export async function transcribeLyricsFromAudio(
  audioPath: string,
): Promise<TranscribeResult> {
  const scriptPath = path.join(process.cwd(), "scripts", "transcribe_lyrics.py");
  const quitarVozPath = resolveQuitarVozPath();
  const python = resolvePythonBin(quitarVozPath);

  return new Promise((resolve, reject) => {
    const child = spawn(python, [scriptPath, audioPath], {
      env: {
        ...process.env,
        QUITAR_VOZ_PATH: quitarVozPath,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });

    child.on("error", (err) => {
      reject(new Error(`No se pudo ejecutar Python (${python}): ${err.message}`));
    });

    child.on("close", (code) => {
      if (code === 0) {
        try {
          resolve(parseOutput(stdout));
        } catch (err) {
          reject(err instanceof Error ? err : new Error(String(err)));
        }
        return;
      }

      try {
        const payload = JSON.parse(
          stdout
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean)
            .at(-1) ?? "{}",
        ) as { error?: string };
        reject(new Error(payload.error ?? stderr.trim() ?? `Transcripción fallida (código ${code})`));
      } catch {
        reject(new Error(stderr.trim() || stdout.trim() || `Transcripción fallida (código ${code})`));
      }
    });
  });
}
