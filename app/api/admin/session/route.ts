import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { getSitePublicConfig } from "@/lib/siteConfig";
import { isViewerRequest } from "@/lib/viewerAuth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const site = getSitePublicConfig();
  return NextResponse.json({
    ...site,
    admin: isAdminRequest(req),
    viewer: await isViewerRequest(req),
  });
}
