import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { applyAdminCookie, passwordsMatchAdmin } from "@/lib/adminAuth";
import { classPassword, classUsername } from "@/lib/siteConfig";
import { applyViewerCookie } from "@/lib/viewerAuth";

function passwordsMatch(got: string, expected: string): boolean {
  const a = createHash("sha256").update(got).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { username?: string; password?: string } | null;
  const username = (body?.username ?? "").trim().toLowerCase();
  const password = body?.password ?? "";

  if (!username || !password) {
    return NextResponse.json({ error: "Falta el usuario o la contraseña" }, { status: 400 });
  }

  if (username === "admin") {
    if (!passwordsMatchAdmin(password)) {
      return NextResponse.json({ error: "Usuario o contraseña incorrectos" }, { status: 401 });
    }
    const res = NextResponse.json({ ok: true, admin: true, viewer: true });
    applyAdminCookie(res, req);
    return res;
  }

  const sharedPassword = classPassword();
  if (!sharedPassword || username !== classUsername().toLowerCase() || !passwordsMatch(password, sharedPassword)) {
    return NextResponse.json({ error: "Usuario o contraseña incorrectos" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true, admin: false, viewer: true });
  applyViewerCookie(res, req);
  return res;
}
