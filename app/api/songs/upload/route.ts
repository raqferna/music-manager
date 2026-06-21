import fsp from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { isAudioFilename, maxUploadBytes } from "@/lib/audio";
import { getMusicDir, safeBasename } from "@/lib/musicDir";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Uploaded = { file: string; size: number };
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

export async function POST(req: NextRequest) {
  try {
    const dir = await getMusicDir();
    const formData = await req.formData();
    const entries = formData.getAll("files");

    if (entries.length === 0) {
      return NextResponse.json(
        { error: "No se recibió ningún archivo" },
        { status: 400 },
      );
    }

    const uploaded: Uploaded[] = [];
    const errors: UploadError[] = [];
    const limit = maxUploadBytes();

    for (const entry of entries) {
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

        const fileName = await uniqueFilename(dir, originalName);
        const outPath = path.join(dir, fileName);
        const bytes = Buffer.from(await entry.arrayBuffer());
        await fsp.writeFile(outPath, bytes);

        uploaded.push({ file: fileName, size: bytes.length });
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
