"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UploadZone } from "@/components/tools/upload-zone";
import { UploadedFile, Tool } from "@/types";
import { downloadBlob, formatFileSize } from "@/lib/utils";
import { textToPdfBytes } from "@/lib/pdf-client";

export default function TxtToPDF({ tool }: { tool: Tool }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<{ blob: Blob; name: string }[]>([]);

  const handleConvert = async () => {
    if (!files.length) return;
    setProcessing(true);
    setResults([]);
    setError("");
    const out: { blob: Blob; name: string }[] = [];
    for (const f of files) {
      try {
        const text = await f.file.text();
        const bytes = await textToPdfBytes(text, f.name);
        out.push({
          blob: new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" }),
          name: f.name.replace(/\.txt$/i, "") + ".pdf",
        });
      } catch (e) {
        console.error(e);
        setError(`Failed to convert ${f.name}.`);
      }
    }
    setResults(out);
    setProcessing(false);
  };

  return (
    <div className="space-y-6">
      <UploadZone accept={{ "text/plain": [".txt"] }} multiple onFilesChange={(f) => { setFiles(f); setResults([]); setError(""); }} title="Upload TXT files to convert" description="Each text file becomes a formatted PDF" />

      {files.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button onClick={handleConvert} disabled={processing} size="lg" className="w-full" variant="gradient">
            {processing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Converting...</> : <><FileText className="w-4 h-4 mr-2" />Convert {files.length} File{files.length > 1 ? "s" : ""} to PDF</>}
          </Button>
        </motion.div>
      )}

      {results.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-2xl p-6 space-y-3">
          <p className="font-semibold text-green-700 dark:text-green-400">Conversion Complete!</p>
          {results.map((r, i) => (
            <Button key={i} onClick={() => downloadBlob(r.blob, r.name)} variant="gradient" size="lg" className="w-full">
              <Download className="w-4 h-4 mr-2" />{r.name} ({formatFileSize(r.blob.size)})
            </Button>
          ))}
        </motion.div>
      )}
    </div>
  );
}
