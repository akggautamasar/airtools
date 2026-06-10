"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Loader2, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { UploadZone } from "@/components/tools/upload-zone";
import { UploadedFile, Tool } from "@/types";
import { downloadBlob, formatFileSize, ACCEPTED_PDF_TYPES } from "@/lib/utils";
import { PDFDocument } from "pdf-lib";

const PAGE_SIZES: Record<string, [number, number] | null> = {
  Original: null,
  A4: [595.28, 841.89],
  Letter: [612, 792],
  Legal: [612, 1008],
  A3: [841.89, 1190.55],
  A5: [419.53, 595.28],
};

export default function ResizePDF({ tool }: { tool: Tool }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [pageSize, setPageSize] = useState<keyof typeof PAGE_SIZES>("A4");
  const [margin, setMargin] = useState(20);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; name: string } | null>(null);
  const [error, setError] = useState("");

  const handleResize = async () => {
    if (!files.length) return;
    setProcessing(true);
    setResult(null);
    setError("");
    const f = files[0];
    try {
      const bytes = await f.file.arrayBuffer();
      const srcDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const newDoc = await PDFDocument.create();

      for (const page of srcDoc.getPages()) {
        const embedded = await newDoc.embedPage(page);
        const { width: srcW, height: srcH } = page.getSize();
        const target = PAGE_SIZES[pageSize] ?? [srcW, srcH];
        const [targetW, targetH] = target;

        const availW = Math.max(targetW - margin * 2, 1);
        const availH = Math.max(targetH - margin * 2, 1);
        const scale = Math.min(availW / srcW, availH / srcH);
        const drawW = srcW * scale;
        const drawH = srcH * scale;
        const x = (targetW - drawW) / 2;
        const y = (targetH - drawH) / 2;

        const newPage = newDoc.addPage([targetW, targetH]);
        newPage.drawPage(embedded, { x, y, width: drawW, height: drawH });
      }

      const out = await newDoc.save();
      setResult({ blob: new Blob([out.buffer as ArrayBuffer], { type: "application/pdf" }), name: f.name });
    } catch (e) {
      console.error(e);
      setError("Failed to resize PDF. The file may be corrupted or unsupported.");
    }
    setProcessing(false);
  };

  return (
    <div className="space-y-6">
      <UploadZone accept={ACCEPTED_PDF_TYPES} multiple={false} onFilesChange={(f) => { setFiles(f); setResult(null); setError(""); }} title="Upload PDF to resize" />
      {files.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
            <div className="space-y-2">
              <Label>Page Size</Label>
              <div className="grid grid-cols-3 gap-2">
                {Object.keys(PAGE_SIZES).map((size) => (
                  <button
                    key={size}
                    onClick={() => setPageSize(size as keyof typeof PAGE_SIZES)}
                    className={`p-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                      pageSize === size ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {pageSize === "Original" ? "Keep each page's original dimensions and just adjust margins." : `Pages will be resized to ${pageSize} and centered with the margin below.`}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Margin / Padding: {margin}pt</Label>
              <Slider value={[margin]} onValueChange={([v]) => setMargin(v)} min={0} max={100} step={5} />
            </div>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button onClick={handleResize} disabled={processing} size="lg" className="w-full" variant="gradient">
            {processing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Resizing...</> : <><Maximize2 className="w-4 h-4 mr-2" />Resize PDF</>}
          </Button>
        </motion.div>
      )}
      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-2xl p-6">
          <p className="font-semibold text-green-700 dark:text-green-400 mb-3">PDF Resized!</p>
          <Button onClick={() => downloadBlob(result.blob, `resized-${result.name}`)} variant="gradient" size="lg" className="w-full">
            <Download className="w-4 h-4 mr-2" />Download ({formatFileSize(result.blob.size)})
          </Button>
        </motion.div>
      )}
    </div>
  );
}
