"use client";
import { useState } from "react";
import { motion, Reorder } from "framer-motion";
import { Download, Loader2, GripVertical, FileImage } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UploadZone } from "@/components/tools/upload-zone";
import { UploadedFile, Tool } from "@/types";
import { downloadBlob, formatFileSize, ACCEPTED_IMAGE_TYPES } from "@/lib/utils";
import { PDFDocument } from "pdf-lib";

export default function ImageToPDF({ tool }: { tool: Tool }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [orderedFiles, setOrderedFiles] = useState<UploadedFile[]>([]);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<Blob | null>(null);

  const handleFilesChange = (f: UploadedFile[]) => {
    setFiles(f);
    setOrderedFiles(f);
    setResult(null);
  };

  const handleConvert = async () => {
    if (!orderedFiles.length) return;
    setProcessing(true);
    setResult(null);
    try {
      const doc = await PDFDocument.create();
      for (const f of orderedFiles) {
        const bytes = await f.file.arrayBuffer();
        let img;
        if (f.type === "image/jpeg" || f.type === "image/jpg") {
          img = await doc.embedJpg(bytes);
        } else {
          img = await doc.embedPng(bytes);
        }
        const page = doc.addPage([img.width, img.height]);
        page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
      }
      const out = await doc.save();
      setResult(new Blob([out.buffer as ArrayBuffer], { type: "application/pdf" }));
    } catch (e) { console.error(e); }
    setProcessing(false);
  };

  return (
    <div className="space-y-6">
      <UploadZone accept={ACCEPTED_IMAGE_TYPES} multiple onFilesChange={handleFilesChange} title="Upload images to convert to PDF" description="JPG, PNG, WEBP supported" />
      {orderedFiles.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {orderedFiles.length > 1 && (
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="font-semibold mb-4">Drag to reorder</h3>
              <Reorder.Group axis="y" values={orderedFiles} onReorder={setOrderedFiles} className="space-y-2">
                {orderedFiles.map((f, i) => (
                  <Reorder.Item key={f.id} value={f} className="flex items-center gap-3 p-3 bg-muted rounded-xl cursor-grab">
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                    <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center">{i + 1}</span>
                    {f.preview && <img src={f.preview} alt={f.name} className="w-10 h-10 rounded object-cover" />}
                    <p className="text-sm flex-1 truncate">{f.name}</p>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            </div>
          )}
          <Button onClick={handleConvert} disabled={processing} size="lg" className="w-full" variant="gradient">
            {processing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Converting...</> : <><FileImage className="w-4 h-4 mr-2" />Convert to PDF</>}
          </Button>
        </motion.div>
      )}
      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-2xl p-6">
          <p className="font-semibold text-green-700 dark:text-green-400 mb-3">Conversion Complete!</p>
          <Button onClick={() => downloadBlob(result, "images.pdf")} variant="gradient" size="lg" className="w-full">
            <Download className="w-4 h-4 mr-2" />Download PDF ({formatFileSize(result.size)})
          </Button>
        </motion.div>
      )}
    </div>
  );
}
