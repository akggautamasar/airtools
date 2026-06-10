"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Download, Loader2, Wand2, Palette, ImageIcon, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { UploadZone } from "@/components/tools/upload-zone";
import { UploadedFile, Tool } from "@/types";
import { downloadBlob, formatFileSize, ACCEPTED_IMAGE_TYPES } from "@/lib/utils";

type BgMode = "transparent" | "color" | "image";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

async function compositeImage(cutoutBlob: Blob, mode: BgMode, color: string, bgImageUrl: string | null): Promise<Blob> {
  const cutoutUrl = URL.createObjectURL(cutoutBlob);
  try {
    const cutout = await loadImage(cutoutUrl);
    const canvas = document.createElement("canvas");
    canvas.width = cutout.naturalWidth;
    canvas.height = cutout.naturalHeight;
    const ctx = canvas.getContext("2d")!;

    if (mode === "color") {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (mode === "image" && bgImageUrl) {
      const bg = await loadImage(bgImageUrl);
      const scale = Math.max(canvas.width / bg.naturalWidth, canvas.height / bg.naturalHeight);
      const w = bg.naturalWidth * scale;
      const h = bg.naturalHeight * scale;
      ctx.drawImage(bg, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
    }

    ctx.drawImage(cutout, 0, 0);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Export failed"))), "image/png");
    });
  } finally {
    URL.revokeObjectURL(cutoutUrl);
  }
}

export default function RemoveBackground({ tool }: { tool: Tool }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [cutoutBlob, setCutoutBlob] = useState<Blob | null>(null);
  const [cutoutUrl, setCutoutUrl] = useState("");

  const [bgMode, setBgMode] = useState<BgMode>("transparent");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [bgImageUrl, setBgImageUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const bgImageInputRef = useRef<HTMLInputElement>(null);

  const handleFilesChange = (f: UploadedFile[]) => {
    setFiles(f);
    setCutoutBlob(null);
    setCutoutUrl("");
    setPreviewUrl("");
    setError("");
    setBgMode("transparent");
    setBgImageUrl(null);
  };

  const handleRemove = async () => {
    if (!files.length) return;
    setProcessing(true);
    setError("");
    setCutoutBlob(null);
    setCutoutUrl("");
    setProgress("Loading model...");
    try {
      const { removeBackground } = await import("@imgly/background-removal");
      const blob = await removeBackground(files[0].file, {
        progress: (key, current, total) => {
          setProgress(`${key} (${Math.round((current / total) * 100)}%)`);
        },
      });
      setCutoutBlob(blob);
      setCutoutUrl(URL.createObjectURL(blob));
    } catch (e) {
      console.error(e);
      setError("Failed to remove background. Try a smaller or different image.");
    }
    setProcessing(false);
    setProgress("");
  };

  const handleBgImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setBgImageUrl(reader.result as string);
      setBgMode("image");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Recompute the composited preview whenever the result or background settings change.
  const updatePreview = useCallback(async () => {
    if (!cutoutBlob) return;
    if (bgMode === "transparent") {
      setPreviewUrl(cutoutUrl);
      return;
    }
    try {
      const composited = await compositeImage(cutoutBlob, bgMode, bgColor, bgImageUrl);
      setPreviewUrl(URL.createObjectURL(composited));
    } catch (e) {
      console.error(e);
    }
  }, [cutoutBlob, cutoutUrl, bgMode, bgColor, bgImageUrl]);

  useEffect(() => {
    updatePreview();
  }, [updatePreview]);

  const handleDownload = async () => {
    if (!cutoutBlob || !files.length) return;
    const baseName = files[0].name.replace(/\.[^.]+$/, "");
    if (bgMode === "transparent") {
      downloadBlob(cutoutBlob, `${baseName}-no-bg.png`);
      return;
    }
    const composited = await compositeImage(cutoutBlob, bgMode, bgColor, bgImageUrl);
    downloadBlob(composited, `${baseName}-new-bg.png`);
  };

  return (
    <div className="space-y-6">
      <UploadZone accept={ACCEPTED_IMAGE_TYPES} multiple={false} onFilesChange={handleFilesChange} title="Upload an image" description="Remove the background using on-device AI — no upload to any server" />

      {files.length > 0 && !cutoutBlob && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 text-xs text-blue-700 dark:text-blue-400">
            ℹ️ Background removal runs entirely in your browser. The first run downloads an AI model (a few MB) and may take a moment.
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button onClick={handleRemove} disabled={processing} size="lg" className="w-full" variant="gradient">
            {processing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />{progress || "Processing..."}</> : <><Wand2 className="w-4 h-4 mr-2" />Remove Background</>}
          </Button>
        </motion.div>
      )}

      {cutoutBlob && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div
            className="rounded-2xl border border-border overflow-hidden flex items-center justify-center p-4"
            style={{
              backgroundImage: bgMode === "transparent"
                ? "repeating-conic-gradient(#e5e7eb 0% 25%, #ffffff 0% 50%)"
                : undefined,
              backgroundSize: bgMode === "transparent" ? "20px 20px" : undefined,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {previewUrl && <img src={previewUrl} alt="Result" className="max-h-96 object-contain" />}
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <Label>Background</Label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setBgMode("transparent")}
                className={`p-2.5 rounded-xl border-2 text-sm font-medium flex flex-col items-center gap-1 transition-all ${bgMode === "transparent" ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
              >
                <EyeOff className="w-4 h-4" />Transparent
              </button>
              <button
                onClick={() => setBgMode("color")}
                className={`p-2.5 rounded-xl border-2 text-sm font-medium flex flex-col items-center gap-1 transition-all ${bgMode === "color" ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
              >
                <Palette className="w-4 h-4" />Solid Color
              </button>
              <button
                onClick={() => bgImageUrl ? setBgMode("image") : bgImageInputRef.current?.click()}
                className={`p-2.5 rounded-xl border-2 text-sm font-medium flex flex-col items-center gap-1 transition-all ${bgMode === "image" ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
              >
                <ImageIcon className="w-4 h-4" />Custom Image
              </button>
              <input ref={bgImageInputRef} type="file" accept="image/*" className="hidden" onChange={handleBgImageUpload} />
            </div>

            {bgMode === "color" && (
              <div className="flex items-center gap-3">
                <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-10 h-10 rounded-lg border border-border cursor-pointer bg-transparent" />
                <span className="text-sm text-muted-foreground">{bgColor}</span>
              </div>
            )}

            {bgMode === "image" && (
              <Button onClick={() => bgImageInputRef.current?.click()} variant="outline" size="sm" className="w-full">
                <ImageIcon className="w-4 h-4 mr-2" />{bgImageUrl ? "Change Background Image" : "Choose Background Image"}
              </Button>
            )}
          </div>

          <Button onClick={handleDownload} size="lg" className="w-full" variant="gradient">
            <Download className="w-4 h-4 mr-2" />Download {bgMode === "transparent" ? `(${formatFileSize(cutoutBlob.size)})` : "PNG"}
          </Button>
        </motion.div>
      )}
    </div>
  );
}
