import { NextRequest, NextResponse } from "next/server";
import { fetchLyricsById, searchLyrics } from "@/lib/lyricsSearch";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const idParam = req.nextUrl.searchParams.get("id");
    if (idParam) {
      const id = Number(idParam);
      if (!Number.isFinite(id) || id <= 0) {
        return NextResponse.json({ error: "ID inválido" }, { status: 400 });
      }
      const result = await fetchLyricsById(id);
      if (!result) {
        return NextResponse.json(
          { error: "No se encontró la letra para ese resultado" },
          { status: 404 },
        );
      }
      return NextResponse.json(result);
    }

    const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
    if (!q) {
      return NextResponse.json({ error: "Falta el parámetro q" }, { status: 400 });
    }

    const results = await searchLyrics(q);
    return NextResponse.json({ query: q, results });
  } catch (err) {
    console.error("/api/lyrics/search error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error desconocido" },
      { status: 500 },
    );
  }
}
