"use client";

import { useState } from "react";
import { motion, Reorder } from "framer-motion";
import { Download, GripVertical, Loader2, FilePlus2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UploadZone } from "@/components/tools/upload-zone";
import { UploadedFile, Tool } from "@/types";
import { downloadBlob, formatFileSize, ACCEPTED_PDF_TYPES } from "@/lib/utils";
import { PDFDocument } from "pdf-lib";

export default function MergePDF({ tool }: { tool: Tool }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [orderedFiles, setOrderedFiles] = useState<UploadedFile[]>([]);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<Blob | null>(null);

  const handleFilesChange = (newFiles: UploadedFile[]) => {
    setFiles(newFiles);
    setOrderedFiles(newFiles);
    setResult(null);
  };

  const handleMerge = async () => {
    if (orderedFiles.length < 1) return;
    setProcessing(true);
    setResult(null);
    try {
      const merged = await PDFDocument.create();
      for (const f of orderedFiles) {
        const bytes = await f.file.arrayBuffer();
        const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const pages = await merged.copyPages(doc, doc.getPageIndices());
        pages.forEach((p) => merged.addPage(p));
      }
      const bytes = await merged.save();
      setResult(new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" }));
    } catch (e) {
      console.error(e);
    }
    setProcessing(false);
  };

  return (
    <div className="space-y-6">
      <UploadZone
        accept={ACCEPTED_PDF_TYPES}
        multiple
        onFilesChange={handleFilesChange}
        title="Upload PDFs to merge"
        description="Upload 2 or more PDF files to merge them"
      />

      {orderedFiles.length > 1 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-semibold mb-4">Drag to reorder files</h3>
            <Reorder.Group axis="y" values={orderedFiles} onReorder={setOrderedFiles} className="space-y-2">
              {orderedFiles.map((file, i) => (
                <Reorder.Item key={file.id} value={file} className="flex items-center gap-3 p-3 bg-muted rounded-xl cursor-grab active:cursor-grabbing">
                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                  <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                  </div>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>

          <Button onClick={handleMerge} disabled={processing} size="lg" className="w-full" variant="gradient">
            {processing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Merging...</> : <><FilePlus2 className="w-4 h-4 mr-2" />Merge {orderedFiles.length} PDFs</>}
          </Button>
        </motion.div>
      )}

      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-2xl p-6">
          <p className="font-semibold text-green-700 dark:text-green-400 mb-3">Merge Complete!</p>
          <Button onClick={() => downloadBlob(result, "merged.pdf")} variant="gradient" size="lg" className="w-full">
            <Download className="w-4 h-4 mr-2" />Download Merged PDF ({formatFileSize(result.size)})
          </Button>
        </motion.div>
      )}
    </div>
  );
}
