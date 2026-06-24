import fsp from "node:fs/promises";
import path from "node:path";
import { safeBasename } from "@/lib/musicDir";
import {
  deleteLyricsSidecar,
  lyricsPdfPath,
  lyricsSidecarPath,
  pdfExists,
} from "@/lib/lyricsStorage";
import {
  buildSongGroups,
  isAudioFile,
  parseAudioBaseName,
} from "@/lib/songGroups";
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
  const key = validateGroupKey(groupKey);
  const entries = await fsp.readdir(musicDir, { withFileTypes: true });

  const pdfBaseNames = new Set(
    entries
      .filter((e) => e.isFile() && path.extname(e.name).toLowerCase() === ".pdf")
      .map((e) => path.basename(e.name, path.extname(e.name)).toLowerCase()),
  );

  const raw = [];
  for (const entry of entries) {
    if (!entry.isFile() || !isAudioFile(entry.name)) continue;
    const baseName = path.basename(entry.name, path.extname(entry.name));
    const stat = await fsp.stat(path.join(musicDir, entry.name));
    raw.push({
      file: entry.name,
      baseName,
      size: stat.size,
      modifiedAt: stat.mtimeMs,
      parsed: parseAudioBaseName(baseName),
    });
  }

  const groups = buildSongGroups(raw, pdfBaseNames);
  return groups.find((g) => g.groupKey === key) ?? null;
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

export async function deleteSongGroup(
  musicDir: string,
  groupKey: string,
  scope: DeleteScope,
): Promise<{ deleted: string[] }> {
  const group = await findGroup(musicDir, groupKey);
  if (!group) {
    throw new Error("Canción no encontrada");
  }

  const deleted: string[] = [];

  if (scope === "all" || scope === "instrumental") {
    if (group.instrumentalFile) {
      await unlinkIfExists(path.join(musicDir, safeBasename(group.instrumentalFile)));
      deleted.push(group.instrumentalFile);
    }
  }

  if (scope === "all" || scope === "vocal") {
    if (group.vocalFile) {
      await unlinkIfExists(path.join(musicDir, safeBasename(group.vocalFile)));
      deleted.push(group.vocalFile);
    }
  }

  if (scope === "all" || scope === "lyrics") {
    const pdfPath = lyricsPdfPath(musicDir, group.groupKey);
    if (await unlinkIfExists(pdfPath)) {
      deleted.push(`${group.groupKey}.pdf`);
    }
    const sidecarPath = lyricsSidecarPath(musicDir, group.groupKey);
    if (await unlinkIfExists(sidecarPath)) {
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

  const renamed: string[] = [];

  async function renameAudioFile(oldName: string, newBaseName: string): Promise<void> {
    const safeOld = safeBasename(oldName);
    const ext = path.extname(safeOld);
    const newName = `${newBaseName}${ext}`;
    const oldPath = path.join(musicDir, safeOld);
    const newPath = path.join(musicDir, newName);

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

  const hasPdf = await pdfExists(musicDir, group.groupKey);
  if (hasPdf) {
    const oldPdf = lyricsPdfPath(musicDir, group.groupKey);
    const newPdf = lyricsPdfPath(musicDir, newGroupKey);
    await fsp.rename(oldPdf, newPdf);
    renamed.push(`${group.groupKey}.pdf → ${newGroupKey}.pdf`);
  }

  try {
    await fsp.access(lyricsSidecarPath(musicDir, group.groupKey));
    const oldSidecar = lyricsSidecarPath(musicDir, group.groupKey);
    const newSidecar = lyricsSidecarPath(musicDir, newGroupKey);
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
