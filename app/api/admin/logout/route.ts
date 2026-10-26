import { NextRequest, NextResponse } from "next/server";
import { clearAdminCookie } from "@/lib/adminAuth";
import { clearViewerCookie } from "@/lib/viewerAuth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const res = NextResponse.json({ ok: true, admin: false, viewer: false });
  clearAdminCookie(res, req);
  clearViewerCookie(res, req);
  return res;
}
