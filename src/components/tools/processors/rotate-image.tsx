"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Loader2, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UploadZone } from "@/components/tools/upload-zone";
import { UploadedFile, Tool } from "@/types";
import { downloadBlob, formatFileSize, ACCEPTED_IMAGE_TYPES } from "@/lib/utils";

export default function RotateImage({ tool }: { tool: Tool }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [angle, setAngle] = useState(90);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<{ name: string; blob: Blob; preview: string }[]>([]);

  const handleRotate = async () => {
    if (!files.length) return;
    setProcessing(true);
    setResults([]);
    const newResults = [];
    for (const f of files) {
      try {
        const img = new window.Image();
        const url = URL.createObjectURL(f.file);
        await new Promise((res) => { img.onload = res; img.src = url; });
        URL.revokeObjectURL(url);
        const rad = (angle * Math.PI) / 180;
        const cos = Math.abs(Math.cos(rad));
        const sin = Math.abs(Math.sin(rad));
        const newW = Math.round(img.width * cos + img.height * sin);
        const newH = Math.round(img.width * sin + img.height * cos);
        const canvas = document.createElement("canvas");
        canvas.width = newW;
        canvas.height = newH;
        const ctx = canvas.getContext("2d")!;
        ctx.translate(newW / 2, newH / 2);
        ctx.rotate(rad);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        const blob = await new Promise<Blob>((res, rej) => canvas.toBlob((b) => b ? res(b) : rej(), "image/jpeg", 0.92));
        const preview = URL.createObjectURL(blob);
        newResults.push({ name: f.name, blob, preview });
      } catch (e) { console.error(e); }
    }
    setResults(newResults);
    setProcessing(false);
  };

  return (
    <div className="space-y-6">
      <UploadZone accept={ACCEPTED_IMAGE_TYPES} multiple onFilesChange={setFiles} title="Upload images to rotate" />
      {files.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h3 className="font-semibold">Rotation Angle</h3>
            <div className="grid grid-cols-3 gap-3">
              {[90, 180, 270].map((a) => (
                <button key={a} onClick={() => setAngle(a)} className={`p-4 rounded-xl border-2 text-center transition-all ${angle === a ? "border-primary bg-primary/5" : "border-border"}`}>
                  <RotateCw className="w-5 h-5 mx-auto mb-1" />
                  <p className="font-semibold text-sm">{a}°</p>
                </button>
              ))}
            </div>
          </div>
          <Button onClick={handleRotate} disabled={processing} size="lg" className="w-full" variant="gradient">
            {processing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Rotating...</> : <><RotateCw className="w-4 h-4 mr-2" />Rotate Images</>}
          </Button>
        </motion.div>
      )}
      {results.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-2xl p-6 space-y-3">
          <p className="font-semibold text-green-700 dark:text-green-400">Rotation Complete!</p>
          {results.map((r, i) => (
            <div key={i} className="bg-white dark:bg-card rounded-xl p-3 border border-green-200 dark:border-green-800">
              <img src={r.preview} alt={r.name} className="w-full max-h-40 object-contain rounded-lg mb-2" />
              <Button size="sm" className="w-full" onClick={() => downloadBlob(r.blob, r.name)}>
                <Download className="w-3 h-3 mr-1" />Download
              </Button>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
