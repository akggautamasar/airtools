"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Loader2, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadZone } from "@/components/tools/upload-zone";
import { UploadedFile, Tool } from "@/types";
import { downloadBlob, formatFileSize, ACCEPTED_IMAGE_TYPES } from "@/lib/utils";

const PRESETS = [
  { label: "Passport Photo (35×45mm @300dpi)", w: 413, h: 531, kb: 100 },
  { label: "Exam Photo (200×230px, ≤50KB)", w: 200, h: 230, kb: 50 },
  { label: "Exam Signature (140×60px, ≤20KB)", w: 140, h: 60, kb: 20 },
  { label: "Visa Photo (600×600px)", w: 600, h: 600, kb: 240 },
];

export default function PhotoSignatureResize({ tool }: { tool: Tool }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [width, setWidth] = useState(200);
  const [height, setHeight] = useState(230);
  const [maxKb, setMaxKb] = useState(50);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ blob: Blob; name: string; preview: string } | null>(null);

  const handleResize = async () => {
    if (!files.length) return;
    setProcessing(true);
    setResult(null);
    setError("");
    try {
      const f = files[0];
      const url = URL.createObjectURL(f.file);
      const img = new window.Image();
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
      URL.revokeObjectURL(url);

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      // Cover-fit: fill the target box, cropping overflow from the center.
      const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight);
      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale;
      ctx.drawImage(img, (width - w) / 2, (height - h) / 2, w, h);

      // Walk JPEG quality down until the file fits the size limit.
      let blob: Blob | null = null;
      for (let q = 0.92; q >= 0.1; q -= 0.07) {
        blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", q));
        if (blob && blob.size <= maxKb * 1024) break;
      }
      if (!blob) throw new Error("Export failed");
      if (blob.size > maxKb * 1024) {
        setError(`Couldn't reach ${maxKb}KB — got ${formatFileSize(blob.size)}. Try a larger size limit.`);
      }
      setResult({
        blob,
        name: f.name.replace(/\.[^.]+$/, "") + `-${width}x${height}.jpg`,
        preview: URL.createObjectURL(blob),
      });
    } catch (e) {
      console.error(e);
      setError("Failed to resize this image.");
    }
    setProcessing(false);
  };

  return (
    <div className="space-y-6">
      <UploadZone accept={ACCEPTED_IMAGE_TYPES} multiple={false} onFilesChange={(f) => { setFiles(f); setResult(null); setError(""); }} title="Upload photo or signature" description="Resize to exact dimensions and file size for official forms" />

      {files.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <div className="space-y-2">
              <Label>Common Presets</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PRESETS.map((p) => (
                  <button key={p.label} onClick={() => { setWidth(p.w); setHeight(p.h); setMaxKb(p.kb); }} className={`p-2.5 rounded-xl border-2 text-xs font-medium text-left transition-all ${width === p.w && height === p.h && maxKb === p.kb ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Width (px)</Label>
                <Input type="number" min={10} value={width} onChange={(e) => setWidth(Number(e.target.value))} />
              </div>
              <div className="space-y-1">
                <Label>Height (px)</Label>
                <Input type="number" min={10} value={height} onChange={(e) => setHeight(Number(e.target.value))} />
              </div>
              <div className="space-y-1">
                <Label>Max size (KB)</Label>
                <Input type="number" min={5} value={maxKb} onChange={(e) => setMaxKb(Number(e.target.value))} />
              </div>
            </div>
          </div>
          {error && <p className="text-sm text-amber-600 dark:text-amber-400">{error}</p>}
          <Button onClick={handleResize} disabled={processing} size="lg" className="w-full" variant="gradient">
            {processing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Resizing...</> : <><PenLine className="w-4 h-4 mr-2" />Resize to {width}×{height}px (≤{maxKb}KB)</>}
          </Button>
        </motion.div>
      )}

      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-2xl p-6 space-y-3">
          <p className="font-semibold text-green-700 dark:text-green-400">Done! {width}×{height}px, {formatFileSize(result.blob.size)}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={result.preview} alt="Resized result" className="mx-auto rounded-lg border border-border" style={{ maxHeight: 200 }} />
          <Button onClick={() => downloadBlob(result.blob, result.name)} variant="gradient" size="lg" className="w-full">
            <Download className="w-4 h-4 mr-2" />Download JPG
          </Button>
        </motion.div>
      )}
    </div>
  );
}
