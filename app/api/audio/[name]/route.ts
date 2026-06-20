import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { getMusicDir, safeBasename } from "@/lib/musicDir";

export const dynamic = "force-dynamic";

const MIME: Record<string, string> = {
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".m4a": "audio/mp4",
  ".flac": "audio/flac",
  ".ogg": "audio/ogg",
  ".aac": "audio/aac",
};

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ name: string }> },
) {
  try {
    const { name } = await ctx.params;
    const fileName = safeBasename(decodeURIComponent(name));
    const dir = await getMusicDir();
    const filePath = path.join(dir, fileName);

    const stat = await fsp.stat(filePath);
    if (!stat.isFile()) {
      return new NextResponse("No encontrado", { status: 404 });
    }

    const ext = path.extname(fileName).toLowerCase();
    const contentType = MIME[ext] ?? "application/octet-stream";
    const range = req.headers.get("range");

    if (range) {
      // Soporte de Range para que el reproductor pueda hacer seek.
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (!match) {
        return new NextResponse("Range inválido", { status: 416 });
      }
      const start = match[1] === "" ? 0 : parseInt(match[1], 10);
      const end = match[2] === "" ? stat.size - 1 : parseInt(match[2], 10);
      if (
        Number.isNaN(start) ||
        Number.isNaN(end) ||
        start > end ||
        end >= stat.size
      ) {
        return new NextResponse("Range fuera de rango", {
          status: 416,
          headers: { "Content-Range": `bytes */${stat.size}` },
        });
      }

      const stream = fs.createReadStream(filePath, { start, end });
      // Web stream para Next.js
      const webStream = new ReadableStream<Uint8Array>({
        start(controller) {
          stream.on("data", (chunk) =>
            controller.enqueue(
              chunk instanceof Buffer ? new Uint8Array(chunk) : chunk as Uint8Array,
            ),
          );
          stream.on("end", () => controller.close());
          stream.on("error", (err) => controller.error(err));
        },
        cancel() {
          stream.destroy();
        },
      });

      return new NextResponse(webStream, {
        status: 206,
        headers: {
          "Content-Type": contentType,
          "Content-Length": String(end - start + 1),
          "Content-Range": `bytes ${start}-${end}/${stat.size}`,
          "Accept-Ranges": "bytes",
          "Cache-Control": "no-store",
        },
      });
    }

    const data = await fsp.readFile(filePath);
    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(stat.size),
        "Accept-Ranges": "bytes",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("/api/audio error", err);
    const status = (err as NodeJS.ErrnoException).code === "ENOENT" ? 404 : 500;
    return new NextResponse(
      err instanceof Error ? err.message : "Error desconocido",
      { status },
    );
  }
}
