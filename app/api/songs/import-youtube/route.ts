import { NextRequest, NextResponse } from "next/server";
import { isYoutubeUrl } from "@/lib/audio";
import { getMusicDir } from "@/lib/musicDir";
import { separationModelLabel } from "@/lib/separationModel";
import {
  enqueueYoutubeImportJob,
  getActiveYoutubeJob,
  getLatestYoutubeJob,
  getQueuedYoutubeJobs,
  getRecentYoutubeJobs,
  getQueuePosition,
  jobToPayload,
} from "@/lib/youtubeJobs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Estado de importaciones activas, cola y recientes. */
export async function GET() {
  const active = getActiveYoutubeJob();
  const queued = getQueuedYoutubeJobs();
  const recent = getRecentYoutubeJobs();
  const latest = getLatestYoutubeJob();

  return NextResponse.json({
    active: active ? jobToPayload(active) : null,
    queued: queued.map((job) => jobToPayload(job, getQueuePosition(job.id) ?? undefined)),
    recent: recent.map((job) => jobToPayload(job)),
    latest: latest ? jobToPayload(latest) : null,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { url?: string; urls?: string[] };
    const rawUrls = body.urls?.length ? body.urls : body.url ? [body.url] : [];
    const urls = rawUrls.map((u) => u.trim()).filter(Boolean);

    if (urls.length === 0) {
      return NextResponse.json({ error: "Falta la URL de YouTube" }, { status: 400 });
    }

    const invalid = urls.filter((u) => !isYoutubeUrl(u));
    if (invalid.length > 0) {
      return NextResponse.json(
        {
          error:
            "Enlace no reconocido. Usa enlaces de YouTube (youtube.com/watch, youtu.be o shorts).",
        },
        { status: 400 },
      );
    }

    const dir = await getMusicDir();
    const results: ReturnType<typeof jobToPayload>[] = [];
    let duplicates = 0;

    for (const url of urls) {
      const { job, duplicate } = enqueueYoutubeImportJob(url, dir);
      if (duplicate) {
        duplicates++;
      }
      results.push(jobToPayload(job, getQueuePosition(job.id) ?? undefined));
    }

    const active = getActiveYoutubeJob();
    const queuedCount = getQueuedYoutubeJobs().length;
    const last = results[results.length - 1];

    let message: string;
    if (urls.length === 1) {
      if (results[0].status === "queued") {
        message = `En cola (posición ${results[0].queuePosition ?? queuedCount}). Se procesará cuando termine la actual.`;
      } else if (duplicates) {
        message = "Esta URL ya está en cola o procesándose.";
      } else {
        message =
          "Importación iniciada en el servidor. Puedes recargar la página: el progreso se mostrará aquí.";
      }
    } else {
      message = `${results.length} canciones encoladas (${active ? "1 en curso" : "iniciando"}, ${queuedCount} en espera).`;
    }

    return NextResponse.json({
      ...last,
      jobs: results,
      duplicates,
      mode: separationModelLabel(),
      message,
    });
  } catch (err) {
    console.error("/api/songs/import-youtube error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error desconocido" },
      { status: 500 },
    );
  }
}
