import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { AUDIO_EXTS } from "@/lib/audio";
import { getMusicDir } from "@/lib/musicDir";
import type { Song } from "@/lib/types";

export const dynamic = "force-dynamic";

function toTitle(name: string) {
  return name
    .replace(/[_\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function GET() {
  try {
    const dir = await getMusicDir();
    const entries = await fs.readdir(dir, { withFileTypes: true });

    const pdfBaseNames = new Set(
      entries
        .filter((e) => e.isFile() && path.extname(e.name).toLowerCase() === ".pdf")
        .map((e) => path.basename(e.name, path.extname(e.name)).toLowerCase()),
    );

    const songs: Song[] = [];
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const ext = path.extname(entry.name).toLowerCase();
      if (!AUDIO_EXTS.has(ext)) continue;
      const baseName = path.basename(entry.name, ext);
      const stat = await fs.stat(path.join(dir, entry.name));
      songs.push({
        file: entry.name,
        baseName,
        title: toTitle(baseName),
        size: stat.size,
        modifiedAt: stat.mtimeMs,
        hasLyrics: pdfBaseNames.has(baseName.toLowerCase()),
      });
    }

    songs.sort((a, b) => a.title.localeCompare(b.title, "es"));

    return NextResponse.json({ dir, songs });
  } catch (err) {
    console.error("/api/songs error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error desconocido" },
      { status: 500 },
    );
  }
}
