import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { adminPassword, siteMode } from "@/lib/siteConfig";

const COOKIE = "admin_session";
const MAX_AGE_SEC = 60 * 60 * 24 * 30;

function sessionToken(password: string): string {
  return createHmac("sha256", password).update("aula-admin").digest("base64url");
}

function tokensMatch(got: string, expected: string): boolean {
  const a = Buffer.from(got);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function passwordsMatch(got: string, expected: string): boolean {
  const a = createHash("sha256").update(got).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

function requestIsHttps(req: NextRequest): boolean {
  const forwarded = req.headers.get("x-forwarded-proto");
  if (forwarded) return forwarded.split(",")[0]?.trim() === "https";
  return req.nextUrl.protocol === "https:";
}

function cookieOptions(req: NextRequest, maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: requestIsHttps(req),
    path: "/",
    maxAge,
  };
}

/** Sin ADMIN_PASSWORD (el catálogo) cualquiera puede escribir. Con contraseña, solo la cookie de admin. */
export function isAdminRequest(req: NextRequest): boolean {
  const password = adminPassword();
  if (!password) return true;
  const got = req.cookies.get(COOKIE)?.value ?? "";
  if (!got) return false;
  return tokensMatch(got, sessionToken(password));
}

export function requireAdmin(req: NextRequest): NextResponse | null {
  if (isAdminRequest(req)) return null;
  return NextResponse.json(
    { error: "Solo el admin puede añadir o modificar canciones" },
    { status: 401 },
  );
}

/** Cookie de admin de verdad. En el aula no vale el modo abierto del catálogo. */
export function isStrictAdminRequest(req: NextRequest): boolean {
  const password = adminPassword();
  if (!password) return false;
  const got = req.cookies.get(COOKIE)?.value ?? "";
  if (!got) return false;
  return tokensMatch(got, sessionToken(password));
}

/** Altas de karaoke: en el aula solo el admin; en el catálogo, la misma regla que el resto. */
export function requireKaraokeAdmin(req: NextRequest): NextResponse | null {
  const ok = siteMode() === "aula" ? isStrictAdminRequest(req) : isAdminRequest(req);
  if (ok) return null;
  return NextResponse.json(
    { error: "Solo el admin puede añadir o borrar karaokes" },
    { status: 401 },
  );
}

export function passwordsMatchAdmin(given: string): boolean {
  const password = adminPassword();
  if (!password) return false;
  return passwordsMatch(given, password);
}

export function applyAdminCookie(res: NextResponse, req: NextRequest): void {
  const password = adminPassword();
  if (!password) return;
  res.cookies.set(COOKIE, sessionToken(password), cookieOptions(req, MAX_AGE_SEC));
}

export function clearAdminCookie(res: NextResponse, req: NextRequest): void {
  res.cookies.set(COOKIE, "", cookieOptions(req, 0));
}
