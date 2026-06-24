import fsp from "node:fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { getMusicDir, safeBasename } from "@/lib/musicDir";
import { generatePdfFromText } from "@/lib/lyricsPdf";
import {
  deleteLyricsSidecar,
  lyricsPdfPath,
  pdfExists,
  readLyricsSidecar,
  writeLyricsSidecar,
} from "@/lib/lyricsStorage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Body = {
  baseName: string;
  title?: string;
  lyrics?: string;
  pdfUrl?: string;
};

async function downloadPdf(url: string): Promise<Uint8Array> {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) {
    throw new Error(`No se pudo descargar el PDF (HTTP ${res.status})`);
  }
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("pdf") && !url.toLowerCase().endsWith(".pdf")) {
    throw new Error(`La URL no parece apuntar a un PDF (content-type: ${ct})`);
  }
  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
}

export async function GET(req: NextRequest) {
  try {
    const baseName = safeBasename(req.nextUrl.searchParams.get("baseName") ?? "");
    if (!baseName) {
      return NextResponse.json({ error: "Falta baseName" }, { status: 400 });
    }

    const dir = await getMusicDir();
    const hasPdf = await pdfExists(dir, baseName);
    const sidecar = await readLyricsSidecar(dir, baseName);

    return NextResponse.json({
      baseName,
      title: baseName,
      lyrics: sidecar ?? "",
      hasPdf,
      hasSidecar: sidecar !== null,
    });
  } catch (err) {
    console.error("/api/lyrics GET error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error desconocido" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    if (!body?.baseName) {
      return NextResponse.json({ error: "Falta baseName" }, { status: 400 });
    }
    const baseName = safeBasename(body.baseName);
    const dir = await getMusicDir();
    const outPath = lyricsPdfPath(dir, baseName);

    let bytes: Uint8Array;
    if (body.pdfUrl && body.pdfUrl.trim().length > 0) {
      bytes = await downloadPdf(body.pdfUrl.trim());
      await deleteLyricsSidecar(dir, baseName);
    } else if (body.lyrics && body.lyrics.trim().length > 0) {
      const title = body.title?.trim() || baseName;
      const lyrics = body.lyrics.trim();
      bytes = await generatePdfFromText(title, lyrics);
      await writeLyricsSidecar(dir, baseName, lyrics);
    } else {
      return NextResponse.json(
        { error: "Debes enviar 'lyrics' (texto) o 'pdfUrl'." },
        { status: 400 },
      );
    }

    await fsp.writeFile(outPath, bytes);
    return NextResponse.json({ ok: true, path: outPath, baseName });
  } catch (err) {
    console.error("/api/lyrics POST error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error desconocido" },
      { status: 500 },
    );
  }
}
