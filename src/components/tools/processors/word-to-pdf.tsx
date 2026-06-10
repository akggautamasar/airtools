"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UploadZone } from "@/components/tools/upload-zone";
import { UploadedFile, Tool } from "@/types";
import { downloadBlob, formatFileSize } from "@/lib/utils";

interface Block {
  text: string;
  size: number;
  bold: boolean;
  spaceAfter: number;
}

const PAGE_W = 595.28; // A4
const PAGE_H = 841.89;
const MARGIN = 56;

function htmlToBlocks(html: string): Block[] {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const blocks: Block[] = [];
  const walk = (el: Element) => {
    for (const child of Array.from(el.children)) {
      const tag = child.tagName.toLowerCase();
      if (/^h[1-6]$/.test(tag)) {
        const level = Number(tag[1]);
        const text = child.textContent?.trim();
        if (text) blocks.push({ text, size: Math.max(13, 22 - level * 2), bold: true, spaceAfter: 10 });
      } else if (tag === "p") {
        const text = child.textContent?.trim();
        if (text) blocks.push({ text, size: 11, bold: false, spaceAfter: 8 });
      } else if (tag === "li") {
        const text = child.textContent?.trim();
        if (text) blocks.push({ text: `•  ${text}`, size: 11, bold: false, spaceAfter: 4 });
      } else if (tag === "table") {
        for (const row of Array.from(child.querySelectorAll("tr"))) {
          const cells = Array.from(row.querySelectorAll("td,th")).map((c) => c.textContent?.trim() || "");
          if (cells.some(Boolean)) blocks.push({ text: cells.join("  |  "), size: 10, bold: false, spaceAfter: 4 });
        }
        blocks.push({ text: "", size: 11, bold: false, spaceAfter: 8 });
      } else {
        walk(child);
      }
    }
  };
  walk(doc.body);
  return blocks;
}

export default function WordToPDF({ tool }: { tool: Tool }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ blob: Blob; name: string } | null>(null);

  const handleConvert = async () => {
    if (!files.length) return;
    setProcessing(true);
    setResult(null);
    setError("");
    try {
      const f = files[0];
      const mammoth = await import("mammoth");
      const { value: html } = await mammoth.convertToHtml({ arrayBuffer: await f.file.arrayBuffer() });
      const blocks = htmlToBlocks(html);
      if (!blocks.length) {
        setError("No readable content found in this document.");
        setProcessing(false);
        return;
      }

      const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
      const pdf = await PDFDocument.create();
      pdf.setTitle(f.name);
      const regular = await pdf.embedFont(StandardFonts.Helvetica);
      const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
      const maxWidth = PAGE_W - MARGIN * 2;
      const sanitize = (s: string) => s.replace(/[^\x20-\x7E -ÿ\t]/g, "");

      let page = pdf.addPage([PAGE_W, PAGE_H]);
      let y = PAGE_H - MARGIN;

      for (const block of blocks) {
        const font = block.bold ? bold : regular;
        const lineHeight = block.size * 1.35;
        // word-wrap
        const lines: string[] = [];
        let current = "";
        for (const word of sanitize(block.text).split(/\s+/)) {
          const candidate = current ? `${current} ${word}` : word;
          if (font.widthOfTextAtSize(candidate, block.size) <= maxWidth) current = candidate;
          else {
            if (current) lines.push(current);
            current = word;
          }
        }
        if (current) lines.push(current);

        for (const line of lines) {
          if (y < MARGIN + lineHeight) {
            page = pdf.addPage([PAGE_W, PAGE_H]);
            y = PAGE_H - MARGIN;
          }
          page.drawText(line, { x: MARGIN, y, size: block.size, font, color: rgb(0, 0, 0) });
          y -= lineHeight;
        }
        y -= block.spaceAfter;
      }

      const out = await pdf.save();
      setResult({
        blob: new Blob([out.buffer as ArrayBuffer], { type: "application/pdf" }),
        name: f.name.replace(/\.(docx?|doc)$/i, "") + ".pdf",
      });
    } catch (e) {
      console.error(e);
      setError("Failed to convert. Only modern .docx files are supported (not legacy .doc).");
    }
    setProcessing(false);
  };

  return (
    <div className="space-y-6">
      <UploadZone
        accept={{ "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"] }}
        multiple={false}
        onFilesChange={(f) => { setFiles(f); setResult(null); setError(""); }}
        title="Upload Word document (.docx)"
        description="Headings, paragraphs, lists and table text are converted to PDF"
      />

      {files.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button onClick={handleConvert} disabled={processing} size="lg" className="w-full" variant="gradient">
            {processing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Converting...</> : <><FileText className="w-4 h-4 mr-2" />Convert to PDF</>}
          </Button>
        </motion.div>
      )}

      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-2xl p-6">
          <p className="font-semibold text-green-700 dark:text-green-400 mb-3">Conversion Complete! ({formatFileSize(result.blob.size)})</p>
          <Button onClick={() => downloadBlob(result.blob, result.name)} variant="gradient" size="lg" className="w-full">
            <Download className="w-4 h-4 mr-2" />Download PDF
          </Button>
        </motion.div>
      )}
    </div>
  );
}
