"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UploadZone } from "@/components/tools/upload-zone";
import { UploadedFile, Tool } from "@/types";
import { ACCEPTED_IMAGE_TYPES } from "@/lib/utils";

interface Color { hex: string; rgb: [number, number, number]; percentage: number; }

function extractColors(imageData: ImageData, numColors = 10): Color[] {
  const data = imageData.data;
  const colorMap: Record<string, number> = {};
  for (let i = 0; i < data.length; i += 16) {
    const r = Math.round(data[i] / 32) * 32;
    const g = Math.round(data[i + 1] / 32) * 32;
    const b = Math.round(data[i + 2] / 32) * 32;
    const key = `${r},${g},${b}`;
    colorMap[key] = (colorMap[key] || 0) + 1;
  }
  const total = Object.values(colorMap).reduce((a, b) => a + b, 0);
  return Object.entries(colorMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, numColors)
    .map(([key, count]) => {
      const [r, g, b] = key.split(",").map(Number) as [number, number, number];
      return {
        hex: "#" + r.toString(16).padStart(2,"0") + g.toString(16).padStart(2,"0") + b.toString(16).padStart(2,"0"),
        rgb: [r, g, b],
        percentage: Math.round((count / total) * 100),
      };
    });
}

export default function ColorExtractor({ tool }: { tool: Tool }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [processing, setProcessing] = useState(false);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const handleExtract = async () => {
    if (!files.length || !files[0].preview) return;
    setProcessing(true);
    try {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((res) => { img.onload = () => res(); img.src = files[0].preview!; });
      const canvas = document.createElement("canvas");
      const maxSize = 200;
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setColors(extractColors(imageData));
    } catch (e) { console.error(e); }
    setProcessing(false);
  };

  const copyColor = (value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedColor(value);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  return (
    <div className="space-y-6">
      <UploadZone accept={ACCEPTED_IMAGE_TYPES} multiple={false} onFilesChange={setFiles} title="Upload image to extract colors" />
      {files.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {files[0].preview && (
            <div className="rounded-2xl overflow-hidden border border-border">
              <img src={files[0].preview} alt={files[0].name} className="w-full max-h-64 object-contain bg-muted" />
            </div>
          )}
          <Button onClick={handleExtract} disabled={processing} size="lg" className="w-full" variant="gradient">
            {processing ? "Extracting..." : <><Palette className="w-4 h-4 mr-2" />Extract Colors</>}
          </Button>
        </motion.div>
      )}
      {colors.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <h3 className="font-semibold">Extracted Palette ({colors.length} colors)</h3>
          <div className="flex h-12 rounded-xl overflow-hidden border border-border">
            {colors.map((c) => (
              <div key={c.hex} style={{ backgroundColor: c.hex, width: `${Math.max(c.percentage, 3)}%` }} title={c.hex} />
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {colors.map((c) => (
              <div key={c.hex} className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="h-16 w-full" style={{ backgroundColor: c.hex }} />
                <div className="p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-mono font-bold">{c.hex}</span>
                    <button onClick={() => copyColor(c.hex)} className="text-muted-foreground hover:text-foreground transition-colors">
                      {copiedColor === c.hex ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">RGB({c.rgb.join(", ")})</p>
                  <p className="text-xs text-muted-foreground">{c.percentage}% of image</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
