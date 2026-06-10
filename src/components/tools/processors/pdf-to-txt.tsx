"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Loader2, AlignLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UploadZone } from "@/components/tools/upload-zone";
import { UploadedFile, Tool } from "@/types";
import { downloadBlob, formatFileSize, ACCEPTED_PDF_TYPES } from "@/lib/utils";
import { extractPdfText } from "@/lib/pdf-client";

export default function PDFToTxt({ tool }: { tool: Tool }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ blob: Blob; name: string; preview: string } | null>(null);

  const handleExtract = async () => {
    if (!files.length) return;
    setProcessing(true);
    setResult(null);
    setError("");
    try {
      const f = files[0];
      const pages = await extractPdfText(await f.file.arrayBuffer());
      const text = pages.map((p) => p.text).join("\n\n");
      if (!text.trim()) {
        setError("No selectable text found — this looks like a scanned PDF. Try the OCR PDF tool instead.");
      } else {
        setResult({
          blob: new Blob([text], { type: "text/plain;charset=utf-8" }),
          name: f.name.replace(/\.pdf$/i, ".txt"),
          preview: text.slice(0, 600),
        });
      }
    } catch (e) {
      console.error(e);
      setError("Failed to extract text from this PDF.");
    }
    setProcessing(false);
  };

  return (
    <div className="space-y-6">
      <UploadZone accept={ACCEPTED_PDF_TYPES} multiple={false} onFilesChange={(f) => { setFiles(f); setResult(null); setError(""); }} title="Upload PDF to extract text from" description="All text content is saved as a plain .txt file" />

      {files.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button onClick={handleExtract} disabled={processing} size="lg" className="w-full" variant="gradient">
            {processing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Extracting...</> : <><AlignLeft className="w-4 h-4 mr-2" />Extract Text</>}
          </Button>
        </motion.div>
      )}

      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-2xl p-6 space-y-3">
          <p className="font-semibold text-green-700 dark:text-green-400">Text Extracted! ({formatFileSize(result.blob.size)})</p>
          <pre className="bg-white dark:bg-card border border-border rounded-xl p-3 text-xs max-h-48 overflow-auto whitespace-pre-wrap">{result.preview}{result.preview.length >= 600 ? "…" : ""}</pre>
          <Button onClick={() => downloadBlob(result.blob, result.name)} variant="gradient" size="lg" className="w-full">
            <Download className="w-4 h-4 mr-2" />Download TXT
          </Button>
        </motion.div>
      )}
    </div>
  );
}
