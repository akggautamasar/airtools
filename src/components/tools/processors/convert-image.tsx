"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Loader2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UploadZone } from "@/components/tools/upload-zone";
import { UploadedFile, Tool } from "@/types";
import { downloadBlob, formatFileSize, ACCEPTED_IMAGE_TYPES, mapWithConcurrency } from "@/lib/utils";

const FORMAT_MAP: Record<string, string> = {
  "image-to-jpg": "image/jpeg",
  "image-to-jpeg": "image/jpeg",
  "image-to-png": "image/png",
  "image-to-webp": "image/webp",
  "image-to-bmp": "image/png",
};

const EXT_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const DISPLAY_EXT_MAP: Record<string, string> = {
  "image-to-bmp": "png",
};

function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Conversion failed"))),
      mime,
      quality
    );
  });
}

export default function ConvertImage({ tool }: { tool: Tool }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<{ name: string; blob: Blob }[]>([]);
  const [bmpNotice, setBmpNotice] = useState(false);

  const targetFormat = FORMAT_MAP[tool.slug] || "image/jpeg";
  const targetExt = DISPLAY_EXT_MAP[tool.slug] || EXT_MAP[targetFormat] || "jpg";
  const isBmpTool = tool.slug === "image-to-bmp";

  const handleConvert = async () => {
    if (!files.length) return;
    setProcessing(true);
    setResults([]);
    setBmpNotice(false);
    const processed = await mapWithConcurrency(files, 4, async (f) => {
      const bitmap = await createImageBitmap(f.file);
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      canvas.getContext("2d")!.drawImage(bitmap, 0, 0);
      bitmap.close();
      const blob = await canvasToBlob(canvas, targetFormat, 0.92);
      const baseName = f.name.replace(/\.[^.]+$/, "");
      return { name: `${baseName}.${targetExt}`, blob };
    });
    const newResults = processed.filter((r): r is NonNullable<typeof r> => r !== null);
    if (isBmpTool && newResults.length > 0) setBmpNotice(true);
    setResults(newResults);
    setProcessing(false);
  };

  return (
    <div className="space-y-6">
      <UploadZone accept={ACCEPTED_IMAGE_TYPES} multiple onFilesChange={setFiles} title={`Upload images to convert to ${isBmpTool ? "BMP" : targetExt.toUpperCase()}`} />
      {isBmpTool && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-xs text-amber-700 dark:text-amber-400">
          ⚠️ Browsers do not support native BMP encoding. Your images will be saved as lossless PNG, which is visually identical to BMP.
        </div>
      )}
      {files.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="bg-card border border-border rounded-2xl p-4 mb-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Converting to {isBmpTool ? "PNG (BMP-compatible)" : targetExt.toUpperCase()}</p>
              <p className="text-xs text-muted-foreground">{files.length} file{files.length > 1 ? "s" : ""} selected</p>
            </div>
          </div>
          <Button onClick={handleConvert} disabled={processing} size="lg" className="w-full" variant="gradient">
            {processing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Converting...</> : <><ImageIcon className="w-4 h-4 mr-2" />Convert to {isBmpTool ? "BMP/PNG" : targetExt.toUpperCase()}</>}
          </Button>
        </motion.div>
      )}
      {bmpNotice && (
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 text-xs text-blue-700 dark:text-blue-400">
          ℹ️ Files saved as PNG (lossless, same quality as BMP). Rename to .bmp if needed.
        </div>
      )}
      {results.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-2xl p-6 space-y-3">
          <p className="font-semibold text-green-700 dark:text-green-400">Conversion Complete!</p>
          {results.map((r, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-white dark:bg-card rounded-xl border border-green-200 dark:border-green-800">
              <div>
                <p className="text-sm font-medium truncate max-w-xs">{r.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(r.blob.size)}</p>
              </div>
              <Button size="sm" onClick={() => downloadBlob(r.blob, r.name)}>
                <Download className="w-4 h-4 mr-1" />Download
              </Button>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
