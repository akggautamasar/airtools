"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Loader2, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UploadZone } from "@/components/tools/upload-zone";
import { UploadedFile, Tool } from "@/types";
import { downloadBlob, formatFileSize, ACCEPTED_PDF_TYPES } from "@/lib/utils";
import { PDFDocument, degrees } from "pdf-lib";

export default function RotatePDF({ tool }: { tool: Tool }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [rotation, setRotation] = useState(90);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; name: string } | null>(null);

  const handleRotate = async () => {
    if (!files.length) return;
    setProcessing(true);
    setResult(null);
    const f = files[0];
    try {
      const bytes = await f.file.arrayBuffer();
      const doc = await PDFDocument.load(bytes);
      doc.getPages().forEach((page) => {
        page.setRotation(degrees((page.getRotation().angle + rotation) % 360));
      });
      const out = await doc.save();
      setResult({ blob: new Blob([out.buffer as ArrayBuffer], { type: "application/pdf" }), name: f.name });
    } catch (e) { console.error(e); }
    setProcessing(false);
  };

  return (
    <div className="space-y-6">
      <UploadZone accept={ACCEPTED_PDF_TYPES} multiple={false} onFilesChange={setFiles} title="Upload PDF to rotate" />
      {files.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-semibold mb-4">Rotation Angle</h3>
            <div className="grid grid-cols-3 gap-3">
              {[90, 180, 270].map((r) => (
                <button key={r} onClick={() => setRotation(r)}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${rotation === r ? "border-primary bg-primary/5" : "border-border"}`}>
                  <RotateCw className="w-6 h-6 mx-auto mb-1" style={{ transform: `rotate(${r}deg)` }} />
                  <p className="font-semibold text-sm">{r}°</p>
                </button>
              ))}
            </div>
          </div>
          <Button onClick={handleRotate} disabled={processing} size="lg" className="w-full" variant="gradient">
            {processing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Rotating...</> : <><RotateCw className="w-4 h-4 mr-2" />Rotate All Pages</>}
          </Button>
        </motion.div>
      )}
      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-2xl p-6">
          <p className="font-semibold text-green-700 dark:text-green-400 mb-3">Rotation Complete!</p>
          <Button onClick={() => downloadBlob(result.blob, `rotated-${result.name}`)} variant="gradient" size="lg" className="w-full">
            <Download className="w-4 h-4 mr-2" />Download ({formatFileSize(result.blob.size)})
          </Button>
        </motion.div>
      )}
    </div>
  );
}
