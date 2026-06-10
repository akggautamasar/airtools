"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Loader2, Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UploadZone } from "@/components/tools/upload-zone";
import { UploadedFile, Tool } from "@/types";
import { downloadBlob, formatFileSize, ACCEPTED_PDF_TYPES } from "@/lib/utils";
import { PDFDocument, PDFName } from "pdf-lib";

export default function RemoveAnnotations({ tool }: { tool: Tool }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; name: string; pagesAffected: number } | null>(null);
  const [error, setError] = useState("");

  const handleRemove = async () => {
    if (!files.length) return;
    setProcessing(true);
    setResult(null);
    setError("");
    const f = files[0];
    try {
      const bytes = await f.file.arrayBuffer();
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });

      let pagesAffected = 0;
      doc.getPages().forEach((page) => {
        if (page.node.lookup(PDFName.of("Annots"))) {
          page.node.delete(PDFName.of("Annots"));
          pagesAffected++;
        }
      });

      const out = await doc.save();
      setResult({ blob: new Blob([out.buffer as ArrayBuffer], { type: "application/pdf" }), name: f.name, pagesAffected });
    } catch (e) {
      console.error(e);
      setError("Failed to process PDF. The file may be corrupted or unsupported.");
    }
    setProcessing(false);
  };

  return (
    <div className="space-y-6">
      <UploadZone accept={ACCEPTED_PDF_TYPES} multiple={false} onFilesChange={(f) => { setFiles(f); setResult(null); setError(""); }} title="Upload PDF to clean" description="Removes highlights, comments, strikeouts, stamps, and other annotations" />
      {files.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 text-xs text-blue-700 dark:text-blue-400">
            ℹ️ This removes all annotation objects (highlights, sticky notes, strikeouts, underlines, stamps, etc.) from every page. The underlying page content stays unchanged.
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button onClick={handleRemove} disabled={processing} size="lg" className="w-full" variant="gradient">
            {processing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Removing annotations...</> : <><Eraser className="w-4 h-4 mr-2" />Remove Annotations</>}
          </Button>
        </motion.div>
      )}
      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-2xl p-6 space-y-2">
          <p className="font-semibold text-green-700 dark:text-green-400">Annotations Removed!</p>
          <p className="text-xs text-muted-foreground">
            {result.pagesAffected > 0 ? `Cleaned ${result.pagesAffected} page${result.pagesAffected !== 1 ? "s" : ""}.` : "No annotations were found in this document."}
          </p>
          <Button onClick={() => downloadBlob(result.blob, `cleaned-${result.name}`)} variant="gradient" size="lg" className="w-full">
            <Download className="w-4 h-4 mr-2" />Download ({formatFileSize(result.blob.size)})
          </Button>
        </motion.div>
      )}
    </div>
  );
}
