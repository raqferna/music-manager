import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import {
  catalogIsAvailable,
  copyCatalogGroups,
  getCatalogMusicDir,
  loadSongGroups,
} from "@/lib/catalogImport";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const dir = getCatalogMusicDir();
  if (!dir || !(await catalogIsAvailable())) {
    return NextResponse.json({ available: false, groups: [] });
  }

  const groups = await loadSongGroups(dir);
  return NextResponse.json({
    available: true,
    groups: groups.map((group) => ({
      groupKey: group.groupKey,
      hasVocal: group.hasVocal,
      hasInstrumental: group.hasInstrumental,
      hasLyrics: group.hasLyrics,
      hasStems: group.hasStems,
    })),
  });
}

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const body = (await req.json().catch(() => null)) as {
    groupKeys?: string[];
    folderId?: string | null;
  } | null;
  const groupKeys = (body?.groupKeys ?? []).map((key) => key.trim()).filter(Boolean);
  const folderId = body?.folderId?.trim() ? body.folderId.trim() : null;
  if (groupKeys.length === 0) {
    return NextResponse.json({ error: "No has seleccionado ninguna canción" }, { status: 400 });
  }

  try {
    const result = await copyCatalogGroups(groupKeys, folderId);
    return NextResponse.json({
      ok: true,
      ...result,
      message:
        result.copied.length === 0
          ? "No se encontró ninguna de esas canciones en el catálogo."
          : `${result.copied.length} canciones copiadas, sin volver a procesarlas.`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo copiar";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
