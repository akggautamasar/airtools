"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Loader2, Construction } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UploadZone } from "@/components/tools/upload-zone";
import { UploadedFile, Tool } from "@/types";
import { downloadBlob, ACCEPTED_PDF_TYPES, ACCEPTED_DOCUMENT_TYPES } from "@/lib/utils";
import { PDFDocument } from "pdf-lib";

export default function GenericPDFTool({ tool }: { tool: Tool }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; name: string } | null>(null);

  const handleProcess = async () => {
    if (!files.length) return;
    setProcessing(true);
    setResult(null);
    const f = files[0];
    try {
      const bytes = await f.file.arrayBuffer();
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const out = await doc.save();
      setResult({ blob: new Blob([out.buffer as ArrayBuffer], { type: "application/pdf" }), name: f.name });
    } catch (e) { console.error(e); }
    setProcessing(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-center gap-3">
        <Construction className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
        <p className="text-sm text-amber-700 dark:text-amber-400">
          <strong>{tool.name}</strong> requires server-side processing for full conversion. Basic PDF processing is available below.
        </p>
      </div>
      <UploadZone
        accept={{ ...ACCEPTED_PDF_TYPES, ...ACCEPTED_DOCUMENT_TYPES }}
        multiple={false}
        onFilesChange={setFiles}
        title={`Upload file for ${tool.name}`}
      />
      {files.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Button onClick={handleProcess} disabled={processing} size="lg" className="w-full" variant="gradient">
            {processing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Processing...</> : <>Process with {tool.name}</>}
          </Button>
        </motion.div>
      )}
      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-2xl p-6">
          <p className="font-semibold text-green-700 dark:text-green-400 mb-3">Processing Complete!</p>
          <Button onClick={() => downloadBlob(result.blob, result.name)} variant="gradient" size="lg" className="w-full">
            <Download className="w-4 h-4 mr-2" />Download
          </Button>
        </motion.div>
      )}
    </div>
  );
}
