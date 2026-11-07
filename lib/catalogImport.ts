import fsp from "node:fs/promises";
import path from "node:path";
import { findLibraryGroup, folderDir, loadLibrary, resolveFolderDir } from "@/lib/library";
import { lyricsPdfPath, lyricsSidecarPath } from "@/lib/lyricsStorage";
import { getMusicDir, safeBasename } from "@/lib/musicDir";
import { isAudioFile, parseAudioBaseName } from "@/lib/songGroups";
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
  const { groups } = await loadLibrary(dir);
  return groups;
}

function insideDir(dir: string, fileName: string): string {
  const root = path.resolve(dir);
  const target = path.resolve(root, safeBasename(fileName));
  if (target !== path.join(root, path.basename(target))) {
    throw new Error("Nombre de archivo inválido");
  }
  return target;
}

async function filesForGroup(root: string, group: SongGroup): Promise<string[]> {
  const dir = folderDir(root, group.folderId);
  const key = safeBasename(group.groupKey);
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

export async function copyCatalogGroups(
  groupKeys: string[],
  destFolderId?: string | null,
): Promise<{
  copied: string[];
  files: number;
}> {
  const source = getCatalogMusicDir();
  if (!source || !(await dirExists(source))) {
    throw new Error("El catálogo personal no está conectado");
  }

  const destRoot = await getMusicDir();
  const destDir = await resolveFolderDir(destRoot, destFolderId ?? null);
  const sourceGroups = await loadSongGroups(source);
  const available = new Map(sourceGroups.map((group) => [group.groupKey, group]));
  const copied: string[] = [];
  let files = 0;

  for (const raw of groupKeys) {
    const groupKey = safeBasename(raw.trim());
    const group = available.get(groupKey);
    if (!group) continue;
    if (await findLibraryGroup(destRoot, groupKey)) continue;

    const sourceDir = folderDir(source, group.folderId);
    for (const name of await filesForGroup(source, group)) {
      await fsp.copyFile(insideDir(sourceDir, name), insideDir(destDir, name));
      files += 1;
    }
    copied.push(groupKey);
  }

  return { copied, files };
}
