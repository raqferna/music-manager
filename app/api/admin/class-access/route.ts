import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { setClassPassword } from "@/lib/classAccess";
import { classUsername, siteMode } from "@/lib/siteConfig";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  if (siteMode() !== "aula") {
    return NextResponse.json({ error: "Solo existe en el aula" }, { status: 404 });
  }
  return NextResponse.json({ username: classUsername() });
}

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  if (siteMode() !== "aula") {
    return NextResponse.json({ error: "Solo existe en el aula" }, { status: 404 });
  }

  const body = (await req.json().catch(() => null)) as { password?: string } | null;
  try {
    await setClassPassword(body?.password ?? "");
    return NextResponse.json({
      ok: true,
      message: "Contraseña cambiada. La clase tiene que volver a entrar.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo guardar";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
