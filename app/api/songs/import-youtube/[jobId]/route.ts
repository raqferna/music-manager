import { NextRequest, NextResponse } from "next/server";
import { getYoutubeJob, jobToPayload } from "@/lib/youtubeJobs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Params = { params: Promise<{ jobId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { jobId } = await params;
  const job = getYoutubeJob(jobId);

  if (!job) {
    return NextResponse.json({ error: "Trabajo no encontrado" }, { status: 404 });
  }

  return NextResponse.json(jobToPayload(job));
}
