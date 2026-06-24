import fsp from "node:fs/promises";
import path from "node:path";
import { safeBasename } from "@/lib/musicDir";

export function lyricsPdfPath(musicDir: string, baseName: string): string {
  return path.join(musicDir, `${safeBasename(baseName)}.pdf`);
}

export function lyricsSidecarPath(musicDir: string, baseName: string): string {
  return path.join(musicDir, `${safeBasename(baseName)}.lyrics.txt`);
}

export async function readLyricsSidecar(
  musicDir: string,
  baseName: string,
): Promise<string | null> {
  try {
    const text = await fsp.readFile(lyricsSidecarPath(musicDir, baseName), "utf8");
    return text;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

export async function writeLyricsSidecar(
  musicDir: string,
  baseName: string,
  lyrics: string,
): Promise<void> {
  await fsp.writeFile(lyricsSidecarPath(musicDir, baseName), lyrics, "utf8");
}

export async function deleteLyricsSidecar(
  musicDir: string,
  baseName: string,
): Promise<void> {
  try {
    await fsp.unlink(lyricsSidecarPath(musicDir, baseName));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }
}

export async function pdfExists(musicDir: string, baseName: string): Promise<boolean> {
  try {
    await fsp.access(lyricsPdfPath(musicDir, baseName));
    return true;
  } catch {
    return false;
  }
}
