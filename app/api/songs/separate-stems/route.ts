import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { findLibraryGroup } from "@/lib/library";
import { getMusicDir } from "@/lib/musicDir";
import {
  enqueueStemSeparationJob,
  getQueuePosition,
  jobToPayload,
} from "@/lib/youtubeJobs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  try {
    const body = (await req.json()) as { groupKey?: string };
    const groupKey = body.groupKey?.trim() ?? "";

    if (!groupKey) {
      return NextResponse.json({ error: "Falta el identificador de la canción" }, { status: 400 });
    }

    const dir = await getMusicDir();
    const group = await findLibraryGroup(dir, groupKey);
    if (!group) {
      return NextResponse.json({ error: "Canción no encontrada" }, { status: 404 });
    }

    if (!group.hasVocal && !group.hasInstrumental) {
      return NextResponse.json(
        { error: "Esta canción no tiene audio. Importa o sube un archivo primero." },
        { status: 400 },
      );
    }

    if (group.hasStems) {
      return NextResponse.json(
        { error: "Esta canción ya tiene instrumentos separados." },
        { status: 400 },
      );
    }

    const { job, duplicate } = enqueueStemSeparationJob(groupKey, dir);
    const position = getQueuePosition(job.id);

    let message: string;
    if (duplicate) {
      message = "Esta canción ya está en cola o procesándose.";
    } else if (job.status === "queued") {
      message = `Encolada (posición ${position ?? "?"}). Se separarán los instrumentos cuando termine la actual.`;
    } else {
      message = "Separando instrumentos en el servidor…";
    }

    return NextResponse.json({
      ...jobToPayload(job, position ?? undefined),
      ok: true,
      queued: job.status === "queued",
      message,
    });
  } catch (err) {
    console.error("/api/songs/separate-stems error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error desconocido" },
      { status: 500 },
    );
  }
}
