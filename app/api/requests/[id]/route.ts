import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { acceptDownloadRequest, rejectDownloadRequest } from "@/lib/downloadRequests";
import { siteMode } from "@/lib/siteConfig";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  if (siteMode() !== "aula") {
    return NextResponse.json({ error: "Las peticiones solo existen en el aula" }, { status: 404 });
  }

  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as { action?: string } | null;
  const action = body?.action;

  try {
    if (action === "accept") {
      const request = await acceptDownloadRequest(id);
      return NextResponse.json({
        ok: true,
        request,
        message:
          request.kind === "karaoke"
            ? "Aceptada. Ya está en la lista de karaoke."
            : "Aceptada. Ya está en la cola de descarga.",
      });
    }
    if (action === "reject") {
      const request = await rejectDownloadRequest(id);
      return NextResponse.json({ ok: true, request, message: "Petición rechazada." });
    }
    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo actualizar";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
