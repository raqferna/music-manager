import { NextResponse } from "next/server";
import { getTranscribeJob, jobToPayload } from "@/lib/transcribeJobs";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await ctx.params;
  const job = getTranscribeJob(jobId);

  if (!job) {
    return NextResponse.json({ error: "Trabajo no encontrado" }, { status: 404 });
  }

  return NextResponse.json(jobToPayload(job));
}
