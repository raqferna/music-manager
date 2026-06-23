/** Modelos de audio-separator: `fast` prioriza velocidad en CPU. */
const MODELS = {
  fast: "UVR-MDX-NET-Inst_3.onnx",
  quality: "MDX23C-8KFFT-InstVoc_HQ.ckpt",
} as const;

export type SeparationMode = keyof typeof MODELS;

export function resolveSeparationMode(): SeparationMode {
  const raw = process.env.SEPARATION_MODEL?.trim().toLowerCase() ?? "fast";
  if (raw === "quality" || raw === "fast") {
    return raw;
  }
  return "fast";
}

export function resolveSeparationModelFile(): string {
  const explicit = process.env.SEPARATION_MODEL_FILE?.trim();
  if (explicit) {
    return explicit;
  }

  const mode = resolveSeparationMode();
  return MODELS[mode];
}

export function separationModelLabel(): string {
  return resolveSeparationMode() === "quality" ? "máxima calidad" : "rápido";
}
