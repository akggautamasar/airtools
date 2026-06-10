"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Loader2, Layers, ArrowRight, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { UploadZone } from "@/components/tools/upload-zone";
import { UploadedFile, Tool } from "@/types";
import { downloadBlob, formatFileSize, ACCEPTED_IMAGE_TYPES } from "@/lib/utils";

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Failed to load image")); };
    img.src = url;
  });
}

export default function ImageMerge({ tool }: { tool: Tool }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [direction, setDirection] = useState<"horizontal" | "vertical">("vertical");
  const [spacing, setSpacing] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ blob: Blob; preview: string } | null>(null);

  const handleMerge = async () => {
    if (files.length < 2) return;
    setProcessing(true);
    setResult(null);
    setError("");
    try {
      const images = await Promise.all(files.map((f) => loadImage(f.file)));

      let canvasW: number, canvasH: number;
      if (direction === "horizontal") {
        // Normalize all images to the same height (the tallest).
        const targetH = Math.max(...images.map((i) => i.naturalHeight));
        const widths = images.map((i) => (i.naturalWidth * targetH) / i.naturalHeight);
        canvasW = widths.reduce((a, b) => a + b, 0) + spacing * (images.length - 1);
        canvasH = targetH;
      } else {
        const targetW = Math.max(...images.map((i) => i.naturalWidth));
        const heights = images.map((i) => (i.naturalHeight * targetW) / i.naturalWidth);
        canvasW = targetW;
        canvasH = heights.reduce((a, b) => a + b, 0) + spacing * (images.length - 1);
      }

      const canvas = document.createElement("canvas");
      canvas.width = Math.round(canvasW);
      canvas.height = Math.round(canvasH);
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let cursor = 0;
      for (const img of images) {
        if (direction === "horizontal") {
          const w = (img.naturalWidth * canvas.height) / img.naturalHeight;
          ctx.drawImage(img, cursor, 0, w, canvas.height);
          cursor += w + spacing;
        } else {
          const h = (img.naturalHeight * canvas.width) / img.naturalWidth;
          ctx.drawImage(img, 0, cursor, canvas.width, h);
          cursor += h + spacing;
        }
      }

      const blob = await new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error())), "image/png"));
      setResult({ blob, preview: URL.createObjectURL(blob) });
    } catch (e) {
      console.error(e);
      setError("Failed to merge images.");
    }
    setProcessing(false);
  };

  return (
    <div className="space-y-6">
      <UploadZone accept={ACCEPTED_IMAGE_TYPES} multiple onFilesChange={(f) => { setFiles(f); setResult(null); }} title="Upload images to merge" description="Images are combined in the order you add them" />

      {files.length >= 2 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <div className="space-y-2">
              <Label>Direction</Label>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setDirection("vertical")} className={`p-3 rounded-xl border-2 text-sm font-medium flex items-center justify-center gap-2 transition-all ${direction === "vertical" ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                  <ArrowDown className="w-4 h-4" />Vertical
                </button>
                <button onClick={() => setDirection("horizontal")} className={`p-3 rounded-xl border-2 text-sm font-medium flex items-center justify-center gap-2 transition-all ${direction === "horizontal" ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                  <ArrowRight className="w-4 h-4" />Horizontal
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Spacing: {spacing}px</Label>
              <input type="range" min={0} max={100} value={spacing} onChange={(e) => setSpacing(Number(e.target.value))} className="w-full" />
            </div>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button onClick={handleMerge} disabled={processing} size="lg" className="w-full" variant="gradient">
            {processing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Merging...</> : <><Layers className="w-4 h-4 mr-2" />Merge {files.length} Images</>}
          </Button>
        </motion.div>
      )}

      {files.length === 1 && (
        <p className="text-sm text-muted-foreground text-center">Add at least one more image to merge.</p>
      )}

      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-2xl p-6 space-y-3">
          <p className="font-semibold text-green-700 dark:text-green-400">Merge Complete! ({formatFileSize(result.blob.size)})</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={result.preview} alt="Merged result" className="max-h-72 mx-auto rounded-xl border border-border" />
          <Button onClick={() => downloadBlob(result.blob, "merged-image.png")} variant="gradient" size="lg" className="w-full">
            <Download className="w-4 h-4 mr-2" />Download PNG
          </Button>
        </motion.div>
      )}
    </div>
  );
}
