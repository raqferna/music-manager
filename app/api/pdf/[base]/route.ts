import fsp from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getMusicDir, safeBasename } from "@/lib/musicDir";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ base: string }> },
) {
  try {
    const { base } = await ctx.params;
    const baseName = safeBasename(decodeURIComponent(base));
    const dir = await getMusicDir();
    const pdfPath = path.join(dir, `${baseName}.pdf`);

    const data = await fsp.readFile(pdfPath);
    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${encodeURIComponent(baseName)}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const status = (err as NodeJS.ErrnoException).code === "ENOENT" ? 404 : 500;
    return new NextResponse(
      err instanceof Error ? err.message : "Error desconocido",
      { status },
    );
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ base: string }> },
) {
  try {
    const { base } = await ctx.params;
    const baseName = safeBasename(decodeURIComponent(base));
    const dir = await getMusicDir();
    await fsp.unlink(path.join(dir, `${baseName}.pdf`));
    return NextResponse.json({ ok: true });
  } catch (err) {
    const status = (err as NodeJS.ErrnoException).code === "ENOENT" ? 404 : 500;
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error desconocido" },
      { status },
    );
  }
}
