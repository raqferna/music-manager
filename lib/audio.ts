export const AUDIO_EXTS = new Set([
  ".mp3",
  ".wav",
  ".m4a",
  ".flac",
  ".ogg",
  ".aac",
]);

export const AUDIO_ACCEPT = Array.from(AUDIO_EXTS).join(",");

const MAX_BYTES = 200 * 1024 * 1024; // 200 MB

export function isAudioExtension(ext: string): boolean {
  return AUDIO_EXTS.has(ext.toLowerCase());
}

export function isAudioFilename(name: string): boolean {
  const dot = name.lastIndexOf(".");
  if (dot < 0) return false;
  return isAudioExtension(name.slice(dot));
}

export function maxUploadBytes(): number {
  return MAX_BYTES;
}
