"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Download, FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UploadZone } from "@/components/tools/upload-zone";
import { UploadedFile, Tool } from "@/types";
import { downloadBlob, formatFileSize, ACCEPTED_PDF_TYPES } from "@/lib/utils";
import { PDFDocument } from "pdf-lib";

export default function CompressPDF({ tool }: { tool: Tool }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<{ name: string; blob: Blob; originalSize: number; newSize: number }[]>([]);

  const handleProcess = async () => {
    if (!files.length) return;
    setProcessing(true);
    setResults([]);
    setErrors([]);

    const newResults = [];
    const failed: string[] = [];
    for (const f of files) {
      try {
        const arrayBuffer = await f.file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const compressed = await pdfDoc.save({ useObjectStreams: true, addDefaultPage: false, objectsPerTick: 50 });
        const check = await PDFDocument.load(compressed);
        if (check.getPageCount() !== pdfDoc.getPageCount()) throw new Error("Output page count mismatch");
        const output = compressed.byteLength < arrayBuffer.byteLength ? compressed : new Uint8Array(arrayBuffer);
        const blob = new Blob([new Uint8Array(output)], { type: "application/pdf" });
        newResults.push({ name: f.name, blob, originalSize: f.size, newSize: blob.size });
      } catch (e) {
        failed.push(f.name + ": " + (e instanceof Error ? e.message : "Unable to read or optimize PDF"));
      }
    }

    setResults(newResults);
    setErrors(failed);
    setProcessing(false);
  };

  const reduction = results.length > 0
    ? Math.round((1 - results.reduce((a, r) => a + r.newSize, 0) / results.reduce((a, r) => a + r.originalSize, 0)) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <UploadZone
        accept={ACCEPTED_PDF_TYPES}
        multiple
        onFilesChange={(selected) => { setFiles(selected); setResults([]); setErrors([]); }}
        title="Upload PDFs to optimize"
        description="Drag & drop PDF files here"
      />

      {files.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
            This tool optimizes PDF structure using object streams. It does not recompress images or adjust visual quality.
            If optimization cannot reduce the size, the original PDF is kept.
          </div>
          {errors.length > 0 && (
            <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/20 dark:text-red-400">
              {errors.map((message, i) => <p key={i}>{message}</p>)}
            </div>
          )}
          <Button onClick={handleProcess} disabled={processing} size="lg" className="w-full" variant="gradient">
            {processing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Compressing...</> : <><FileDown className="w-4 h-4 mr-2" /> Compress {files.length} PDF{files.length > 1 ? "s" : ""}</>}
          </Button>
        </motion.div>
      )}

      {errors.length > 0 && results.length === 0 && <p role="alert" className="text-sm text-red-500">{errors.join(" • ")}</p>}
      {results.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
              <FileDown className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-green-700 dark:text-green-400">{reduction > 0 ? "PDF optimization complete" : "No size reduction found — original files retained"}</p>
              {reduction > 0 && <p className="text-sm text-green-600 dark:text-green-500">Total size reduced by {reduction}%</p>}
            </div>
          </div>
          {results.map((r, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-white dark:bg-card rounded-xl border border-green-200 dark:border-green-800">
              <div>
                <p className="text-sm font-medium truncate max-w-xs">{r.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(r.originalSize)} → {formatFileSize(r.newSize)}</p>
              </div>
              <Button size="sm" onClick={() => downloadBlob(r.blob, r.name)}>
                <Download className="w-4 h-4 mr-1" /> Download
              </Button>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
