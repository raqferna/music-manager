import type { StemId } from "@/lib/stems";
import { parseOkJson, runPythonScript, STEMS_JOB_TIMEOUT_MS } from "@/lib/pythonJob";

export type StemGenerateResult = {
  ok: true;
  groupKey: string;
  stems: Partial<Record<StemId, string>>;
  sourceFile?: string;
  message: string;
};

export async function generateStemsFromSource(
  musicDir: string,
  groupKey: string,
  signal?: AbortSignal,
): Promise<StemGenerateResult> {
  const stdout = await runPythonScript({
    scriptName: "separate_stems.py",
    args: [musicDir, groupKey],
    timeoutMs: STEMS_JOB_TIMEOUT_MS,
    signal,
  });
  return parseOkJson<StemGenerateResult>(
    stdout,
    "El script de separación no devolvió datos.",
  );
}
