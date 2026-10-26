import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { createDownloadRequest, listDownloadRequests, type RequestKind } from "@/lib/downloadRequests";
import { siteMode } from "@/lib/siteConfig";
import { requireViewer } from "@/lib/viewerAuth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const denied = await requireViewer(req);
  if (denied) return denied;
  if (siteMode() !== "aula") {
    return NextResponse.json({ error: "Las peticiones solo existen en el aula" }, { status: 404 });
  }

  const requests = await listDownloadRequests();
  return NextResponse.json({
    admin: isAdminRequest(req),
    requests,
  });
}

export async function POST(req: NextRequest) {
  const denied = await requireViewer(req);
  if (denied) return denied;
  if (siteMode() !== "aula") {
    return NextResponse.json({ error: "Las peticiones solo existen en el aula" }, { status: 404 });
  }

  const body = (await req.json().catch(() => null)) as {
    kind?: RequestKind;
    url?: string;
    groupKey?: string;
    note?: string;
  } | null;

  try {
    const created = await createDownloadRequest({
      kind: body?.kind ?? "youtube",
      url: body?.url,
      groupKey: body?.groupKey,
      note: body?.note,
    });
    return NextResponse.json({ ok: true, request: created });
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo enviar";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
