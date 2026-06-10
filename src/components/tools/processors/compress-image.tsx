"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Loader2, ImageDown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { UploadZone } from "@/components/tools/upload-zone";
import { UploadedFile, Tool } from "@/types";
import { downloadBlob, formatFileSize, ACCEPTED_IMAGE_TYPES, mapWithConcurrency } from "@/lib/utils";

async function compressImageFile(file: File, quality: number): Promise<Blob> {
  // createImageBitmap decodes off the main thread — much faster than <img>.
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0);
  bitmap.close();
  const mimeType = file.type === "image/png" ? "image/png" : "image/jpeg";
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Compression failed"));
    }, mimeType, quality / 100);
  });
}

export default function CompressImage({ tool }: { tool: Tool }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [quality, setQuality] = useState(75);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<{ name: string; blob: Blob; originalSize: number; preview: string }[]>([]);

  const handleCompress = async () => {
    if (!files.length) return;
    setProcessing(true);
    setResults([]);
    const processed = await mapWithConcurrency(files, 4, async (f) => {
      const blob = await compressImageFile(f.file, quality);
      return { name: f.name, blob, originalSize: f.size, preview: URL.createObjectURL(blob) };
    });
    setResults(processed.filter((r): r is NonNullable<typeof r> => r !== null));
    setProcessing(false);
  };

  const avgReduction = results.length > 0
    ? Math.round((1 - results.reduce((a, r) => a + r.blob.size, 0) / results.reduce((a, r) => a + r.originalSize, 0)) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <UploadZone accept={ACCEPTED_IMAGE_TYPES} multiple onFilesChange={setFiles} title="Upload images to compress" description="JPG, PNG, WEBP, BMP supported" />

      {files.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h3 className="font-semibold">Compression Quality</h3>
            <div className="grid grid-cols-3 gap-3">
              {[{ label: "Low", val: 40 }, { label: "Medium", val: 75 }, { label: "High", val: 92 }].map((p) => (
                <button key={p.label} onClick={() => setQuality(p.val)} className={`p-3 rounded-xl border-2 transition-all ${quality === p.val ? "border-primary bg-primary/5" : "border-border"}`}>
                  <p className="font-semibold text-sm">{p.label}</p>
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <Label>Quality: {quality}%</Label>
              <Slider value={[quality]} onValueChange={([v]) => setQuality(v)} min={10} max={100} step={5} />
            </div>
          </div>
          <Button onClick={handleCompress} disabled={processing} size="lg" className="w-full" variant="gradient">
            {processing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Compressing...</> : <><ImageDown className="w-4 h-4 mr-2" />Compress {files.length} Image{files.length > 1 ? "s" : ""}</>}
          </Button>
        </motion.div>
      )}

      {results.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-2xl p-6 space-y-4">
          <div>
            <p className="font-semibold text-green-700 dark:text-green-400">Compression Complete!</p>
            {avgReduction > 0 && <p className="text-sm text-green-600 dark:text-green-500">Reduced by ~{avgReduction}%</p>}
          </div>
          {results.map((r, i) => (
            <div key={i} className="bg-white dark:bg-card rounded-xl p-3 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-4 mb-3">
                <img src={r.preview} alt={r.name} className="w-16 h-16 object-cover rounded-lg" />
                <div className="flex-1">
                  <p className="text-sm font-medium truncate">{r.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <span>{formatFileSize(r.originalSize)}</span>
                    <ArrowRight className="w-3 h-3" />
                    <span className="text-green-600 font-medium">{formatFileSize(r.blob.size)}</span>
                  </div>
                </div>
              </div>
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
