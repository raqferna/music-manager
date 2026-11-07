import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { VIDEO_MIME } from "@/lib/karaoke";
import { resolveKaraokeFile } from "@/lib/karaokeStorage";
import { streamMediaFile } from "@/lib/mediaStream";
import { requireViewer } from "@/lib/viewerAuth";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ name: string }> },
) {
  const denied = await requireViewer(req);
  if (denied) return denied;

  try {
    const { name } = await ctx.params;
    const filePath = await resolveKaraokeFile(name);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = VIDEO_MIME[ext] ?? "application/octet-stream";
    return streamMediaFile(req, filePath, contentType);
  } catch (err) {
    console.error("/api/karaoke/file error", err);
    const status = (err as NodeJS.ErrnoException).code === "ENOENT" ? 404 : 500;
    return new NextResponse(err instanceof Error ? err.message : "Error desconocido", {
      status,
    });
  }
}
