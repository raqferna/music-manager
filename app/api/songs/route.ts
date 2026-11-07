import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { loadLibrary } from "@/lib/library";
import { getMusicDir } from "@/lib/musicDir";
import { requireViewer } from "@/lib/viewerAuth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const denied = await requireViewer(req);
  if (denied) return denied;

  try {
    const dir = await getMusicDir();
    const { groups, folders } = await loadLibrary(dir);

    return NextResponse.json({
      dir: isAdminRequest(req) ? dir : "",
      groups,
      folders,
    });
  } catch (err) {
    console.error("/api/songs error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error desconocido" },
      { status: 500 },
    );
  }
}
