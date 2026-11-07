import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { deleteFolder, renameFolder } from "@/lib/library";
import { getMusicDir } from "@/lib/musicDir";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  try {
    const { id } = await ctx.params;
    const body = (await req.json()) as { name?: string };
    if (!body.name?.trim()) {
      return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
    }
    const dir = await getMusicDir();
    const folder = await renameFolder(dir, decodeURIComponent(id), body.name);
    return NextResponse.json({ ok: true, folder });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    const status =
      message === "Carpeta no encontrada" ||
      message.startsWith("El nombre") ||
      message.startsWith("Ya existe") ||
      message.startsWith("Ese nombre")
        ? 400
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  try {
    const { id } = await ctx.params;
    const dir = await getMusicDir();
    await deleteFolder(dir, decodeURIComponent(id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    const status = message === "Carpeta no encontrada" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
