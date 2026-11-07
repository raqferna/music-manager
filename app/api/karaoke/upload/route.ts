import { createWriteStream } from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { isVideoFilename, maxKaraokeBytes } from "@/lib/karaoke";
import { saveKaraokeVideoFile } from "@/lib/karaokeStorage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

async function writeFileFromUpload(file: File, outPath: string): Promise<void> {
  const nodeStream = Readable.fromWeb(
    file.stream() as import("node:stream/web").ReadableStream,
  );
  await pipeline(nodeStream, createWriteStream(outPath));
}

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  try {
    const formData = await req.formData();
    const entry = formData.get("file");
    const titleRaw = typeof formData.get("title") === "string" ? String(formData.get("title")) : "";

    if (!(entry instanceof File)) {
      return NextResponse.json({ error: "No se recibió ningún vídeo" }, { status: 400 });
    }

    const originalName = entry.name || "sin-nombre";
    if (!isVideoFilename(originalName)) {
      return NextResponse.json(
        { error: "Formato no soportado (usa mp4, webm, mov, mkv, m4v u ogv)" },
        { status: 400 },
      );
    }
    if (entry.size === 0) {
      return NextResponse.json({ error: "El archivo está vacío" }, { status: 400 });
    }
    const limit = maxKaraokeBytes();
    if (entry.size > limit) {
      return NextResponse.json(
        { error: `Supera el límite de ${Math.round(limit / (1024 * 1024))} MB` },
        { status: 400 },
      );
    }

    const video = await saveKaraokeVideoFile(titleRaw || originalName, originalName, (outPath) =>
      writeFileFromUpload(entry, outPath),
    );
    return NextResponse.json({ ok: true, video });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    const status =
      message.startsWith("Ya hay") ||
      message.startsWith("El título") ||
      message.startsWith("Formato")
        ? 400
        : 500;
    console.error("/api/karaoke/upload error", err);
    return NextResponse.json({ error: message }, { status });
  }
}
