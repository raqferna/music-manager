import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function generatePdfFromText(
  title: string,
  lyrics: string,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 56;
  const fontSize = 12;
  const lineHeight = 18;
  const titleSize = 22;

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
    if (raw.trim() === "") wrapped.push("");
    else wrapped.push(...wrapLine(raw, usableWidth, fontSize));
  }

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let cursorY = pageHeight - margin;

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
