import fsp from "node:fs/promises";
import path from "node:path";
import {
  findLibraryGroup,
  folderDir,
  resolveLibraryFile,
} from "@/lib/library";
import {
  deleteLyricsSidecar,
  lyricsPdfPath,
  lyricsSidecarPath,
  pdfExists,
} from "@/lib/lyricsStorage";
import { safeBasename } from "@/lib/musicDir";
import { parseAudioBaseName } from "@/lib/songGroups";
import type { SongGroup } from "@/lib/types";

export type DeleteScope = "all" | "instrumental" | "vocal" | "lyrics";

export function validateGroupKey(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("El nombre no puede estar vacío");
  }
  if (trimmed.includes("/") || trimmed.includes("\\")) {
    throw new Error("El nombre no puede contener barras");
  }
  if (trimmed === "." || trimmed === "..") {
    throw new Error("Nombre de archivo inválido");
  }
  return trimmed;
}

async function findGroup(musicDir: string, groupKey: string): Promise<SongGroup | null> {
  return findLibraryGroup(musicDir, validateGroupKey(groupKey));
}

async function unlinkIfExists(filePath: string): Promise<boolean> {
  try {
    await fsp.unlink(filePath);
    return true;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw err;
  }
}

async function unlinkLibraryFile(musicDir: string, fileName: string): Promise<boolean> {
  try {
    const filePath = await resolveLibraryFile(musicDir, fileName);
    return unlinkIfExists(filePath);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw err;
  }
}

export async function deleteSongGroup(
  musicDir: string,
  groupKey: string,
  scope: DeleteScope,
): Promise<{ deleted: string[] }> {
  const group = await findGroup(musicDir, groupKey);
  if (!group) {
    throw new Error("Canción no encontrada");
  }

  const songDir = folderDir(musicDir, group.folderId);
  const deleted: string[] = [];

  if (scope === "all" || scope === "instrumental") {
    if (group.instrumentalFile) {
      if (await unlinkLibraryFile(musicDir, group.instrumentalFile)) {
        deleted.push(group.instrumentalFile);
      }
    }
  }

  if (scope === "all" || scope === "vocal") {
    if (group.vocalFile) {
      if (await unlinkLibraryFile(musicDir, group.vocalFile)) {
        deleted.push(group.vocalFile);
      }
    }
  }

  if (scope === "all") {
    for (const stemFile of Object.values(group.stemFiles)) {
      if (!stemFile) continue;
      if (await unlinkLibraryFile(musicDir, stemFile)) {
        deleted.push(stemFile);
      }
    }
  }

  if (scope === "all" || scope === "lyrics") {
    if (await unlinkIfExists(lyricsPdfPath(songDir, group.groupKey))) {
      deleted.push(`${group.groupKey}.pdf`);
    }
    if (await unlinkIfExists(lyricsSidecarPath(songDir, group.groupKey))) {
      deleted.push(`${group.groupKey}.lyrics.txt`);
    }
  }

  if (deleted.length === 0) {
    throw new Error("No hay archivos que eliminar para esta opción");
  }

  return { deleted };
}

export async function renameSongGroup(
  musicDir: string,
  groupKey: string,
  newGroupKeyRaw: string,
): Promise<{ newGroupKey: string; renamed: string[] }> {
  const group = await findGroup(musicDir, groupKey);
  if (!group) {
    throw new Error("Canción no encontrada");
  }

  const newGroupKey = validateGroupKey(newGroupKeyRaw);
  if (newGroupKey === group.groupKey) {
    return { newGroupKey, renamed: [] };
  }

  const existing = await findGroup(musicDir, newGroupKey);
  if (existing) {
    throw new Error("Ya existe otra canción con ese nombre");
  }

  const songDir = folderDir(musicDir, group.folderId);
  const renamed: string[] = [];

  async function renameAudioFile(oldName: string, newBaseName: string): Promise<void> {
    const safeOld = safeBasename(oldName);
    const ext = path.extname(safeOld);
    const newName = `${newBaseName}${ext}`;
    const oldPath = path.join(songDir, safeOld);
    const newPath = path.join(songDir, newName);

    try {
      await fsp.access(newPath);
      throw new Error(`Ya existe el archivo ${newName}`);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
        if (err instanceof Error && err.message.startsWith("Ya existe")) throw err;
        throw err;
      }
    }

    await fsp.rename(oldPath, newPath);
    renamed.push(`${safeOld} → ${newName}`);
  }

  if (group.instrumentalFile) {
    const base = path.basename(group.instrumentalFile, path.extname(group.instrumentalFile));
    const parsed = parseAudioBaseName(base);
    const newBase =
      parsed.variant === "instrumental" && base !== group.groupKey
        ? `${newGroupKey} (instrumental)`
        : newGroupKey;
    await renameAudioFile(group.instrumentalFile, newBase);
  }

  if (group.vocalFile) {
    await renameAudioFile(group.vocalFile, `${newGroupKey} (con voz)`);
  }

  const hasPdf = await pdfExists(songDir, group.groupKey);
  if (hasPdf) {
    const oldPdf = lyricsPdfPath(songDir, group.groupKey);
    const newPdf = lyricsPdfPath(songDir, newGroupKey);
    await fsp.rename(oldPdf, newPdf);
    renamed.push(`${group.groupKey}.pdf → ${newGroupKey}.pdf`);
  }

  try {
    await fsp.access(lyricsSidecarPath(songDir, group.groupKey));
    const oldSidecar = lyricsSidecarPath(songDir, group.groupKey);
    const newSidecar = lyricsSidecarPath(songDir, newGroupKey);
    await fsp.rename(oldSidecar, newSidecar);
    renamed.push(`${group.groupKey}.lyrics.txt → ${newGroupKey}.lyrics.txt`);
  } catch {
    // Sin sidecar, no pasa nada.
  }

  if (renamed.length === 0) {
    throw new Error("No hay archivos que renombrar");
  }

  return { newGroupKey, renamed };
}
