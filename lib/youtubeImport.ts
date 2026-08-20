import {
  parseOkJson,
  runPythonScript,
  YOUTUBE_JOB_TIMEOUT_MS,
} from "@/lib/pythonJob";
import { resolveSeparationModelFile } from "@/lib/separationModel";

export type YoutubeImportResult = {
  ok: true;
  groupKey: string;
  baseName: string;
  artist: string;
  title: string;
  file: string;
  instrumentalFile: string | null;
  vocalFile: string;
  partial?: boolean;
  separationError?: string;
  lyrics: string | null;
  lyricsSource: string | null;
  hasLyrics: boolean;
  message: string;
};

export async function importSongFromYoutube(
  url: string,
  musicDir: string,
  signal?: AbortSignal,
): Promise<YoutubeImportResult> {
  const stdout = await runPythonScript({
    scriptName: "import_youtube.py",
    args: [url, musicDir],
    extraEnv: {
      SEPARATION_MODEL_FILE: resolveSeparationModelFile(),
    },
    timeoutMs: YOUTUBE_JOB_TIMEOUT_MS,
    signal,
  });
  return parseOkJson<YoutubeImportResult>(
    stdout,
    "El script de importación no devolvió datos.",
  );
}
