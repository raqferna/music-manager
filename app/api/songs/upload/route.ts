import fsp from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { isAudioFilename, maxUploadBytes } from "@/lib/audio";
import { resolveFolderDir, takenSlots } from "@/lib/library";
import { getMusicDir, safeBasename } from "@/lib/musicDir";
import { INSTRUMENTAL_SUFFIX, VOCAL_SUFFIX, parseAudioBaseName } from "@/lib/songGroups";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Uploaded = { file: string; size: number; groupKey: string; variant: string; folderId: string | null };
type UploadError = { name: string; error: string };

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fsp.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function uniqueFilename(dir: string, name: string): Promise<string> {
  const base = safeBasename(name);
  const ext = path.extname(base);
  const stem = path.basename(base, ext);
  let candidate = base;
  let i = 1;

  while (await fileExists(path.join(dir, candidate))) {
    candidate = `${stem}-${i}${ext}`;
    i += 1;
  }

  return candidate;
}

type Variant = "vocal" | "instrumental";

const MAX_TITLE_LENGTH = 150;

/** Limpia el título que escribe el usuario para usarlo como nombre de archivo. */
function cleanTitle(raw: string): string {
  const title = raw
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\\/:*?"<>|]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_TITLE_LENGTH)
    .trim();
  if (!title || title === "." || title === "..") {
    throw new Error("El título no puede estar vacío");
  }
  return title;
}

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  try {
    const root = await getMusicDir();
    const formData = await req.formData();
    const entries = formData.getAll("files");
    const titles = formData.getAll("titles").map((t) => (typeof t === "string" ? t : ""));
    const variant: Variant = formData.get("variant") === "instrumental" ? "instrumental" : "vocal";
    const folderRaw = typeof formData.get("folderId") === "string" ? String(formData.get("folderId")) : "";
    const folderId = folderRaw.trim() ? folderRaw.trim() : null;
    const dir = await resolveFolderDir(root, folderId);
    // Con títulos (uno por archivo) el archivo se guarda como "Título (con voz).ext".
    const useTitles = titles.length > 0 && titles.length === entries.length;
    const taken = useTitles ? await takenSlots(root) : new Set<string>();

    if (entries.length === 0) {
      return NextResponse.json(
        { error: "No se recibió ningún archivo" },
        { status: 400 },
      );
    }

    const uploaded: Uploaded[] = [];
    const errors: UploadError[] = [];
    const limit = maxUploadBytes();

    for (const [index, entry] of entries.entries()) {
      if (!(entry instanceof File)) continue;

      const originalName = entry.name || "sin-nombre";
      try {
        if (!isAudioFilename(originalName)) {
          throw new Error("Formato no soportado (usa mp3, wav, m4a, flac, ogg o aac)");
        }
        if (entry.size === 0) {
          throw new Error("El archivo está vacío");
        }
        if (entry.size > limit) {
          throw new Error(`Supera el límite de ${Math.round(limit / (1024 * 1024))} MB`);
        }

        let fileName: string;
        if (useTitles) {
          const title = cleanTitle(titles[index]);
          const slot = `${title.toLowerCase()}|${variant}`;
          if (taken.has(slot)) {
            throw new Error(
              `Ya hay una canción "${title}" ${variant === "vocal" ? "con voz" : "sin voz"}. Cambia el título o bórrala antes.`,
            );
          }
          const suffix = variant === "vocal" ? VOCAL_SUFFIX : INSTRUMENTAL_SUFFIX;
          fileName = `${title}${suffix}${path.extname(originalName).toLowerCase()}`;
          taken.add(slot);
        } else {
          fileName = await uniqueFilename(dir, originalName);
        }
        const outPath = path.join(dir, fileName);
        const bytes = Buffer.from(await entry.arrayBuffer());
        await fsp.writeFile(outPath, bytes);

        const parsed = parseAudioBaseName(path.basename(fileName, path.extname(fileName)));
        uploaded.push({
          file: fileName,
          size: bytes.length,
          groupKey: parsed.groupKey,
          variant: parsed.variant,
          folderId,
        });
      } catch (err) {
        errors.push({
          name: originalName,
          error: err instanceof Error ? err.message : "Error desconocido",
        });
      }
    }

    if (uploaded.length === 0) {
      return NextResponse.json(
        { error: "No se pudo subir ningún archivo", errors },
        { status: 400 },
      );
    }

    return NextResponse.json({ uploaded, errors });
  } catch (err) {
    console.error("/api/songs/upload error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error desconocido" },
      { status: 500 },
    );
  }
}
