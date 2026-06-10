// Shared client-side PDF helpers built on pdfjs-dist.

export async function loadPdfJs() {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();
  return pdfjsLib;
}

export interface PageText {
  page: number;
  text: string;
}

// Extracts text from every page, joining items on the same visual line.
export async function extractPdfText(bytes: ArrayBuffer): Promise<PageText[]> {
  const pdfjsLib = await loadPdfJs();
  const task = pdfjsLib.getDocument({ data: bytes.slice(0) });
  const pdf = await task.promise;
  const pages: PageText[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    let text = "";
    let lastY: number | null = null;
    for (const item of content.items) {
      if (!("str" in item)) continue;
      const y = item.transform[5];
      if (lastY !== null && Math.abs(y - lastY) > 2) text += "\n";
      else if (text && !text.endsWith("\n")) text += item.hasEOL ? "" : " ";
      text += item.str;
      lastY = y;
    }
    pages.push({ page: i, text: text.trim() });
  }
  await task.destroy();
  return pages;
}

// Renders every page to a canvas at the given scale and yields each one.
export async function renderPdfPages(
  bytes: ArrayBuffer,
  scale: number,
  onPage: (canvas: HTMLCanvasElement, pageIndex: number, total: number) => Promise<void> | void
): Promise<void> {
  const pdfjsLib = await loadPdfJs();
  const task = pdfjsLib.getDocument({ data: bytes.slice(0) });
  const pdf = await task.promise;
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext("2d")!;
    await page.render({ canvas, canvasContext: ctx, viewport }).promise;
    await onPage(canvas, i - 1, pdf.numPages);
    canvas.width = 0; // release memory
  }
  await task.destroy();
}

export function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Canvas export failed"))), type, quality);
  });
}

// Parses "1-3, 5, 7-9" into zero-based page indices, clamped to maxPage.
export function parsePageRanges(rangeStr: string, maxPage: number): number[] {
  const indices = new Set<number>();
  for (const part of rangeStr.split(",").map((s) => s.trim()).filter(Boolean)) {
    if (part.includes("-")) {
      const [start, end] = part.split("-").map(Number);
      if (isNaN(start) || isNaN(end)) continue;
      for (let n = start; n <= end; n++) {
        if (n >= 1 && n <= maxPage) indices.add(n - 1);
      }
    } else {
      const n = Number(part);
      if (!isNaN(n) && n >= 1 && n <= maxPage) indices.add(n - 1);
    }
  }
  return Array.from(indices).sort((a, b) => a - b);
}

const TEXT_PDF_DEFAULTS = { fontSize: 11, margin: 50, lineGap: 4 };

// Builds a simple paragraph-flow PDF from plain text using pdf-lib.
export async function textToPdfBytes(
  text: string,
  title?: string
): Promise<Uint8Array> {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const doc = await PDFDocument.create();
  if (title) doc.setTitle(title);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const { fontSize, margin, lineGap } = TEXT_PDF_DEFAULTS;
  const pageWidth = 595.28; // A4
  const pageHeight = 841.89;
  const maxWidth = pageWidth - margin * 2;
  const lineHeight = fontSize + lineGap;

  const sanitize = (s: string) => s.replace(/[^\x20-\x7E -ÿ\t]/g, "");

  const lines: string[] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = sanitize(rawLine);
    if (!line.trim()) {
      lines.push("");
      continue;
    }
    let current = "";
    for (const word of line.split(/\s+/)) {
      const candidate = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
        current = candidate;
      } else {
        if (current) lines.push(current);
        // Hard-break very long words.
        let chunk = word;
        while (font.widthOfTextAtSize(chunk, fontSize) > maxWidth && chunk.length > 1) {
          let cut = chunk.length;
          while (cut > 1 && font.widthOfTextAtSize(chunk.slice(0, cut), fontSize) > maxWidth) cut--;
          lines.push(chunk.slice(0, cut));
          chunk = chunk.slice(cut);
        }
        current = chunk;
      }
    }
    if (current) lines.push(current);
  }

  let page = doc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;
  for (const line of lines) {
    if (y < margin) {
      page = doc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
    if (line) {
      page.drawText(line, { x: margin, y, size: fontSize, font, color: rgb(0, 0, 0) });
    }
    y -= lineHeight;
  }

  return doc.save();
}
