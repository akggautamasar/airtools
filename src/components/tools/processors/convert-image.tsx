"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Loader2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UploadZone } from "@/components/tools/upload-zone";
import { UploadedFile, Tool } from "@/types";
import { downloadBlob, formatFileSize, ACCEPTED_IMAGE_TYPES } from "@/lib/utils";

const FORMAT_MAP: Record<string, string> = {
  "image-to-jpg": "image/jpeg",
  "image-to-jpeg": "image/jpeg",
  "image-to-png": "image/png",
  "image-to-webp": "image/webp",
  "image-to-bmp": "image/bmp",
};

const EXT_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/bmp": "bmp",
};

export default function ConvertImage({ tool }: { tool: Tool }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<{ name: string; blob: Blob }[]>([]);

  const targetFormat = FORMAT_MAP[tool.slug] || "image/jpeg";
  const targetExt = EXT_MAP[targetFormat] || "jpg";

  const handleConvert = async () => {
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
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0);
        const blob = await new Promise<Blob>((res, rej) => canvas.toBlob((b) => b ? res(b) : rej(), targetFormat, 0.92));
        const baseName = f.name.replace(/\.[^.]+$/, "");
        newResults.push({ name: `${baseName}.${targetExt}`, blob });
      } catch (e) { console.error(e); }
    }
    setResults(newResults);
    setProcessing(false);
  };

  return (
    <div className="space-y-6">
      <UploadZone accept={ACCEPTED_IMAGE_TYPES} multiple onFilesChange={setFiles} title={`Upload images to convert to ${targetExt.toUpperCase()}`} />
      {files.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="bg-card border border-border rounded-2xl p-4 mb-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Converting to {targetExt.toUpperCase()}</p>
              <p className="text-xs text-muted-foreground">{files.length} file{files.length > 1 ? "s" : ""} selected</p>
            </div>
          </div>
          <Button onClick={handleConvert} disabled={processing} size="lg" className="w-full" variant="gradient">
            {processing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Converting...</> : <><ImageIcon className="w-4 h-4 mr-2" />Convert to {targetExt.toUpperCase()}</>}
          </Button>
        </motion.div>
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
