import fs from "node:fs";
import fsp from "node:fs/promises";
import { NextRequest, NextResponse } from "next/server";

function toWebStream(stream: fs.ReadStream): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      stream.on("data", (chunk) =>
        controller.enqueue(chunk instanceof Buffer ? new Uint8Array(chunk) : (chunk as Uint8Array)),
      );
      stream.on("end", () => controller.close());
      stream.on("error", (err) => controller.error(err));
    },
    cancel() {
      stream.destroy();
    },
  });
}

/** Sirve un archivo con Range (seek) sin cargarlo entero en memoria. */
export async function streamMediaFile(
  req: NextRequest,
  filePath: string,
  contentType: string,
): Promise<NextResponse> {
  const stat = await fsp.stat(filePath);
  if (!stat.isFile()) {
    return new NextResponse("No encontrado", { status: 404 });
  }

  const range = req.headers.get("range");
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match) {
      return new NextResponse("Range inválido", { status: 416 });
    }
    const start = match[1] === "" ? 0 : parseInt(match[1], 10);
    const end = match[2] === "" ? stat.size - 1 : parseInt(match[2], 10);
    if (Number.isNaN(start) || Number.isNaN(end) || start > end || end >= stat.size) {
      return new NextResponse("Range fuera de rango", {
        status: 416,
        headers: { "Content-Range": `bytes */${stat.size}` },
      });
    }

    const stream = fs.createReadStream(filePath, { start, end });
    return new NextResponse(toWebStream(stream), {
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

  const stream = fs.createReadStream(filePath);
  return new NextResponse(toWebStream(stream), {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(stat.size),
      "Accept-Ranges": "bytes",
      "Cache-Control": "no-store",
    },
  });
}
