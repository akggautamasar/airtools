"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Loader2, Images } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UploadZone } from "@/components/tools/upload-zone";
import { UploadedFile, Tool } from "@/types";
import { downloadBlob, formatFileSize, ACCEPTED_PDF_TYPES } from "@/lib/utils";
import { loadPdfJs, canvasToBlob } from "@/lib/pdf-client";
import JSZip from "jszip";

interface DecodedImage {
  width: number;
  height: number;
  data?: Uint8ClampedArray | Uint8Array;
  kind?: number;
  bitmap?: ImageBitmap;
}

async function decodedImageToBlob(img: DecodedImage): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d")!;

  if (img.bitmap) {
    ctx.drawImage(img.bitmap, 0, 0);
  } else if (img.data) {
    const { width, height, data, kind } = img;
    const rgba = new Uint8ClampedArray(width * height * 4);
    if (kind === 3) {
      rgba.set(data);
    } else if (kind === 2) {
      for (let i = 0, j = 0; i < data.length; i += 3, j += 4) {
        rgba[j] = data[i];
        rgba[j + 1] = data[i + 1];
        rgba[j + 2] = data[i + 2];
        rgba[j + 3] = 255;
      }
    } else if (kind === 1) {
      // 1 bit per pixel grayscale, packed rows.
      const rowBytes = Math.ceil(width / 8);
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const bit = (data[y * rowBytes + (x >> 3)] >> (7 - (x & 7))) & 1;
          const v = bit ? 255 : 0;
          const j = (y * width + x) * 4;
          rgba[j] = rgba[j + 1] = rgba[j + 2] = v;
          rgba[j + 3] = 255;
        }
      }
    } else {
      return null;
    }
    ctx.putImageData(new ImageData(rgba, width, height), 0, 0);
  } else {
    return null;
  }

  return canvasToBlob(canvas, "image/png");
}

export default function ExtractImagesPDF({ tool }: { tool: Tool }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ blob: Blob; name: string; count: number } | null>(null);

  const handleExtract = async () => {
    if (!files.length) return;
    setProcessing(true);
    setResult(null);
    setError("");
    try {
      const pdfjsLib = await loadPdfJs();
      const f = files[0];
      const bytes = await f.file.arrayBuffer();
      const task = pdfjsLib.getDocument({ data: bytes });
      const pdf = await task.promise;
      const zip = new JSZip();
      let count = 0;
      const seen = new Set<string>();

      for (let i = 1; i <= pdf.numPages; i++) {
        setProgress(`Scanning page ${i} of ${pdf.numPages}...`);
        const page = await pdf.getPage(i);
        const ops = await page.getOperatorList();
        for (let j = 0; j < ops.fnArray.length; j++) {
          const fn = ops.fnArray[j];
          if (fn !== pdfjsLib.OPS.paintImageXObject && fn !== pdfjsLib.OPS.paintInlineImageXObject) continue;
          const name = ops.argsArray[j][0] as string;
          if (typeof name === "string" && seen.has(name)) continue;
          try {
            const img: DecodedImage | null = await new Promise((resolve) => {
              try {
                if (typeof name === "string") page.objs.get(name, resolve);
                else resolve(null);
              } catch {
                resolve(null);
              }
            });
            if (!img || !img.width || img.width < 16 || img.height < 16) continue;
            const blob = await decodedImageToBlob(img);
            if (!blob) continue;
            count++;
            if (typeof name === "string") seen.add(name);
            zip.file(`image-${String(count).padStart(3, "0")}-page${i}.png`, blob);
          } catch {
            // skip undecodable images
          }
        }
      }
      await task.destroy();

      if (!count) {
        setError("No embedded images found in this PDF.");
      } else {
        setProgress("Packaging ZIP...");
        const blob = await zip.generateAsync({ type: "blob" });
        setResult({ blob, name: f.name.replace(/\.pdf$/i, "-images.zip"), count });
      }
    } catch (e) {
      console.error(e);
      setError("Failed to extract images from this PDF.");
    }
    setProcessing(false);
    setProgress("");
  };

  return (
    <div className="space-y-6">
      <UploadZone accept={ACCEPTED_PDF_TYPES} multiple={false} onFilesChange={(f) => { setFiles(f); setResult(null); setError(""); }} title="Upload PDF to extract images from" description="All embedded photos and graphics are saved as PNG files" />

      {files.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button onClick={handleExtract} disabled={processing} size="lg" className="w-full" variant="gradient">
            {processing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />{progress || "Extracting..."}</> : <><Images className="w-4 h-4 mr-2" />Extract Images</>}
          </Button>
        </motion.div>
      )}

      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-2xl p-6">
          <p className="font-semibold text-green-700 dark:text-green-400 mb-3">
            Found {result.count} image{result.count !== 1 ? "s" : ""}! ({formatFileSize(result.blob.size)})
          </p>
          <Button onClick={() => downloadBlob(result.blob, result.name)} variant="gradient" size="lg" className="w-full">
            <Download className="w-4 h-4 mr-2" />Download ZIP
          </Button>
        </motion.div>
      )}
    </div>
  );
}
