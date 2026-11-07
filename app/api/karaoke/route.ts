import { NextRequest, NextResponse } from "next/server";
import { requireKaraokeAdmin } from "@/lib/adminAuth";
import { isYoutubeUrl } from "@/lib/audio";
import { parseYoutubeVideoId } from "@/lib/karaoke";
import { addYoutubeKaraoke, fetchYoutubeKaraokeTitle, listKaraokeVideos } from "@/lib/karaokeStorage";
import { requireViewer } from "@/lib/viewerAuth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const denied = await requireViewer(req);
  if (denied) return denied;

  try {
    const videos = await listKaraokeVideos();
    return NextResponse.json({ videos });
  } catch (err) {
    console.error("/api/karaoke GET error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error desconocido" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const denied = requireKaraokeAdmin(req);
  if (denied) return denied;

  try {
    const body = (await req.json()) as { url?: string; title?: string };
    const url = body.url?.trim() ?? "";
    if (!url || !isYoutubeUrl(url) || !parseYoutubeVideoId(url)) {
      return NextResponse.json(
        {
          error:
            "Enlace no reconocido. Usa un enlace de YouTube (youtube.com/watch, youtu.be o shorts).",
        },
        { status: 400 },
      );
    }

    let title = body.title?.trim() ?? "";
    if (!title) {
      title = (await fetchYoutubeKaraokeTitle(url)) ?? "";
    }
    if (!title) {
      return NextResponse.json(
        { error: "Ponle un título al karaoke. No se pudo leer el de YouTube." },
        { status: 400 },
      );
    }

    const video = await addYoutubeKaraoke(url, title);
    return NextResponse.json({ ok: true, video });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    const status = message.startsWith("Ya hay") || message.startsWith("El título") ? 400 : 500;
    console.error("/api/karaoke POST error", err);
    return NextResponse.json({ error: message }, { status });
  }
}
