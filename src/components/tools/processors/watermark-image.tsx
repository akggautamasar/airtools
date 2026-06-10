"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Loader2, Stamp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadZone } from "@/components/tools/upload-zone";
import { UploadedFile, Tool } from "@/types";
import { downloadBlob, ACCEPTED_IMAGE_TYPES } from "@/lib/utils";
import JSZip from "jszip";

const POSITIONS = [
  { id: "center", label: "Center" },
  { id: "bottom-right", label: "Bottom Right" },
  { id: "bottom-left", label: "Bottom Left" },
  { id: "top-right", label: "Top Right" },
  { id: "top-left", label: "Top Left" },
  { id: "tile", label: "Tiled" },
];

export default function WatermarkImage({ tool }: { tool: Tool }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [text, setText] = useState("© AirTools");
  const [position, setPosition] = useState("bottom-right");
  const [opacity, setOpacity] = useState(50);
  const [color, setColor] = useState("#ffffff");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ blob: Blob; name: string } | null>(null);

  const handleApply = async () => {
    if (!files.length || !text.trim()) return;
    setProcessing(true);
    setResult(null);
    setError("");
    try {
      const outputs = await Promise.all(
        files.map(async (f) => {
          const bitmap = await createImageBitmap(f.file);
          const canvas = document.createElement("canvas");
          canvas.width = bitmap.width;
          canvas.height = bitmap.height;
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(bitmap, 0, 0);
          bitmap.close();

          const fontSize = Math.max(16, Math.round(canvas.width / 22));
          ctx.font = `bold ${fontSize}px sans-serif`;
          ctx.fillStyle = color;
          ctx.globalAlpha = opacity / 100;
          ctx.shadowColor = "rgba(0,0,0,0.4)";
          ctx.shadowBlur = 4;
          const pad = fontSize;
          const tw = ctx.measureText(text).width;

          if (position === "tile") {
            ctx.save();
            ctx.rotate(-Math.PI / 6);
            const stepX = tw + fontSize * 4;
            const stepY = fontSize * 6;
            for (let y = -canvas.width; y < canvas.height + canvas.width; y += stepY) {
              for (let x = -canvas.height; x < canvas.width + canvas.height; x += stepX) {
                ctx.fillText(text, x, y);
              }
            }
            ctx.restore();
          } else {
            let x = (canvas.width - tw) / 2;
            let y = canvas.height / 2;
            if (position.includes("left")) x = pad;
            if (position.includes("right")) x = canvas.width - tw - pad;
            if (position.includes("top")) y = pad + fontSize;
            if (position.includes("bottom")) y = canvas.height - pad;
            ctx.fillText(text, x, y);
          }
          ctx.globalAlpha = 1;

          const blob = await new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error())), "image/png"));
          return { blob, name: f.name.replace(/\.[^.]+$/, "") + "-watermarked.png" };
        })
      );

      if (outputs.length === 1) {
        setResult(outputs[0]);
      } else {
        const zip = new JSZip();
        outputs.forEach((o) => zip.file(o.name, o.blob));
        setResult({ blob: await zip.generateAsync({ type: "blob" }), name: "watermarked-images.zip" });
      }
    } catch (e) {
      console.error(e);
      setError("Failed to apply watermark.");
    }
    setProcessing(false);
  };

  return (
    <div className="space-y-6">
      <UploadZone accept={ACCEPTED_IMAGE_TYPES} multiple onFilesChange={(f) => { setFiles(f); setResult(null); }} title="Upload images to watermark" description="Add a text watermark to protect your photos" />

      {files.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <div className="space-y-1">
              <Label>Watermark text</Label>
              <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="© Your Name" />
            </div>
            <div className="space-y-2">
              <Label>Position</Label>
              <div className="flex flex-wrap gap-2">
                {POSITIONS.map((p) => (
                  <button key={p.id} onClick={() => setPosition(p.id)} className={`px-3 py-1.5 rounded-lg border-2 text-sm font-medium transition-all ${position === p.id ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Opacity: {opacity}%</Label>
                <input type="range" min={10} max={100} value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} className="w-full" />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-10 rounded-lg border border-border cursor-pointer bg-transparent" />
              </div>
            </div>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button onClick={handleApply} disabled={processing || !text.trim()} size="lg" className="w-full" variant="gradient">
            {processing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Applying...</> : <><Stamp className="w-4 h-4 mr-2" />Watermark {files.length} Image{files.length > 1 ? "s" : ""}</>}
          </Button>
        </motion.div>
      )}

      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-2xl p-6">
          <p className="font-semibold text-green-700 dark:text-green-400 mb-3">Watermark Applied!</p>
          <Button onClick={() => downloadBlob(result.blob, result.name)} variant="gradient" size="lg" className="w-full">
            <Download className="w-4 h-4 mr-2" />Download
          </Button>
        </motion.div>
      )}
    </div>
  );
}
