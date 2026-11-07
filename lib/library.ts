import fsp from "node:fs/promises";
import path from "node:path";
import { KARAOKE_DIR_NAME } from "@/lib/karaoke";
import { lyricsPdfPath, lyricsSidecarPath } from "@/lib/lyricsStorage";
import { safeBasename } from "@/lib/musicDir";
import {
  buildSongGroups,
  isAudioFile,
  parseAudioBaseName,
} from "@/lib/songGroups";
import type { LibraryFolder, SongGroup } from "@/lib/types";

export { UNFILED_FOLDER_LABEL } from "@/lib/libraryFoldersShared";
const MAX_FOLDER_NAME = 80;

export function isReservedDir(name: string): boolean {
  return name.startsWith(".") || name.toLowerCase() === KARAOKE_DIR_NAME;
}

export function sanitizeFolderName(raw: string): string {
  const name = raw
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\\/:*?"<>|]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_FOLDER_NAME)
    .trim();
  if (!name || name === "." || name === "..") {
    throw new Error("El nombre de la carpeta no puede estar vacío");
  }
  if (isReservedDir(name)) {
    throw new Error("Ese nombre de carpeta está reservado");
  }
  return name;
}

export function folderDir(musicDir: string, folderId: string | null): string {
  if (!folderId) return musicDir;
  return path.join(musicDir, safeBasename(folderId));
}

async function dirExists(dir: string): Promise<boolean> {
  try {
    const stat = await fsp.stat(dir);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

export async function listFolders(musicDir: string): Promise<LibraryFolder[]> {
  const entries = await fsp.readdir(musicDir, { withFileTypes: true });
  const folders: LibraryFolder[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || isReservedDir(entry.name)) continue;
    folders.push({ id: entry.name, name: entry.name });
  }
  folders.sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" }));
  return folders;
}

export async function createFolder(
  musicDir: string,
  rawName: string,
): Promise<LibraryFolder> {
  const name = sanitizeFolderName(rawName);
  const existing = await listFolders(musicDir);
  if (existing.some((folder) => folder.id.toLowerCase() === name.toLowerCase())) {
    throw new Error("Ya existe una carpeta con ese nombre");
  }
  await fsp.mkdir(path.join(musicDir, name), { recursive: false });
  return { id: name, name };
}

export async function renameFolder(
  musicDir: string,
  folderId: string,
  rawName: string,
): Promise<LibraryFolder> {
  const current = safeBasename(folderId);
  const name = sanitizeFolderName(rawName);
  const source = path.join(musicDir, current);
  if (!(await dirExists(source))) {
    throw new Error("Carpeta no encontrada");
  }
  if (current === name) {
    return { id: current, name: current };
  }
  const existing = await listFolders(musicDir);
  if (existing.some((folder) => folder.id.toLowerCase() === name.toLowerCase())) {
    throw new Error("Ya existe una carpeta con ese nombre");
  }
  const dest = path.join(musicDir, name);
  await fsp.rename(source, dest);
  return { id: name, name };
}

export async function deleteFolder(musicDir: string, folderId: string): Promise<void> {
  const current = safeBasename(folderId);
  const source = path.join(musicDir, current);
  if (!(await dirExists(source))) {
    throw new Error("Carpeta no encontrada");
  }

  const { groups } = await loadLibrary(musicDir);
  for (const group of groups) {
    if (group.folderId === current) {
      await moveSongToFolder(musicDir, group.groupKey, null);
    }
  }

  try {
    await fsp.unlink(path.join(source, ".DS_Store"));
  } catch {
    // macOS deja este archivo a veces.
  }
  try {
    await fsp.rmdir(source);
  } catch {
    throw new Error("No se pudo borrar la carpeta porque aún tiene archivos");
  }
}

type ScannedFile = {
  file: string;
  baseName: string;
  size: number;
  modifiedAt: number;
  parsed: ReturnType<typeof parseAudioBaseName>;
  folderId: string | null;
};

async function scanAudioDir(
  dir: string,
  folderId: string | null,
): Promise<{ raw: ScannedFile[]; pdfBaseNames: Set<string> }> {
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  const pdfBaseNames = new Set(
    entries
      .filter((entry) => entry.isFile() && path.extname(entry.name).toLowerCase() === ".pdf")
      .map((entry) => path.basename(entry.name, path.extname(entry.name)).toLowerCase()),
  );

  const raw: ScannedFile[] = [];
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
      folderId,
    });
  }
  return { raw, pdfBaseNames };
}

export function sortLibraryGroups(
  groups: SongGroup[],
  folders: LibraryFolder[],
): SongGroup[] {
  const order = new Map(folders.map((folder, index) => [folder.id, index]));
  return [...groups].sort((a, b) => {
    const ai = a.folderId ? (order.get(a.folderId) ?? 9999) : 10000;
    const bi = b.folderId ? (order.get(b.folderId) ?? 9999) : 10000;
    if (ai !== bi) return ai - bi;
    return a.title.localeCompare(b.title, "es", { sensitivity: "base" });
  });
}

