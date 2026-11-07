import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { findLibraryGroup } from "@/lib/library";
import { getMusicDir } from "@/lib/musicDir";
import {
  getActiveTranscribeJob,
  jobToPayload,
  startTranscribeJob,
} from "@/lib/transcribeJobs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const active = getActiveTranscribeJob();
  return NextResponse.json({
    active: active ? jobToPayload(active) : null,
  });
}

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  try {
    const body = (await req.json()) as { groupKey?: string };
    const groupKey = body.groupKey?.trim() ?? "";

    if (!groupKey) {
      return NextResponse.json({ error: "Falta groupKey" }, { status: 400 });
    }

    const existing = getActiveTranscribeJob();
    if (existing) {
      return NextResponse.json({
        ...jobToPayload(existing),
        reused: true,
        message: "Ya hay una transcripción en curso en el servidor.",
      });
    }

    const dir = await getMusicDir();
    const group = await findLibraryGroup(dir, groupKey);
    if (!group) {
      return NextResponse.json({ error: "Canción no encontrada" }, { status: 404 });
    }

    if (!group.hasVocal) {
      return NextResponse.json(
        {
          error:
            "Esta canción no tiene versión con voz. Añádela primero o usa otra opción para la letra.",
        },
        { status: 400 },
      );
    }

    const job = startTranscribeJob(dir, group);

    return NextResponse.json({
      ...jobToPayload(job),
      message:
        "Transcripción iniciada. Puede tardar varios minutos; revisa y edita el texto antes de guardar.",
    });
  } catch (err) {
    console.error("/api/lyrics/transcribe POST error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error desconocido" },
      { status: 500 },
    );
  }
}
