import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { createFolder, listFolders } from "@/lib/library";
import { getMusicDir } from "@/lib/musicDir";
import { requireViewer } from "@/lib/viewerAuth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const denied = await requireViewer(req);
  if (denied) return denied;

  try {
    const dir = await getMusicDir();
    const folders = await listFolders(dir);
    return NextResponse.json({ folders });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error desconocido" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  try {
    const body = (await req.json()) as { name?: string };
    const dir = await getMusicDir();
    const folder = await createFolder(dir, body.name ?? "");
    return NextResponse.json({ ok: true, folder });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    const status =
      message.startsWith("El nombre") ||
      message.startsWith("Ya existe") ||
      message.startsWith("Ese nombre")
        ? 400
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
