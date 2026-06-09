"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Loader2, Maximize2, Lock, Unlock, HardDrive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadZone } from "@/components/tools/upload-zone";
import { UploadedFile, Tool } from "@/types";
import { downloadBlob, formatFileSize, ACCEPTED_IMAGE_TYPES } from "@/lib/utils";

type ResizeMode = "pixels" | "percent" | "filesize";

// Load image from a File/Blob as an HTMLImageElement
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

// Draw image to canvas at given dimensions and get blob at quality
function canvasToBlob(img: HTMLImageElement, w: number, h: number, quality: number, mime: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, w, h);
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Canvas toBlob failed"))),
      mime,
      quality
    );
  });
}

// Binary search on quality to reach target file size in bytes
async function resizeToTargetSize(
  img: HTMLImageElement,
  targetBytes: number,
  mime: string
): Promise<Blob> {
  const originalW = img.naturalWidth;
  const originalH = img.naturalHeight;

  // Phase 1: try quality reduction at full resolution
  let lo = 0.05, hi = 0.95;
  let best: Blob | null = null;

  for (let i = 0; i < 12; i++) {
    const mid = (lo + hi) / 2;
    const blob = await canvasToBlob(img, originalW, originalH, mid, mime);
    if (blob.size <= targetBytes) {
      best = blob;
      lo = mid;
    } else {
      hi = mid;
    }
  }

  if (best && best.size <= targetBytes) return best;

  // Phase 2: quality at 0.1 still too large — scale dimensions down too
  let scale = 0.9;
  while (scale > 0.05) {
    const w = Math.max(1, Math.round(originalW * scale));
    const h = Math.max(1, Math.round(originalH * scale));
    const blob = await canvasToBlob(img, w, h, 0.1, mime);
    if (blob.size <= targetBytes) return blob;
    scale -= 0.05;
  }

  // Fallback: smallest possible
  return canvasToBlob(img, Math.max(1, Math.round(originalW * 0.05)), Math.max(1, Math.round(originalH * 0.05)), 0.1, mime);
}

