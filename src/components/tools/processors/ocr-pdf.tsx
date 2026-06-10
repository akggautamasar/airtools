"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Loader2, ScanText, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadZone } from "@/components/tools/upload-zone";
import { UploadedFile, Tool } from "@/types";
import { downloadBlob, formatFileSize, ACCEPTED_PDF_TYPES } from "@/lib/utils";
import { PDFDocument, StandardFonts } from "pdf-lib";

const RENDER_SCALE = 2;

const LANGUAGES: { code: string; label: string }[] = [
  { code: "eng", label: "English" },
  { code: "spa", label: "Spanish" },
  { code: "fra", label: "French" },
  { code: "deu", label: "German" },
  { code: "por", label: "Portuguese" },
  { code: "ita", label: "Italian" },
  { code: "nld", label: "Dutch" },
  { code: "hin", label: "Hindi" },
  { code: "ara", label: "Arabic" },
  { code: "rus", label: "Russian" },
  { code: "chi_sim", label: "Chinese (Simplified)" },
  { code: "jpn", label: "Japanese" },
  { code: "kor", label: "Korean" },
];

interface OCRWord {
  text: string;
  bbox: { x0: number; y0: number; x1: number; y1: number };
}

export default function OCRPDF({ tool }: { tool: Tool }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [language, setLanguage] = useState("eng");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ page: 0, total: 0, status: "" });
  const [result, setResult] = useState<{ pdfBlob: Blob; textBlob: Blob; name: string } | null>(null);
  const [error, setError] = useState("");

  const handleProcess = async () => {
    if (!files.length) return;
    setProcessing(true);
    setResult(null);
    setError("");
    setProgress({ page: 0, total: 0, status: "Loading PDF..." });

    try {
      const f = files[0];
      const bytes = await f.file.arrayBuffer();

      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
      const pdf = await pdfjsLib.getDocument({ data: bytes.slice(0) }).promise;

      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker(language, 1, {
        logger: (m: { status: string; progress: number }) => {
          if (m.status) {
            setProgress((prev) => ({ ...prev, status: `${m.status} (${Math.round((m.progress || 0) * 100)}%)` }));
          }
        },
      });

      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const pdfPages = doc.getPages();
      let fullText = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        setProgress({ page: i, total: pdf.numPages, status: "Rendering page..." });
        const pdfPage = await pdf.getPage(i);
        const viewport = pdfPage.getViewport({ scale: RENDER_SCALE });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;
        await pdfPage.render({ canvas, canvasContext: ctx, viewport }).promise;

        setProgress({ page: i, total: pdf.numPages, status: "Recognizing text..." });
        const { data } = await worker.recognize(canvas, {}, { blocks: true });
        fullText += `--- Page ${i} ---\n${data.text}\n\n`;

        const targetPage = pdfPages[i - 1];
        if (targetPage) {
          const { height: pdfHeight } = targetPage.getSize();
          const words: OCRWord[] = (data.blocks || []).flatMap((block) =>
            block.paragraphs.flatMap((para) => para.lines.flatMap((line) => line.words))
          );
          for (const word of words) {
            const text = word.text?.trim();
            if (!text) continue;
            const x = word.bbox.x0 / RENDER_SCALE;
            const y = pdfHeight - word.bbox.y1 / RENDER_SCALE;
            const size = Math.max(1, (word.bbox.y1 - word.bbox.y0) / RENDER_SCALE);
            try {
              targetPage.drawText(text, { x, y, size, font, opacity: 0 });
            } catch {
              // Skip characters the standard font can't encode (non-Latin scripts)
            }
          }
        }
      }

      await worker.terminate();

      setProgress({ page: pdf.numPages, total: pdf.numPages, status: "Saving..." });
      const out = await doc.save();
      const pdfBlob = new Blob([out.buffer as ArrayBuffer], { type: "application/pdf" });
      const textBlob = new Blob([fullText], { type: "text/plain" });
      setResult({ pdfBlob, textBlob, name: f.name });
    } catch (e) {
      console.error(e);
      setError("Failed to OCR this PDF. The file may be corrupted or unsupported.");
    }
    setProcessing(false);
  };

  return (
    <div className="space-y-6">
      <UploadZone accept={ACCEPTED_PDF_TYPES} multiple={false} onFilesChange={(f) => { setFiles(f); setResult(null); setError(""); }} title="Upload scanned PDF" description="Recognize text in scanned or image-based PDFs and make them searchable" />
      {files.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <div className="space-y-2">
              <Label>Document Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 text-xs text-blue-700 dark:text-blue-400">
              ℹ️ OCR runs entirely in your browser. The first run downloads a language model and may take a moment. Larger documents take longer — please keep this tab open while processing.
            </div>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button onClick={handleProcess} disabled={processing} size="lg" className="w-full" variant="gradient">
            {processing
              ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />{progress.total ? `Page ${progress.page}/${progress.total} — ${progress.status}` : progress.status || "Processing..."}</>
              : <><ScanText className="w-4 h-4 mr-2" />Run OCR</>}
          </Button>
        </motion.div>
      )}
      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-2xl p-6 space-y-3">
          <p className="font-semibold text-green-700 dark:text-green-400">Text Recognized!</p>
          <p className="text-xs text-muted-foreground">Your PDF now has a hidden, searchable and selectable text layer over the original pages.</p>
          <Button onClick={() => downloadBlob(result.pdfBlob, `searchable-${result.name}`)} variant="gradient" size="lg" className="w-full">
            <Download className="w-4 h-4 mr-2" />Download Searchable PDF ({formatFileSize(result.pdfBlob.size)})
          </Button>
          <Button onClick={() => downloadBlob(result.textBlob, `${result.name.replace(/\.pdf$/i, "")}.txt`)} variant="outline" size="lg" className="w-full">
            <FileText className="w-4 h-4 mr-2" />Download Extracted Text (.txt)
          </Button>
        </motion.div>
      )}
    </div>
  );
}
