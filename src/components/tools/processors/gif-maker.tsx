"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Loader2, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { UploadZone } from "@/components/tools/upload-zone";
import { UploadedFile, Tool } from "@/types";
import { downloadBlob, formatFileSize, ACCEPTED_IMAGE_TYPES } from "@/lib/utils";

const MAX_DIMENSION = 800;

export default function GifMaker({ tool }: { tool: Tool }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [delay, setDelay] = useState(500);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ blob: Blob; preview: string } | null>(null);

  const handleCreate = async () => {
    if (files.length < 2) return;
    setProcessing(true);
    setResult(null);
    setError("");
    try {
      const { GIFEncoder, quantize, applyPalette } = await import("gifenc");

      // All frames share the first image's (possibly downscaled) dimensions.
      const first = await createImageBitmap(files[0].file);
      const scale = Math.min(1, MAX_DIMENSION / Math.max(first.width, first.height));
      const width = Math.round(first.width * scale);
      const height = Math.round(first.height * scale);
      first.close();

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!;

      const gif = GIFEncoder();
      for (let i = 0; i < files.length; i++) {
        setProgress(`Encoding frame ${i + 1} of ${files.length}...`);
        const bitmap = await createImageBitmap(files[i].file);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        // contain-fit each frame
        const s = Math.min(width / bitmap.width, height / bitmap.height);
        const w = bitmap.width * s;
        const h = bitmap.height * s;
        ctx.drawImage(bitmap, (width - w) / 2, (height - h) / 2, w, h);
        bitmap.close();

        const { data } = ctx.getImageData(0, 0, width, height);
        const palette = quantize(data, 256);
        const index = applyPalette(data, palette);
        gif.writeFrame(index, width, height, { palette, delay, repeat: 0, first: i === 0 });
        // Yield to keep the UI responsive on large batches.
        await new Promise((r) => setTimeout(r, 0));
      }
      gif.finish();

      const blob = new Blob([gif.bytes().slice().buffer as ArrayBuffer], { type: "image/gif" });
      setResult({ blob, preview: URL.createObjectURL(blob) });
    } catch (e) {
      console.error(e);
      setError("Failed to create GIF.");
    }
    setProcessing(false);
    setProgress("");
  };

  return (
    <div className="space-y-6">
      <UploadZone accept={ACCEPTED_IMAGE_TYPES} multiple onFilesChange={(f) => { setFiles(f); setResult(null); }} title="Upload images for your GIF" description="Frames play in the order you add them" />

      {files.length >= 2 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
            <Label>Frame delay: {delay}ms ({(1000 / delay).toFixed(1)} fps)</Label>
            <input type="range" min={50} max={2000} step={50} value={delay} onChange={(e) => setDelay(Number(e.target.value))} className="w-full" />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button onClick={handleCreate} disabled={processing} size="lg" className="w-full" variant="gradient">
            {processing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />{progress || "Creating GIF..."}</> : <><Film className="w-4 h-4 mr-2" />Create GIF ({files.length} frames)</>}
          </Button>
        </motion.div>
      )}

      {files.length === 1 && (
        <p className="text-sm text-muted-foreground text-center">Add at least one more image to animate.</p>
      )}

      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-2xl p-6 space-y-3">
          <p className="font-semibold text-green-700 dark:text-green-400">GIF Created! ({formatFileSize(result.blob.size)})</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={result.preview} alt="GIF preview" className="max-h-72 mx-auto rounded-xl border border-border" />
          <Button onClick={() => downloadBlob(result.blob, "animation.gif")} variant="gradient" size="lg" className="w-full">
            <Download className="w-4 h-4 mr-2" />Download GIF
          </Button>
        </motion.div>
      )}
    </div>
  );
}
