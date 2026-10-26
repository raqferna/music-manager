import fsp from "node:fs/promises";
import path from "node:path";
import { lyricsPdfPath, lyricsSidecarPath } from "@/lib/lyricsStorage";
import { getMusicDir, safeBasename } from "@/lib/musicDir";
import { buildSongGroups, isAudioFile, parseAudioBaseName } from "@/lib/songGroups";
import type { SongGroup } from "@/lib/types";

function env(name: string): string {
  return process.env[name]?.trim() ?? "";
}

export function getCatalogMusicDir(): string | null {
  const configured = env("CATALOG_MUSIC_DIR");
  return configured.length > 0 ? configured : null;
}

async function dirExists(dir: string): Promise<boolean> {
  try {
    const stat = await fsp.stat(dir);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

export async function catalogIsAvailable(): Promise<boolean> {
  const dir = getCatalogMusicDir();
  if (!dir) return false;
  return dirExists(dir);
}

export async function loadSongGroups(dir: string): Promise<SongGroup[]> {
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  const pdfBaseNames = new Set(
    entries
      .filter((entry) => entry.isFile() && path.extname(entry.name).toLowerCase() === ".pdf")
      .map((entry) => path.basename(entry.name, path.extname(entry.name)).toLowerCase()),
  );

  const raw = [];
  for (const entry of entries) {
    if (!entry.isFile() || !isAudioFile(entry.name)) continue;
    const baseName = path.basename(entry.name, path.extname(entry.name));
    const stat = await fsp.stat(path.join(dir, entry.name));
    raw.push({
      file: entry.name,
      baseName,
      size: stat.size,
      modifiedAt: stat.mtimeMs,
      parsed: parseAudioBaseName(baseName),
    });
  }

  return buildSongGroups(raw, pdfBaseNames);
}

function insideDir(dir: string, fileName: string): string {
  const root = path.resolve(dir);
  const target = path.resolve(root, safeBasename(fileName));
  if (target !== path.join(root, path.basename(target))) {
    throw new Error("Nombre de archivo inválido");
  }
  return target;
}

async function filesForGroup(dir: string, groupKey: string): Promise<string[]> {
  const key = safeBasename(groupKey);
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  const names: string[] = [];

  for (const entry of entries) {
    if (!entry.isFile() || !isAudioFile(entry.name)) continue;
    const baseName = path.basename(entry.name, path.extname(entry.name));
    if (parseAudioBaseName(baseName).groupKey !== key) continue;
    names.push(entry.name);
  }

  for (const candidate of [
    path.basename(lyricsPdfPath(dir, key)),
    path.basename(lyricsSidecarPath(dir, key)),
  ]) {
    try {
      await fsp.access(path.join(dir, candidate));
      names.push(candidate);
    } catch {
      // La canción puede no tener letra.
    }
  }

  return names;
}

export async function copyCatalogGroups(groupKeys: string[]): Promise<{
  copied: string[];
  files: number;
}> {
  const source = getCatalogMusicDir();
  if (!source || !(await dirExists(source))) {
    throw new Error("El catálogo personal no está conectado");
  }

  const dest = await getMusicDir();
  const available = new Set((await loadSongGroups(source)).map((group) => group.groupKey));
  const copied: string[] = [];
  let files = 0;

  for (const raw of groupKeys) {
    const groupKey = safeBasename(raw.trim());
    if (!available.has(groupKey)) continue;

    for (const name of await filesForGroup(source, groupKey)) {
      await fsp.copyFile(insideDir(source, name), insideDir(dest, name));
      files += 1;
    }
    copied.push(groupKey);
  }

  return { copied, files };
}
