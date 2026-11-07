import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { getClassPassword } from "@/lib/classAccess";
import { classUsername, viewerRequired } from "@/lib/siteConfig";

const COOKIE = "viewer_session";
const MAX_AGE_SEC = 60 * 60 * 24 * 30;

type CookieReader = {
  get: (name: string) => { value: string } | undefined;
};

function sessionToken(username: string, password: string): string {
  const sig = createHmac("sha256", password).update(`aula-viewer:${username}`).digest("base64url");
  return `${username}.${sig}`;
}

function tokensMatch(got: string, expected: string): boolean {
  const a = Buffer.from(got);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function requestIsHttps(req: NextRequest): boolean {
  const forwarded = req.headers.get("x-forwarded-proto");
  if (forwarded) return forwarded.split(",")[0]?.trim() === "https";
  return req.nextUrl.protocol === "https:";
}

export async function isViewerCookieValue(value: string | undefined): Promise<boolean> {
  const password = await getClassPassword();
  const username = classUsername();
  if (!password) return false;
  return tokensMatch(value ?? "", sessionToken(username, password));
}

async function cookieIsViewer(cookies: CookieReader): Promise<boolean> {
  return isViewerCookieValue(cookies.get(COOKIE)?.value);
}

export async function isViewerRequest(req: NextRequest): Promise<boolean> {
  if (!viewerRequired()) return true;
  if (isAdminRequest(req)) return true;
  return cookieIsViewer(req.cookies);
}

export async function requireViewer(req: NextRequest): Promise<NextResponse | null> {
  if (await isViewerRequest(req)) return null;
  return NextResponse.json({ error: "Necesitas entrar para ver el aula" }, { status: 401 });
}

export async function applyViewerCookie(res: NextResponse, req: NextRequest): Promise<void> {
  const password = await getClassPassword();
  if (!password) return;
  res.cookies.set(COOKIE, sessionToken(classUsername(), password), {
    httpOnly: true,
    sameSite: "lax",
    secure: requestIsHttps(req),
    path: "/",
    maxAge: MAX_AGE_SEC,
  });
}

export function clearViewerCookie(res: NextResponse, req: NextRequest): void {
  res.cookies.set(COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: requestIsHttps(req),
    path: "/",
    maxAge: 0,
  });
}