export async function loadLibrary(musicDir: string): Promise<{
  folders: LibraryFolder[];
  groups: SongGroup[];
}> {
  const folders = await listFolders(musicDir);
  const allRaw: ScannedFile[] = [];
  const pdfBaseNames = new Set<string>();
  const folderByGroupKey = new Map<string, string | null>();

  const root = await scanAudioDir(musicDir, null);
  allRaw.push(...root.raw);
  for (const name of root.pdfBaseNames) pdfBaseNames.add(name);

  for (const folder of folders) {
    const scanned = await scanAudioDir(folderDir(musicDir, folder.id), folder.id);
    allRaw.push(...scanned.raw);
    for (const name of scanned.pdfBaseNames) pdfBaseNames.add(name);
  }

  for (const entry of allRaw) {
    const key = entry.parsed.groupKey;
    if (!folderByGroupKey.has(key)) {
      folderByGroupKey.set(key, entry.folderId);
    }
  }

  const groups = buildSongGroups(allRaw, pdfBaseNames).map((group) => ({
    ...group,
    folderId: folderByGroupKey.get(group.groupKey) ?? null,
  }));

  return { folders, groups: sortLibraryGroups(groups, folders) };
}

export async function findLibraryGroup(
  musicDir: string,
  groupKey: string,
): Promise<SongGroup | null> {
  const key = groupKey.trim();
  if (!key) return null;
  const { groups } = await loadLibrary(musicDir);
  return groups.find((group) => group.groupKey === key) ?? null;
}

export async function resolveGroupDir(musicDir: string, groupKey: string): Promise<string> {
  const group = await findLibraryGroup(musicDir, groupKey);
  if (!group) {
    throw new Error("Canción no encontrada");
  }
  return folderDir(musicDir, group.folderId);
}

export async function resolveFolderDir(
  musicDir: string,
  folderId: string | null | undefined,
): Promise<string> {
  if (!folderId) return musicDir;
  const name = sanitizeFolderName(folderId);
  const dest = folderDir(musicDir, name);
  if (!(await dirExists(dest))) {
    throw new Error("Carpeta no encontrada");
  }
  return dest;
}

export async function resolveLibraryFile(musicDir: string, fileName: string): Promise<string> {
  const safe = safeBasename(fileName);
  const direct = path.join(musicDir, safe);
  try {
    const stat = await fsp.stat(direct);
    if (stat.isFile()) return direct;
  } catch {
    // Buscar en subcarpetas.
  }

  const folders = await listFolders(musicDir);
  for (const folder of folders) {
    const candidate = path.join(folderDir(musicDir, folder.id), safe);
    try {
      const stat = await fsp.stat(candidate);
      if (stat.isFile()) return candidate;
    } catch {
      // Siguiente carpeta.
    }
  }

  const err = new Error("No encontrado") as NodeJS.ErrnoException;
  err.code = "ENOENT";
  throw err;
}

export async function takenSlots(musicDir: string): Promise<Set<string>> {
  const { groups } = await loadLibrary(musicDir);
  const taken = new Set<string>();
  for (const group of groups) {
    if (group.hasVocal) taken.add(`${group.groupKey.toLowerCase()}|vocal`);
    if (group.hasInstrumental) taken.add(`${group.groupKey.toLowerCase()}|instrumental`);
    if (group.hasStems) taken.add(`${group.groupKey.toLowerCase()}|stem`);
  }
  return taken;
}

function groupFileNames(group: SongGroup): string[] {
  const names = [
    group.instrumentalFile,
    group.vocalFile,
    ...Object.values(group.stemFiles),
  ].filter((name): name is string => Boolean(name));
  if (group.hasLyrics) names.push(`${group.groupKey}.pdf`);
  names.push(`${group.groupKey}.lyrics.txt`);
  return names;
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fsp.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function moveSongToFolder(
  musicDir: string,
  groupKey: string,
  folderId: string | null,
): Promise<SongGroup> {
  const group = await findLibraryGroup(musicDir, groupKey);
  if (!group) {
    throw new Error("Canción no encontrada");
  }

  const nextId = folderId ? sanitizeFolderName(folderId) : null;
  if ((group.folderId ?? null) === nextId) {
    return group;
  }

  const destDir = await resolveFolderDir(musicDir, nextId);
  const sourceDir = folderDir(musicDir, group.folderId);

  for (const name of groupFileNames(group)) {
    const from = path.join(sourceDir, safeBasename(name));
    const to = path.join(destDir, safeBasename(name));
    if (!(await fileExists(from))) continue;
    if (from === to) continue;
    if (await fileExists(to)) {
      throw new Error(`Ya existe ${name} en esa carpeta`);
    }
    await fsp.rename(from, to);
  }

  const moved = await findLibraryGroup(musicDir, group.groupKey);
  if (!moved) {
    throw new Error("No se pudo mover la canción");
  }
  return moved;
}

export function groupLyricsPdfPath(musicDir: string, group: SongGroup): string {
  return lyricsPdfPath(folderDir(musicDir, group.folderId), group.groupKey);
}

export function groupLyricsSidecarPath(musicDir: string, group: SongGroup): string {
  return lyricsSidecarPath(folderDir(musicDir, group.folderId), group.groupKey);
}
