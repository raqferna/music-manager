import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { viewerRequired } from "@/lib/siteConfig";
import { isViewerCookieValue } from "@/lib/viewerAuth";

export const metadata: Metadata = {
  title: "Cursos de lenguaje musical",
  description:
    "Iniciación al lenguaje musical: notación, lectura de partituras, educación auditiva, elementos musicales y cifrado americano.",
};

export const dynamic = "force-dynamic";

export default async function CursoLayout({ children }: { children: React.ReactNode }) {
  if (viewerRequired()) {
    const jar = await cookies();
    const cookieHeader = jar
      .getAll()
      .map((item) => `${item.name}=${item.value}`)
      .join("; ");
    const req = new NextRequest("http://localhost/", { headers: { cookie: cookieHeader } });
    const allowed = isAdminRequest(req) || (await isViewerCookieValue(jar.get("viewer_session")?.value));
    if (!allowed) redirect("/");
  }
  return children;
}
