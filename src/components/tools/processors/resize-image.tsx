"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Loader2, Maximize2, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadZone } from "@/components/tools/upload-zone";
import { UploadedFile, Tool } from "@/types";
import { downloadBlob, formatFileSize, ACCEPTED_IMAGE_TYPES } from "@/lib/utils";

export default function ResizeImage({ tool }: { tool: Tool }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [lockAspect, setLockAspect] = useState(true);
  const [originalAspect, setOriginalAspect] = useState(1);
  const [mode, setMode] = useState<"pixels" | "percent">("pixels");
  const [percent, setPercent] = useState(50);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<{ name: string; blob: Blob; size: number }[]>([]);

  const handleFilesChange = (f: UploadedFile[]) => {
    setFiles(f);
    setResults([]);
    if (f.length > 0 && f[0].preview) {
      const img = new window.Image();
      img.onload = () => {
        setWidth(img.naturalWidth);
        setHeight(img.naturalHeight);
        setOriginalAspect(img.naturalWidth / img.naturalHeight);
      };
      img.src = f[0].preview;
    }
  };

  const handleWidthChange = (v: number) => {
    setWidth(v);
    if (lockAspect) setHeight(Math.round(v / originalAspect));
  };

  const handleHeightChange = (v: number) => {
    setHeight(v);
    if (lockAspect) setWidth(Math.round(v * originalAspect));
  };

  const handleResize = async () => {
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
        const targetW = mode === "pixels" ? width : Math.round(img.naturalWidth * percent / 100);
        const targetH = mode === "pixels" ? height : Math.round(img.naturalHeight * percent / 100);
        const canvas = document.createElement("canvas");
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, targetW, targetH);
        const blob = await new Promise<Blob>((res, rej) => canvas.toBlob((b) => b ? res(b) : rej(), "image/jpeg", 0.92));
        newResults.push({ name: f.name, blob, size: blob.size });
      } catch (e) { console.error(e); }
    }
    setResults(newResults);
    setProcessing(false);
  };

  return (
    <div className="space-y-6">
      <UploadZone accept={ACCEPTED_IMAGE_TYPES} multiple onFilesChange={handleFilesChange} title="Upload images to resize" />
      {files.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <div className="flex gap-3">
              {["pixels", "percent"].map((m) => (
                <button key={m} onClick={() => setMode(m as "pixels" | "percent")} className={`flex-1 p-2 rounded-xl border-2 text-sm font-medium transition-all ${mode === m ? "border-primary bg-primary/5" : "border-border"}`}>
                  {m === "pixels" ? "By Pixels" : "By Percentage"}
                </button>
              ))}
            </div>
            {mode === "pixels" ? (
              <div className="flex items-end gap-3">
                <div className="flex-1 space-y-1">
                  <Label>Width (px)</Label>
                  <Input type="number" value={width} onChange={(e) => handleWidthChange(Number(e.target.value))} />
                </div>
                <button onClick={() => setLockAspect(!lockAspect)} className="mb-0.5 p-2 rounded-lg border border-border hover:bg-muted transition-colors">
                  {lockAspect ? <Lock className="w-4 h-4 text-primary" /> : <Unlock className="w-4 h-4 text-muted-foreground" />}
                </button>
                <div className="flex-1 space-y-1">
                  <Label>Height (px)</Label>
                  <Input type="number" value={height} onChange={(e) => handleHeightChange(Number(e.target.value))} />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Scale: {percent}%</Label>
                <input type="range" min={1} max={200} value={percent} onChange={(e) => setPercent(Number(e.target.value))} className="w-full" />
              </div>
            )}
          </div>
          <Button onClick={handleResize} disabled={processing} size="lg" className="w-full" variant="gradient">
            {processing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Resizing...</> : <><Maximize2 className="w-4 h-4 mr-2" />Resize {files.length} Image{files.length > 1 ? "s" : ""}</>}
          </Button>
        </motion.div>
      )}
      {results.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-2xl p-6 space-y-3">
          <p className="font-semibold text-green-700 dark:text-green-400">Resize Complete!</p>
          {results.map((r, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-white dark:bg-card rounded-xl border border-green-200 dark:border-green-800">
              <div>
                <p className="text-sm font-medium truncate max-w-xs">{r.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(r.size)}</p>
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
