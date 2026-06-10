"use client";
import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Download, Loader2, Crop } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { UploadZone } from "@/components/tools/upload-zone";
import { UploadedFile, Tool } from "@/types";
import { downloadBlob, formatFileSize, ACCEPTED_IMAGE_TYPES } from "@/lib/utils";

interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const RATIOS = [
  { id: "free", label: "Free", ratio: 0 },
  { id: "1:1", label: "1:1", ratio: 1 },
  { id: "4:3", label: "4:3", ratio: 4 / 3 },
  { id: "16:9", label: "16:9", ratio: 16 / 9 },
  { id: "3:4", label: "3:4 (Portrait)", ratio: 3 / 4 },
  { id: "9:16", label: "9:16 (Story)", ratio: 9 / 16 },
];

export default function CropImage({ tool }: { tool: Tool }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [imgSize, setImgSize] = useState({ width: 0, height: 0 });
  const [imgUrl, setImgUrl] = useState("");
  const [crop, setCrop] = useState<CropRect | null>(null);
  const [ratioId, setRatioId] = useState("free");
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; name: string } | null>(null);

  const handleFilesChange = (f: UploadedFile[]) => {
    setFiles(f);
    setResult(null);
    setCrop(null);
    setImgUrl("");
    if (!f.length) return;
    const url = URL.createObjectURL(f[0].file);
    const img = new window.Image();
    img.onload = () => {
      setImgSize({ width: img.naturalWidth, height: img.naturalHeight });
      setImgUrl(url);
    };
    img.src = url;
  };

  const getPos = useCallback((e: React.PointerEvent) => {
    const rect = containerRef.current!.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(imgSize.width, ((e.clientX - rect.left) / rect.width) * imgSize.width)),
      y: Math.max(0, Math.min(imgSize.height, ((e.clientY - rect.top) / rect.height) * imgSize.height)),
    };
  }, [imgSize]);

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    const pos = getPos(e);
    dragStart.current = pos;
    setCrop({ x: pos.x, y: pos.y, width: 0, height: 0 });
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging || !dragStart.current) return;
    const pos = getPos(e);
    const s = dragStart.current;
    let w = Math.abs(pos.x - s.x);
    let h = Math.abs(pos.y - s.y);
    const ratio = RATIOS.find((r) => r.id === ratioId)!.ratio;
    if (ratio > 0) {
      h = w / ratio;
      if ((pos.y < s.y ? s.y - h : s.y + h) < 0 || s.y + h > imgSize.height) {
        h = Math.min(h, pos.y < s.y ? s.y : imgSize.height - s.y);
        w = h * ratio;
      }
    }
    setCrop({
      x: pos.x < s.x ? s.x - w : s.x,
      y: pos.y < s.y ? s.y - h : s.y,
      width: w,
      height: h,
    });
  };

  const onPointerUp = () => {
    setDragging(false);
    dragStart.current = null;
    setCrop((c) => (c && (c.width < 10 || c.height < 10) ? null : c));
  };

  const handleCrop = async () => {
    if (!files.length || !crop || !imgUrl) return;
    setProcessing(true);
    try {
      const img = new window.Image();
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = imgUrl; });
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(crop.width);
      canvas.height = Math.round(crop.height);
      canvas.getContext("2d")!.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error())), "image/png"));
      setResult({ blob, name: files[0].name.replace(/\.[^.]+$/, "") + "-cropped.png" });
    } catch (e) {
      console.error(e);
    }
    setProcessing(false);
  };

  return (
    <div className="space-y-6">
      <UploadZone accept={ACCEPTED_IMAGE_TYPES} multiple={false} onFilesChange={handleFilesChange} title="Upload image to crop" description="Drag on the image to select the crop area" />

      {imgUrl && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <div className="space-y-2">
              <Label>Aspect Ratio</Label>
              <div className="flex flex-wrap gap-2">
                {RATIOS.map((r) => (
                  <button key={r.id} onClick={() => { setRatioId(r.id); setCrop(null); }} className={`px-3 py-1.5 rounded-lg border-2 text-sm font-medium transition-all ${ratioId === r.id ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
            <div
              ref={containerRef}
              className="relative mx-auto cursor-crosshair select-none touch-none rounded-lg overflow-hidden max-w-2xl"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imgUrl} alt="To crop" className="w-full h-auto block pointer-events-none" draggable={false} />
              {crop && (
                <div
                  className="absolute border-2 border-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] pointer-events-none"
                  style={{
                    left: `${(crop.x / imgSize.width) * 100}%`,
                    top: `${(crop.y / imgSize.height) * 100}%`,
                    width: `${(crop.width / imgSize.width) * 100}%`,
                    height: `${(crop.height / imgSize.height) * 100}%`,
                  }}
                />
              )}
            </div>
            {crop && (
              <p className="text-xs text-muted-foreground text-center">
                {Math.round(crop.width)} × {Math.round(crop.height)} px
              </p>
            )}
          </div>
          <Button onClick={handleCrop} disabled={processing || !crop} size="lg" className="w-full" variant="gradient">
            {processing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Cropping...</> : <><Crop className="w-4 h-4 mr-2" />Crop Image</>}
          </Button>
        </motion.div>
      )}

      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-2xl p-6">
          <p className="font-semibold text-green-700 dark:text-green-400 mb-3">Crop Complete! ({formatFileSize(result.blob.size)})</p>
          <Button onClick={() => downloadBlob(result.blob, result.name)} variant="gradient" size="lg" className="w-full">
            <Download className="w-4 h-4 mr-2" />Download PNG
          </Button>
        </motion.div>
      )}
    </div>
  );
}