export default function ResizeImage({ tool }: { tool: Tool }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [lockAspect, setLockAspect] = useState(true);
  const [originalAspect, setOriginalAspect] = useState(4 / 3);
  const [mode, setMode] = useState<ResizeMode>("pixels");
  const [percent, setPercent] = useState(50);
  const [targetKB, setTargetKB] = useState(200);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<{
    name: string;
    blob: Blob;
    originalSize: number;
    newW?: number;
    newH?: number;
  }[]>([]);

  const handleFilesChange = (f: UploadedFile[]) => {
    setFiles(f);
    setResults([]);
    if (f.length > 0 && f[0].preview) {
      const img = new Image();
      img.onload = () => {
        setWidth(img.naturalWidth);
        setHeight(img.naturalHeight);
        setOriginalAspect(img.naturalWidth / img.naturalHeight);
        // Suggest a sensible default target KB (half original size)
        setTargetKB(Math.max(50, Math.round(f[0].size / 1024 / 2)));
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

  const getMimeType = (file: File) =>
    file.type === "image/png" ? "image/png" : "image/jpeg";

  const getOutputName = (originalName: string, file: File) => {
    const ext = file.type === "image/png" ? "png" : "jpg";
    return originalName.replace(/\.[^.]+$/, `.${ext}`);
  };

  const handleResize = async () => {
    if (!files.length) return;
    setProcessing(true);
    setResults([]);
    const newResults = [];

    for (const f of files) {
      try {
        const url = URL.createObjectURL(f.file);
        const img = await loadImage(url);
        URL.revokeObjectURL(url);
        const mime = getMimeType(f.file);

        if (mode === "filesize") {
          const blob = await resizeToTargetSize(img, targetKB * 1024, mime);
          newResults.push({
            name: getOutputName(f.name, f.file),
            blob,
            originalSize: f.size,
          });
        } else {
          const targetW =
            mode === "pixels" ? width : Math.round(img.naturalWidth * percent / 100);
          const targetH =
            mode === "pixels" ? height : Math.round(img.naturalHeight * percent / 100);
          const blob = await canvasToBlob(img, targetW, targetH, 0.92, mime);
          newResults.push({
            name: getOutputName(f.name, f.file),
            blob,
            originalSize: f.size,
            newW: targetW,
            newH: targetH,
          });
        }
      } catch (e) {
        console.error("Resize error:", e);
      }
    }

    setResults(newResults);
    setProcessing(false);
  };

  const modes: { id: ResizeMode; label: string; icon: React.ElementType }[] = [
    { id: "pixels", label: "By Pixels", icon: Maximize2 },
    { id: "percent", label: "By %", icon: Maximize2 },
    { id: "filesize", label: "By KB", icon: HardDrive },
  ];

  return (
    <div className="space-y-6">
      <UploadZone
        accept={ACCEPTED_IMAGE_TYPES}
        multiple
        onFilesChange={handleFilesChange}
        title="Upload images to resize"
        description="JPG, PNG, WEBP supported"
      />

      {files.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
            {/* Mode tabs */}
            <div className="grid grid-cols-3 gap-2">
              {modes.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setMode(id)}
                  className={`p-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                    mode === id ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Pixels mode */}
            {mode === "pixels" && (
              <div className="space-y-3">
                <div className="flex items-end gap-3">
                  <div className="flex-1 space-y-1">
                    <Label>Width (px)</Label>
                    <Input
                      type="number"
                      min={1}
                      value={width}
                      onChange={(e) => handleWidthChange(Number(e.target.value))}
                    />
                  </div>
                  <button
                    onClick={() => setLockAspect(!lockAspect)}
                    className="mb-0.5 p-2 rounded-lg border border-border hover:bg-muted transition-colors"
                    title={lockAspect ? "Unlock aspect ratio" : "Lock aspect ratio"}
                  >
                    {lockAspect
                      ? <Lock className="w-4 h-4 text-primary" />
                      : <Unlock className="w-4 h-4 text-muted-foreground" />}
                  </button>
                  <div className="flex-1 space-y-1">
                    <Label>Height (px)</Label>
                    <Input
                      type="number"
                      min={1}
                      value={height}
                      onChange={(e) => handleHeightChange(Number(e.target.value))}
                    />
                  </div>
                </div>
                {lockAspect && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Aspect ratio locked
                  </p>
                )}
              </div>
            )}

            {/* Percent mode */}
            {mode === "percent" && (
              <div className="space-y-3">
                <Label>Scale: {percent}%</Label>
                <input
                  type="range"
                  min={1}
                  max={200}
                  value={percent}
                  onChange={(e) => setPercent(Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1% (tiny)</span>
                  <span>100% (original)</span>
                  <span>200% (double)</span>
                </div>
                {files[0] && (
                  <div className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2">
                    Output: ~{Math.round(width * percent / 100)} × {Math.round(height * percent / 100)} px
                  </div>
                )}
              </div>
            )}

            {/* File size mode */}
            {mode === "filesize" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Target File Size</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min={10}
                      max={10240}
                      value={targetKB}
                      onChange={(e) => setTargetKB(Math.max(10, Number(e.target.value)))}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium text-muted-foreground w-8">KB</span>
                  </div>
                </div>
                {/* Quick presets */}
                <div className="flex flex-wrap gap-2">
                  {[50, 100, 200, 500, 1024].map((kb) => (
                    <button
                      key={kb}
                      onClick={() => setTargetKB(kb)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        targetKB === kb
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      {kb >= 1024 ? `${kb / 1024} MB` : `${kb} KB`}
                    </button>
                  ))}
                </div>
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 text-xs text-blue-700 dark:text-blue-400">
                  ℹ️ AirTools will automatically adjust quality and dimensions to hit your target size. Quality is reduced first, then dimensions are scaled if needed.
                </div>
                {files.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Original: {formatFileSize(files.reduce((a, f) => a + f.size, 0))} total
                    {" · "}Target: {formatFileSize(targetKB * 1024)} per file
                  </p>
                )}
              </div>
            )}
          </div>

          <Button
            onClick={handleResize}
            disabled={processing}
            size="lg"
            className="w-full"
            variant="gradient"
          >
            {processing ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" />
                {mode === "filesize" ? "Optimizing to target size..." : "Resizing..."}</>
            ) : (
              <><Maximize2 className="w-4 h-4 mr-2" />
                {mode === "filesize"
                  ? `Resize to ${targetKB} KB`
                  : `Resize ${files.length} Image${files.length > 1 ? "s" : ""}`}</>
            )}
          </Button>
        </motion.div>
      )}

      {results.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-2xl p-6 space-y-3"
        >
          <p className="font-semibold text-green-700 dark:text-green-400">Resize Complete!</p>
          {results.map((r, i) => {
            const saved = r.originalSize - r.blob.size;
            const savedPct = Math.round((saved / r.originalSize) * 100);
            return (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-white dark:bg-card rounded-xl border border-green-200 dark:border-green-800"
              >
                <div>
                  <p className="text-sm font-medium truncate max-w-[200px]">{r.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(r.originalSize)} → <span className="text-green-600 dark:text-green-400 font-medium">{formatFileSize(r.blob.size)}</span>
                    {saved > 0 && <span className="ml-1 text-green-600 dark:text-green-400">(-{savedPct}%)</span>}
                    {r.newW && r.newH && <span className="ml-1">· {r.newW}×{r.newH}px</span>}
                  </p>
                </div>
                <Button size="sm" onClick={() => downloadBlob(r.blob, r.name)}>
                  <Download className="w-4 h-4 mr-1" />Download
                </Button>
              </div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
