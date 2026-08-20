import {
  INSTRUMENTAL_JOB_TIMEOUT_MS,
  parseOkJson,
  runPythonScript,
} from "@/lib/pythonJob";
import { resolveSeparationModelFile } from "@/lib/separationModel";

export type InstrumentalGenerateResult = {
  ok: true;
  groupKey: string;
  file: string;
  sourceFile?: string;
  message: string;
};

export async function generateInstrumentalFromVocal(
  musicDir: string,
  groupKey: string,
  signal?: AbortSignal,
): Promise<InstrumentalGenerateResult> {
  const stdout = await runPythonScript({
    scriptName: "add_instrumental.py",
    args: [musicDir, groupKey],
    extraEnv: {
      SEPARATION_MODEL_FILE: resolveSeparationModelFile(),
    },
    timeoutMs: INSTRUMENTAL_JOB_TIMEOUT_MS,
    signal,
  });
  return parseOkJson<InstrumentalGenerateResult>(
    stdout,
    "El script de separación no devolvió datos.",
  );
}
