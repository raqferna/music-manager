import { NextRequest, NextResponse } from "next/server";
import { getMusicDir } from "@/lib/musicDir";
import { buildSongGroups, isAudioFile, parseAudioBaseName } from "@/lib/songGroups";
import {
  getActiveTranscribeJob,
  jobToPayload,
  startTranscribeJob,
} from "@/lib/transcribeJobs";
import fs from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function findGroup(groupKey: string) {
  const dir = await getMusicDir();
  const entries = await fs.readdir(dir, { withFileTypes: true });

  const pdfBaseNames = new Set(
    entries
      .filter((e) => e.isFile() && path.extname(e.name).toLowerCase() === ".pdf")
      .map((e) => path.basename(e.name, path.extname(e.name)).toLowerCase()),
  );

  const raw = [];
  for (const entry of entries) {
    if (!entry.isFile() || !isAudioFile(entry.name)) continue;
    const baseName = path.basename(entry.name, path.extname(entry.name));
    const stat = await fs.stat(path.join(dir, entry.name));
    raw.push({
      file: entry.name,
      baseName,
      size: stat.size,
      modifiedAt: stat.mtimeMs,
      parsed: parseAudioBaseName(baseName),
    });
  }

  const groups = buildSongGroups(raw, pdfBaseNames);
  return { dir, group: groups.find((g) => g.groupKey === groupKey) ?? null };
}

export async function GET() {
  const active = getActiveTranscribeJob();
  return NextResponse.json({
    active: active ? jobToPayload(active) : null,
  });
}

export async function POST(req: NextRequest) {
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

    const { dir, group } = await findGroup(groupKey);
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
