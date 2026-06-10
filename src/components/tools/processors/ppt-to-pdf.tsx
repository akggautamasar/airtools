"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Loader2, Presentation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UploadZone } from "@/components/tools/upload-zone";
import { UploadedFile, Tool } from "@/types";
import { downloadBlob, formatFileSize } from "@/lib/utils";

const PAGE_W = 841.89; // landscape A4, like a slide
const PAGE_H = 595.28;
const MARGIN = 56;

export default function PPTToPDF({ tool }: { tool: Tool }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ blob: Blob; name: string; slides: number } | null>(null);

  const handleConvert = async () => {
    if (!files.length) return;
    setProcessing(true);
    setResult(null);
    setError("");
    try {
      const f = files[0];
      const JSZip = (await import("jszip")).default;
      const zip = await JSZip.loadAsync(await f.file.arrayBuffer());

      // Slides live at ppt/slides/slide1.xml, slide2.xml, ...
      const slideNames = Object.keys(zip.files)
        .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
        .sort((a, b) => Number(a.match(/\d+/)![0]) - Number(b.match(/\d+/)![0]));

      if (!slideNames.length) {
        setError("No slides found. Only modern .pptx files are supported (not legacy .ppt).");
        setProcessing(false);
        return;
      }

      const parser = new DOMParser();
      const slides: string[][] = [];
      for (const name of slideNames) {
        const xml = await zip.files[name].async("text");
        const doc = parser.parseFromString(xml, "application/xml");
        // Paragraph nodes <a:p>, text runs <a:t>
        const paras: string[] = [];
        for (const p of Array.from(doc.getElementsByTagName("a:p"))) {
          const text = Array.from(p.getElementsByTagName("a:t")).map((t) => t.textContent || "").join("");
          if (text.trim()) paras.push(text.trim());
        }
        slides.push(paras);
      }

      const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
      const pdf = await PDFDocument.create();
      const regular = await pdf.embedFont(StandardFonts.Helvetica);
      const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
      const sanitize = (s: string) => s.replace(/[^\x20-\x7E -ÿ]/g, "");
      const maxWidth = PAGE_W - MARGIN * 2;

      slides.forEach((paras, si) => {
        const page = pdf.addPage([PAGE_W, PAGE_H]);
        let y = PAGE_H - MARGIN;
        page.drawText(`Slide ${si + 1}`, { x: MARGIN, y, size: 10, font: regular, color: rgb(0.6, 0.6, 0.6) });
        y -= 30;

        paras.forEach((para, pi) => {
          const isTitle = pi === 0;
          const size = isTitle ? 20 : 13;
          const font = isTitle ? bold : regular;
          const lineHeight = size * 1.4;
          let current = "";
          const lines: string[] = [];
          for (const word of sanitize(para).split(/\s+/)) {
            const candidate = current ? `${current} ${word}` : word;
            if (font.widthOfTextAtSize(candidate, size) <= maxWidth) current = candidate;
            else {
              if (current) lines.push(current);
              current = word;
            }
          }
          if (current) lines.push(current);
          for (const line of lines) {
            if (y < MARGIN) return;
            page.drawText(line, { x: MARGIN, y, size, font, color: rgb(0, 0, 0) });
            y -= lineHeight;
          }
          y -= isTitle ? 14 : 6;
        });
      });

      const out = await pdf.save();
      setResult({
        blob: new Blob([out.buffer as ArrayBuffer], { type: "application/pdf" }),
        name: f.name.replace(/\.pptx?$/i, "") + ".pdf",
        slides: slides.length,
      });
    } catch (e) {
      console.error(e);
      setError("Failed to convert this presentation.");
    }
    setProcessing(false);
  };

  return (
    <div className="space-y-6">
      <UploadZone
        accept={{ "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"] }}
        multiple={false}
        onFilesChange={(f) => { setFiles(f); setResult(null); setError(""); }}
        title="Upload PowerPoint (.pptx)"
        description="Each slide's text becomes a PDF page"
      />

      {files.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 text-xs text-blue-700 dark:text-blue-400">
            ℹ️ Slide text is preserved. Images, charts and slide designs are not carried over.
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button onClick={handleConvert} disabled={processing} size="lg" className="w-full" variant="gradient">
            {processing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Converting...</> : <><Presentation className="w-4 h-4 mr-2" />Convert to PDF</>}
          </Button>
        </motion.div>
      )}

      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-2xl p-6">
          <p className="font-semibold text-green-700 dark:text-green-400 mb-3">
            Converted {result.slides} slide{result.slides !== 1 ? "s" : ""}! ({formatFileSize(result.blob.size)})
          </p>
          <Button onClick={() => downloadBlob(result.blob, result.name)} variant="gradient" size="lg" className="w-full">
            <Download className="w-4 h-4 mr-2" />Download PDF
          </Button>
        </motion.div>
      )}
    </div>
  );
}
