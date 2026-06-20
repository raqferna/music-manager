import fsp from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { getMusicDir, safeBasename } from "@/lib/musicDir";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Body = {
  baseName: string;
  title?: string;
  // Modo 1: texto plano de la letra
  lyrics?: string;
  // Modo 2: URL directa a un PDF que se descargará
  pdfUrl?: string;
};

async function generatePdfFromText(title: string, lyrics: string): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // A4 a 72dpi: 595 x 842
  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 56;
  const fontSize = 12;
  const lineHeight = 18;
  const titleSize = 22;

  // Word-wrap manual para la letra.
  function wrapLine(text: string, maxWidth: number, size: number): string[] {
    const out: string[] = [];
    const words = text.split(/\s+/);
    let current = "";
    for (const word of words) {
      const candidate = current.length === 0 ? word : `${current} ${word}`;
      const width = font.widthOfTextAtSize(candidate, size);
      if (width <= maxWidth) {
        current = candidate;
      } else {
        if (current) out.push(current);
        // Si la palabra individual supera el ancho, partir por caracteres.
        if (font.widthOfTextAtSize(word, size) > maxWidth) {
          let chunk = "";
          for (const ch of word) {
            if (font.widthOfTextAtSize(chunk + ch, size) > maxWidth) {
              out.push(chunk);
              chunk = ch;
            } else {
              chunk += ch;
            }
          }
          current = chunk;
        } else {
          current = word;
        }
      }
    }
    if (current) out.push(current);
    return out;
  }

  const usableWidth = pageWidth - margin * 2;
  const rawLines = lyrics.replace(/\r\n?/g, "\n").split("\n");
  const wrapped: string[] = [];
  for (const raw of rawLines) {
    if (raw.trim() === "") {
      wrapped.push("");
    } else {
      wrapped.push(...wrapLine(raw, usableWidth, fontSize));
    }
  }

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let cursorY = pageHeight - margin;

  // Título en la primera página.
  page.drawText(title, {
    x: margin,
    y: cursorY - titleSize,
    size: titleSize,
    font: fontBold,
    color: rgb(0.12, 0.13, 0.18),
  });
  cursorY -= titleSize + 24;

  for (const line of wrapped) {
    if (cursorY - lineHeight < margin) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      cursorY = pageHeight - margin;
    }
    if (line !== "") {
      page.drawText(line, {
        x: margin,
        y: cursorY - fontSize,
        size: fontSize,
        font,
        color: rgb(0.15, 0.17, 0.22),
      });
    }
    cursorY -= lineHeight;
  }

  return await pdfDoc.save();
}

async function downloadPdf(url: string): Promise<Uint8Array> {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) {
    throw new Error(`No se pudo descargar el PDF (HTTP ${res.status})`);
  }
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("pdf") && !url.toLowerCase().endsWith(".pdf")) {
    throw new Error(`La URL no parece apuntar a un PDF (content-type: ${ct})`);
  }
  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    if (!body?.baseName) {
      return NextResponse.json({ error: "Falta baseName" }, { status: 400 });
    }
    const baseName = safeBasename(body.baseName);
    const dir = await getMusicDir();
    const outPath = path.join(dir, `${baseName}.pdf`);

    let bytes: Uint8Array;
    if (body.pdfUrl && body.pdfUrl.trim().length > 0) {
      bytes = await downloadPdf(body.pdfUrl.trim());
    } else if (body.lyrics && body.lyrics.trim().length > 0) {
      const title = body.title?.trim() || baseName;
      bytes = await generatePdfFromText(title, body.lyrics);
    } else {
      return NextResponse.json(
        { error: "Debes enviar 'lyrics' (texto) o 'pdfUrl'." },
        { status: 400 },
      );
    }

    await fsp.writeFile(outPath, bytes);
    return NextResponse.json({ ok: true, path: outPath, baseName });
  } catch (err) {
    console.error("/api/lyrics error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error desconocido" },
      { status: 500 },
    );
  }
}
