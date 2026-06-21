import { spawn } from "node:child_process";
import path from "node:path";

export type YoutubeImportResult = {
  ok: true;
  baseName: string;
  artist: string;
  title: string;
  file: string;
  lyrics: string | null;
  lyricsSource: string | null;
  hasLyrics: boolean;
  message: string;
};

function resolvePythonBin(): string {
  return process.env.PYTHON_PATH?.trim() || "python3";
}

function resolveQuitarVozPath(): string {
  const configured = process.env.QUITAR_VOZ_PATH?.trim();
  if (configured) {
    return path.resolve(configured.replace(/^~(?=$|\/|\\)/, process.env.HOME ?? ""));
  }
  return path.resolve(process.cwd(), "..", "quitar-voz");
}

function parseScriptOutput(stdout: string): YoutubeImportResult {
  const lines = stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const last = lines.at(-1);
  if (!last) {
    throw new Error("El script de importación no devolvió datos.");
  }
  const parsed = JSON.parse(last) as YoutubeImportResult & { ok?: boolean; error?: string };
  if (!parsed.ok) {
    throw new Error(parsed.error ?? "Error desconocido al importar desde YouTube");
  }
  return parsed;
}

export async function importSongFromYoutube(
  url: string,
  musicDir: string,
): Promise<YoutubeImportResult> {
  const scriptPath = path.join(process.cwd(), "scripts", "import_youtube.py");
  const python = resolvePythonBin();
  const quitarVozPath = resolveQuitarVozPath();

  return new Promise((resolve, reject) => {
    const child = spawn(python, [scriptPath, url, musicDir], {
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
          resolve(parseScriptOutput(stdout));
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
        reject(new Error(payload.error ?? stderr.trim() ?? `Importación fallida (código ${code})`));
      } catch {
        reject(new Error(stderr.trim() || stdout.trim() || `Importación fallida (código ${code})`));
      }
    });
  });
}
