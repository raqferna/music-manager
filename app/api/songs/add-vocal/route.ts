import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { isYoutubeUrl } from "@/lib/audio";
import { resolveGroupDir } from "@/lib/library";
import { getMusicDir } from "@/lib/musicDir";
import { downloadVocalFromYoutube } from "@/lib/vocalDownload";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 600;

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  try {
    const body = (await req.json()) as { groupKey?: string; url?: string };
    const groupKey = body.groupKey?.trim() ?? "";
    const url = body.url?.trim() ?? "";

    if (!groupKey) {
      return NextResponse.json({ error: "Falta el identificador de la canción" }, { status: 400 });
    }

    if (!url) {
      return NextResponse.json({ error: "Falta la URL de YouTube" }, { status: 400 });
    }

    if (!isYoutubeUrl(url)) {
      return NextResponse.json(
        {
          error:
            "Enlace no reconocido. Usa un enlace de YouTube (youtube.com/watch, youtu.be o shorts).",
        },
        { status: 400 },
      );
    }

    const dir = await resolveGroupDir(await getMusicDir(), groupKey);
    const result = await downloadVocalFromYoutube(url, dir, groupKey);

    return NextResponse.json(result);
  } catch (err) {
    console.error("/api/songs/add-vocal error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error desconocido" },
      { status: 500 },
    );
  }
}
