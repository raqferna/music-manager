import { NextRequest, NextResponse } from "next/server";
import { getMusicDir } from "@/lib/musicDir";
import { buildSongGroups, isAudioFile, parseAudioBaseName } from "@/lib/songGroups";
import {
  enqueueInstrumentalJob,
  getQueuePosition,
  jobToPayload,
} from "@/lib/youtubeJobs";
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

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { groupKey?: string };
    const groupKey = body.groupKey?.trim() ?? "";

    if (!groupKey) {
      return NextResponse.json({ error: "Falta el identificador de la canción" }, { status: 400 });
    }

    const { dir, group } = await findGroup(groupKey);
    if (!group) {
      return NextResponse.json({ error: "Canción no encontrada" }, { status: 404 });
    }

    if (!group.hasVocal) {
      return NextResponse.json(
        { error: "Esta canción no tiene versión con voz. Añádela primero." },
        { status: 400 },
      );
    }

    if (group.hasInstrumental) {
      return NextResponse.json(
        { error: "Esta canción ya tiene versión sin voz." },
        { status: 400 },
      );
    }

    const { job, duplicate } = enqueueInstrumentalJob(groupKey, dir);
    const position = getQueuePosition(job.id);

    let message: string;
    if (duplicate) {
      message = "Esta canción ya está en cola o procesándose.";
    } else if (job.status === "queued") {
      message = `Encolada (posición ${position ?? "?"}). Se generará sin voz cuando termine la actual.`;
    } else {
      message = "Generando versión sin voz en el servidor…";
    }

    return NextResponse.json({
      ...jobToPayload(job, position ?? undefined),
      ok: true,
      queued: job.status === "queued",
      message,
    });
  } catch (err) {
    console.error("/api/songs/add-instrumental error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error desconocido" },
      { status: 500 },
    );
  }
}
