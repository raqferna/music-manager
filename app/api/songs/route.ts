import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getMusicDir } from "@/lib/musicDir";
import { buildSongGroups, isAudioFile, parseAudioBaseName } from "@/lib/songGroups";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
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

    return NextResponse.json({ dir, groups });
  } catch (err) {
    console.error("/api/songs error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error desconocido" },
      { status: 500 },
    );
  }
}
