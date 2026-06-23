import { NextRequest, NextResponse } from "next/server";
import { isYoutubeUrl } from "@/lib/audio";
import { getMusicDir } from "@/lib/musicDir";
import { separationModelLabel } from "@/lib/separationModel";
import {
  getActiveYoutubeJob,
  getLatestYoutubeJob,
  jobToPayload,
  startYoutubeImportJob,
} from "@/lib/youtubeJobs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Estado de importaciones activas o recientes (para reanudar tras recargar la página). */
export async function GET() {
  const active = getActiveYoutubeJob();
  const latest = getLatestYoutubeJob();

  return NextResponse.json({
    active: active ? jobToPayload(active) : null,
    latest: latest ? jobToPayload(latest) : null,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { url?: string };
    const url = body.url?.trim() ?? "";

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

    const existing = getActiveYoutubeJob();
    if (existing) {
      return NextResponse.json({
        ...jobToPayload(existing),
        reused: true,
        mode: separationModelLabel(),
        message: "Ya hay una importación en curso en el servidor.",
      });
    }

    const dir = await getMusicDir();
    const job = startYoutubeImportJob(url, dir);

    return NextResponse.json({
      ...jobToPayload(job),
      mode: separationModelLabel(),
      message:
        "Importación iniciada en el servidor. Puedes recargar la página: el progreso se mostrará aquí.",
    });
  } catch (err) {
    console.error("/api/songs/import-youtube error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error desconocido" },
      { status: 500 },
    );
  }
}
