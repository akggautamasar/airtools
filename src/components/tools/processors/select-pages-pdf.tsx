"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Loader2, FileX, FileOutput } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadZone } from "@/components/tools/upload-zone";
import { UploadedFile, Tool } from "@/types";
import { downloadBlob, formatFileSize, ACCEPTED_PDF_TYPES } from "@/lib/utils";
import { parsePageRanges } from "@/lib/pdf-client";

// Handles both "remove-pages" (keep everything except the selection) and
// "extract-pdf" (keep only the selection).
export default function SelectPagesPDF({ tool }: { tool: Tool }) {
  const isRemove = tool.slug === "remove-pages";
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [pageCount, setPageCount] = useState(0);
  const [range, setRange] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ blob: Blob; name: string; pages: number } | null>(null);

  const handleFilesChange = async (f: UploadedFile[]) => {
    setFiles(f);
    setResult(null);
    setError("");
    setPageCount(0);
    if (f.length) {
      try {
        const { PDFDocument } = await import("pdf-lib");
        const doc = await PDFDocument.load(await f[0].file.arrayBuffer(), { ignoreEncryption: true });
        setPageCount(doc.getPageCount());
      } catch {
        setError("Could not read this PDF.");
      }
    }
  };

  const handleProcess = async () => {
    if (!files.length || !range.trim()) return;
    setProcessing(true);
    setResult(null);
    setError("");
    try {
      const { PDFDocument } = await import("pdf-lib");
      const f = files[0];
      const srcDoc = await PDFDocument.load(await f.file.arrayBuffer(), { ignoreEncryption: true });
      const total = srcDoc.getPageCount();
      const selected = parsePageRanges(range, total);
      if (!selected.length) {
        setError("No valid pages in that range.");
        setProcessing(false);
        return;
      }

      const keep = isRemove
        ? Array.from({ length: total }, (_, i) => i).filter((i) => !selected.includes(i))
        : selected;

      if (!keep.length) {
        setError("That selection would remove every page.");
        setProcessing(false);
        return;
      }

      const newDoc = await PDFDocument.create();
      const pages = await newDoc.copyPages(srcDoc, keep);
      pages.forEach((p) => newDoc.addPage(p));
      const out = await newDoc.save();
      const suffix = isRemove ? "pages-removed" : "extracted";
      setResult({
        blob: new Blob([out.buffer as ArrayBuffer], { type: "application/pdf" }),
        name: f.name.replace(/\.pdf$/i, `-${suffix}.pdf`),
        pages: keep.length,
      });
    } catch (e) {
      console.error(e);
      setError("Failed to process PDF. The file may be corrupted or encrypted.");
    }
    setProcessing(false);
  };

  const Icon = isRemove ? FileX : FileOutput;

  return (
    <div className="space-y-6">
      <UploadZone accept={ACCEPTED_PDF_TYPES} multiple={false} onFilesChange={handleFilesChange} title={`Upload PDF to ${isRemove ? "remove pages from" : "extract pages from"}`} description="Upload one PDF file" />

      {files.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
            <Label>
              Pages to {isRemove ? "remove" : "extract"}
              {pageCount > 0 && <span className="text-muted-foreground font-normal"> — document has {pageCount} pages</span>}
            </Label>
            <Input value={range} onChange={(e) => setRange(e.target.value)} placeholder="e.g. 1-3, 5, 7-9" />
            <p className="text-xs text-muted-foreground">
              {isRemove
                ? "These pages will be deleted; all other pages are kept."
                : "Only these pages will be saved into a new PDF."}
            </p>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button onClick={handleProcess} disabled={processing || !range.trim()} size="lg" className="w-full" variant="gradient">
            {processing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Processing...</> : <><Icon className="w-4 h-4 mr-2" />{isRemove ? "Remove Pages" : "Extract Pages"}</>}
          </Button>
        </motion.div>
      )}

      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-2xl p-6">
          <p className="font-semibold text-green-700 dark:text-green-400 mb-3">
            Done! New PDF has {result.pages} page{result.pages !== 1 ? "s" : ""} ({formatFileSize(result.blob.size)})
          </p>
          <Button onClick={() => downloadBlob(result.blob, result.name)} variant="gradient" size="lg" className="w-full">
            <Download className="w-4 h-4 mr-2" />Download PDF
          </Button>
        </motion.div>
      )}
    </div>
  );
}
