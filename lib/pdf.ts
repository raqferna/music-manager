export const PDF_ACCEPT = "application/pdf,.pdf";
export const MAX_LYRICS_PDF_BYTES = 30 * 1024 * 1024;

export function isPdfFilename(name: string): boolean {
  return name.toLowerCase().endsWith(".pdf");
}

export function looksLikePdf(bytes: Uint8Array): boolean {
  if (bytes.length < 5) return false;
  return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
}

export function maxLyricsPdfBytes(): number {
  return MAX_LYRICS_PDF_BYTES;
}
