import fsp from "node:fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { requireViewer } from "@/lib/viewerAuth";
import { findLibraryGroup, folderDir, groupLyricsPdfPath } from "@/lib/library";
import { getMusicDir, safeBasename } from "@/lib/musicDir";
import { deleteLyricsSidecar } from "@/lib/lyricsStorage";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ base: string }> },
) {
  const denied = await requireViewer(req);
  if (denied) return denied;

  try {
    const { base } = await ctx.params;
    const baseName = safeBasename(decodeURIComponent(base));
    const dir = await getMusicDir();
    const group = await findLibraryGroup(dir, baseName);
    if (!group) {
      return new NextResponse("No encontrado", { status: 404 });
    }
    const pdfPath = groupLyricsPdfPath(dir, group);

    const data = await fsp.readFile(pdfPath);
    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${encodeURIComponent(baseName)}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const status = (err as NodeJS.ErrnoException).code === "ENOENT" ? 404 : 500;
    return new NextResponse(
      err instanceof Error ? err.message : "Error desconocido",
      { status },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ base: string }> },
) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  try {
    const { base } = await ctx.params;
    const baseName = safeBasename(decodeURIComponent(base));
    const dir = await getMusicDir();
    const group = await findLibraryGroup(dir, baseName);
    if (!group) {
      return NextResponse.json({ error: "Canción no encontrada" }, { status: 404 });
    }
    await fsp.unlink(groupLyricsPdfPath(dir, group));
    await deleteLyricsSidecar(folderDir(dir, group.folderId), group.groupKey);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const status = (err as NodeJS.ErrnoException).code === "ENOENT" ? 404 : 500;
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error desconocido" },
      { status },
    );
  }
}
