"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UploadZone } from "@/components/tools/upload-zone";
import { UploadedFile, Tool } from "@/types";
import { downloadBlob, formatFileSize, ACCEPTED_PDF_TYPES } from "@/lib/utils";
import { extractPdfText } from "@/lib/pdf-client";

export default function PDFToWord({ tool }: { tool: Tool }) {
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
      const pages = await extractPdfText(await f.file.arrayBuffer());
      if (!pages.some((p) => p.text.trim())) {
        setError("No selectable text found — this looks like a scanned PDF. Run it through the OCR PDF tool first.");
        setProcessing(false);
        return;
      }

      const { Document, Packer, Paragraph, TextRun, PageBreak } = await import("docx");
      const children = pages.flatMap((p, pi) => {
        const paras = p.text.split(/\n+/).filter((l) => l.trim()).map(
          (line) => new Paragraph({ children: [new TextRun(line)], spacing: { after: 120 } })
        );
        if (pi < pages.length - 1) {
          paras.push(new Paragraph({ children: [new PageBreak()] }));
        }
        return paras;
      });

      const doc = new Document({ sections: [{ children }] });
      const blob = await Packer.toBlob(doc);
      setResult({ blob, name: f.name.replace(/\.pdf$/i, ".docx") });
    } catch (e) {
      console.error(e);
      setError("Failed to convert this PDF.");
    }
    setProcessing(false);
  };

  return (
    <div className="space-y-6">
      <UploadZone accept={ACCEPTED_PDF_TYPES} multiple={false} onFilesChange={(f) => { setFiles(f); setResult(null); setError(""); }} title="Upload PDF to convert to Word" description="Text content is converted to an editable DOCX document" />

      {files.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 text-xs text-blue-700 dark:text-blue-400">
            ℹ️ Text and paragraphs are preserved. Complex layouts, tables and images are not carried over.
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button onClick={handleConvert} disabled={processing} size="lg" className="w-full" variant="gradient">
            {processing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Converting...</> : <><FileText className="w-4 h-4 mr-2" />Convert to Word</>}
          </Button>
        </motion.div>
      )}

      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-2xl p-6">
          <p className="font-semibold text-green-700 dark:text-green-400 mb-3">Conversion Complete! ({formatFileSize(result.blob.size)})</p>
          <Button onClick={() => downloadBlob(result.blob, result.name)} variant="gradient" size="lg" className="w-full">
            <Download className="w-4 h-4 mr-2" />Download DOCX
          </Button>
        </motion.div>
      )}
    </div>
  );
}
