import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { deleteKaraokeVideo } from "@/lib/karaokeStorage";

export const dynamic = "force-dynamic";

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  try {
    const { id } = await ctx.params;
    const result = await deleteKaraokeVideo(decodeURIComponent(id));
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    const status = message === "Karaoke no encontrado" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
