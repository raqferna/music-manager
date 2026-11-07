import fsp from "node:fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { deleteLyricsSidecar, lyricsPdfPath } from "@/lib/lyricsStorage";
import { isPdfFilename, looksLikePdf, maxLyricsPdfBytes } from "@/lib/pdf";
import { findLibraryGroup, folderDir } from "@/lib/library";
import { getMusicDir, safeBasename } from "@/lib/musicDir";
import { siteMode } from "@/lib/siteConfig";
import { requireViewer } from "@/lib/viewerAuth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const denied = siteMode() === "aula" ? await requireViewer(req) : requireAdmin(req);
  if (denied) return denied;

  try {
    const formData = await req.formData();
    const entry = formData.get("file");
    const baseRaw = typeof formData.get("baseName") === "string" ? String(formData.get("baseName")) : "";

    if (!baseRaw.trim()) {
      return NextResponse.json({ error: "Falta baseName" }, { status: 400 });
    }
    if (!(entry instanceof File)) {
      return NextResponse.json({ error: "No se recibió ningún PDF" }, { status: 400 });
    }

    const originalName = entry.name || "letra.pdf";
    if (!isPdfFilename(originalName)) {
      return NextResponse.json({ error: "El archivo tiene que ser un PDF" }, { status: 400 });
    }
    if (entry.size === 0) {
      return NextResponse.json({ error: "El archivo está vacío" }, { status: 400 });
    }
    const limit = maxLyricsPdfBytes();
    if (entry.size > limit) {
      return NextResponse.json(
        { error: `Supera el límite de ${Math.round(limit / (1024 * 1024))} MB` },
        { status: 400 },
      );
    }

    const bytes = new Uint8Array(await entry.arrayBuffer());
    if (!looksLikePdf(bytes)) {
      return NextResponse.json({ error: "El archivo no es un PDF válido" }, { status: 400 });
    }

    const baseName = safeBasename(baseRaw);
    const root = await getMusicDir();
    const group = await findLibraryGroup(root, baseName);
    const dir = group ? folderDir(root, group.folderId) : root;
    await fsp.writeFile(lyricsPdfPath(dir, baseName), bytes);
    await deleteLyricsSidecar(dir, baseName);

    return NextResponse.json({ ok: true, baseName, file: `${baseName}.pdf` });
  } catch (err) {
    console.error("/api/lyrics/upload error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error desconocido" },
      { status: 500 },
    );
  }
}
