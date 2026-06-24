import { NextRequest, NextResponse } from "next/server";
import { getMusicDir } from "@/lib/musicDir";
import {
  deleteSongGroup,
  renameSongGroup,
  type DeleteScope,
} from "@/lib/songStorage";

export const dynamic = "force-dynamic";

const VALID_SCOPES = new Set<DeleteScope>(["all", "instrumental", "vocal", "lyrics"]);

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ groupKey: string }> },
) {
  try {
    const { groupKey } = await ctx.params;
    const decoded = decodeURIComponent(groupKey);
    const scopeParam = req.nextUrl.searchParams.get("scope") ?? "all";

    if (!VALID_SCOPES.has(scopeParam as DeleteScope)) {
      return NextResponse.json(
        { error: "scope debe ser all, instrumental, vocal o lyrics" },
        { status: 400 },
      );
    }

    const dir = await getMusicDir();
    const result = await deleteSongGroup(dir, decoded, scopeParam as DeleteScope);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    const status =
      message === "Canción no encontrada" || message.startsWith("No hay archivos")
        ? 404
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ groupKey: string }> },
) {
  try {
    const { groupKey } = await ctx.params;
    const decoded = decodeURIComponent(groupKey);
    const body = (await req.json()) as { newGroupKey?: string };

    if (!body.newGroupKey?.trim()) {
      return NextResponse.json(
        { error: "newGroupKey es obligatorio" },
        { status: 400 },
      );
    }

    const dir = await getMusicDir();
    const result = await renameSongGroup(dir, decoded, body.newGroupKey);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    const status =
      message === "Canción no encontrada" ||
      message.startsWith("Ya existe") ||
      message.startsWith("El nombre")
        ? 400
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
