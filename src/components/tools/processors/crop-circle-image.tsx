"use client";
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Download, Loader2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { UploadZone } from "@/components/tools/upload-zone";
import { UploadedFile, Tool } from "@/types";
import { downloadBlob, formatFileSize, ACCEPTED_IMAGE_TYPES } from "@/lib/utils";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

export default function CropCircleImage({ tool }: { tool: Tool }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [imgUrl, setImgUrl] = useState("");
  const [zoom, setZoom] = useState(100); // percent of the max-fit circle
  const [offsetX, setOffsetX] = useState(50); // percent
  const [offsetY, setOffsetY] = useState(50);
  const [previewUrl, setPreviewUrl] = useState("");
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; name: string } | null>(null);

  const handleFilesChange = (f: UploadedFile[]) => {
    setFiles(f);
    setResult(null);
    setPreviewUrl("");
    setZoom(100);
    setOffsetX(50);
    setOffsetY(50);
    setImgUrl(f.length ? URL.createObjectURL(f[0].file) : "");
  };

  const renderCircle = useCallback(async (): Promise<Blob | null> => {
    if (!imgUrl) return null;
    const img = await loadImage(imgUrl);
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const maxRadius = Math.min(w, h) / 2;
    const radius = (maxRadius * zoom) / 100;
    const cx = (w * offsetX) / 100;
    const cy = (h * offsetY) / 100;

    const size = Math.round(radius * 2);
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, radius, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, cx - radius, cy - radius, radius * 2, radius * 2, 0, 0, size, size);
    return new Promise((res) => canvas.toBlob((b) => res(b), "image/png"));
  }, [imgUrl, zoom, offsetX, offsetY]);

  useEffect(() => {
    let cancelled = false;
    if (!imgUrl) return;
    renderCircle().then((blob) => {
      if (!cancelled && blob) setPreviewUrl(URL.createObjectURL(blob));
    }).catch(console.error);
    return () => { cancelled = true; };
  }, [imgUrl, renderCircle]);

  const handleDownload = async () => {
    if (!files.length) return;
    setProcessing(true);
    try {
      const blob = await renderCircle();
      if (blob) {
        setResult({ blob, name: files[0].name.replace(/\.[^.]+$/, "") + "-circle.png" });
        downloadBlob(blob, files[0].name.replace(/\.[^.]+$/, "") + "-circle.png");
      }
    } catch (e) {
      console.error(e);
    }
    setProcessing(false);
  };

  return (
    <div className="space-y-6">
      <UploadZone accept={ACCEPTED_IMAGE_TYPES} multiple={false} onFilesChange={handleFilesChange} title="Upload image for circle crop" description="Perfect for profile pictures and avatars" />

      {imgUrl && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
            <div className="flex justify-center">
              {previewUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="Circle preview" className="w-48 h-48 rounded-full border-4 border-border object-cover" />
              )}
            </div>
            <div className="space-y-2">
              <Label>Size: {zoom}%</Label>
              <Slider value={[zoom]} onValueChange={(v) => setZoom(v[0])} min={20} max={100} step={1} />
            </div>
            <div className="space-y-2">
              <Label>Horizontal position</Label>
              <Slider value={[offsetX]} onValueChange={(v) => setOffsetX(v[0])} min={0} max={100} step={1} />
            </div>
            <div className="space-y-2">
              <Label>Vertical position</Label>
              <Slider value={[offsetY]} onValueChange={(v) => setOffsetY(v[0])} min={0} max={100} step={1} />
            </div>
          </div>
          <Button onClick={handleDownload} disabled={processing} size="lg" className="w-full" variant="gradient">
            {processing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Exporting...</> : <><Circle className="w-4 h-4 mr-2" />Download Circle PNG</>}
          </Button>
          {result && (
            <p className="text-sm text-green-600 dark:text-green-400 text-center">Downloaded! ({formatFileSize(result.blob.size)})</p>
          )}
        </motion.div>
      )}
    </div>
  );
}
