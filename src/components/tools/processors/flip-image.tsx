"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Loader2, FlipHorizontal2, FlipVertical2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { UploadZone } from "@/components/tools/upload-zone";
import { UploadedFile, Tool } from "@/types";
import { downloadBlob, ACCEPTED_IMAGE_TYPES } from "@/lib/utils";
import JSZip from "jszip";

export default function FlipImage({ tool }: { tool: Tool }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [horizontal, setHorizontal] = useState(true);
  const [vertical, setVertical] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ blob: Blob; name: string } | null>(null);

  const handleFlip = async () => {
    if (!files.length || (!horizontal && !vertical)) return;
    setProcessing(true);
    setResult(null);
    setError("");
    try {
      const outputs = await Promise.all(
        files.map(async (f) => {
          const bitmap = await createImageBitmap(f.file);
          const canvas = document.createElement("canvas");
          canvas.width = bitmap.width;
          canvas.height = bitmap.height;
          const ctx = canvas.getContext("2d")!;
          ctx.translate(horizontal ? bitmap.width : 0, vertical ? bitmap.height : 0);
          ctx.scale(horizontal ? -1 : 1, vertical ? -1 : 1);
          ctx.drawImage(bitmap, 0, 0);
          bitmap.close();
          const blob = await new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error())), "image/png"));
          return { blob, name: f.name.replace(/\.[^.]+$/, "") + "-flipped.png" };
        })
      );

      if (outputs.length === 1) {
        setResult(outputs[0]);
      } else {
        const zip = new JSZip();
        outputs.forEach((o) => zip.file(o.name, o.blob));
        setResult({ blob: await zip.generateAsync({ type: "blob" }), name: "flipped-images.zip" });
      }
    } catch (e) {
      console.error(e);
      setError("Failed to flip images.");
    }
    setProcessing(false);
  };

  return (
    <div className="space-y-6">
      <UploadZone accept={ACCEPTED_IMAGE_TYPES} multiple onFilesChange={(f) => { setFiles(f); setResult(null); }} title="Upload images to flip" description="Mirror images horizontally or vertically" />

      {files.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-2">
            <Label>Flip Direction</Label>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setHorizontal(!horizontal)} className={`p-3 rounded-xl border-2 text-sm font-medium flex items-center justify-center gap-2 transition-all ${horizontal ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                <FlipHorizontal2 className="w-4 h-4" />Horizontal
              </button>
              <button onClick={() => setVertical(!vertical)} className={`p-3 rounded-xl border-2 text-sm font-medium flex items-center justify-center gap-2 transition-all ${vertical ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                <FlipVertical2 className="w-4 h-4" />Vertical
              </button>
            </div>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button onClick={handleFlip} disabled={processing || (!horizontal && !vertical)} size="lg" className="w-full" variant="gradient">
            {processing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Flipping...</> : <><FlipHorizontal2 className="w-4 h-4 mr-2" />Flip {files.length} Image{files.length > 1 ? "s" : ""}</>}
          </Button>
        </motion.div>
      )}

      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-2xl p-6">
          <p className="font-semibold text-green-700 dark:text-green-400 mb-3">Flip Complete!</p>
          <Button onClick={() => downloadBlob(result.blob, result.name)} variant="gradient" size="lg" className="w-full">
            <Download className="w-4 h-4 mr-2" />Download
          </Button>
        </motion.div>
      )}
    </div>
  );
}
