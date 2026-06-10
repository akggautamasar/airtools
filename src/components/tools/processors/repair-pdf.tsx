"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Loader2, Hammer, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UploadZone } from "@/components/tools/upload-zone";
import { UploadedFile, Tool } from "@/types";
import { downloadBlob, formatFileSize, ACCEPTED_PDF_TYPES } from "@/lib/utils";
import { PDFDocument } from "pdf-lib";

export default function RepairPDF({ tool }: { tool: Tool }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; name: string; pages: number } | null>(null);
  const [error, setError] = useState("");

  const handleRepair = async () => {
    if (!files.length) return;
    setProcessing(true);
    setResult(null);
    setError("");
    const f = files[0];
    try {
      const bytes = await f.file.arrayBuffer();
      const doc = await PDFDocument.load(bytes, {
        ignoreEncryption: true,
        throwOnInvalidObject: false,
        updateMetadata: false,
      });
      const pages = doc.getPageCount();
      const out = await doc.save();
      setResult({ blob: new Blob([out.buffer as ArrayBuffer], { type: "application/pdf" }), name: f.name, pages });
    } catch (e) {
      console.error(e);
      setError("This PDF is too damaged to repair automatically. Some files with severe corruption cannot be recovered in the browser.");
    }
    setProcessing(false);
  };

  return (
    <div className="space-y-6">
      <UploadZone accept={ACCEPTED_PDF_TYPES} multiple={false} onFilesChange={(f) => { setFiles(f); setResult(null); setError(""); }} title="Upload corrupted or damaged PDF" description="AirTools will attempt to rebuild the file structure" />
      {files.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>AirTools rebuilds the PDF&apos;s internal structure, which often fixes broken xref tables, invalid objects, and metadata issues caused by incomplete downloads or faulty editors.</p>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button onClick={handleRepair} disabled={processing} size="lg" className="w-full" variant="gradient">
            {processing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Repairing...</> : <><Hammer className="w-4 h-4 mr-2" />Repair PDF</>}
          </Button>
        </motion.div>
      )}
      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-2xl p-6 space-y-2">
          <p className="font-semibold text-green-700 dark:text-green-400">PDF Repaired!</p>
          <p className="text-xs text-muted-foreground">Recovered {result.pages} page{result.pages !== 1 ? "s" : ""}.</p>
          <Button onClick={() => downloadBlob(result.blob, `repaired-${result.name}`)} variant="gradient" size="lg" className="w-full">
            <Download className="w-4 h-4 mr-2" />Download ({formatFileSize(result.blob.size)})
          </Button>
        </motion.div>
      )}
    </div>
  );
}
