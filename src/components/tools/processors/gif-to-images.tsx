"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Loader2, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UploadZone } from "@/components/tools/upload-zone";
import { UploadedFile, Tool } from "@/types";
import { downloadBlob, formatFileSize } from "@/lib/utils";
import JSZip from "jszip";

export default function GifToImages({ tool }: { tool: Tool }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ blob: Blob; name: string; frames: number } | null>(null);

  const handleExtract = async () => {
    if (!files.length) return;
    setProcessing(true);
    setResult(null);
    setError("");
    try {
      const { parseGIF, decompressFrames } = await import("gifuct-js");
      const f = files[0];
      const gif = parseGIF(await f.file.arrayBuffer());
      const frames = decompressFrames(gif, true);
      if (!frames.length) throw new Error("No frames");

      const width = gif.lsd.width;
      const height = gif.lsd.height;

      // Compose frames on a persistent canvas so partial-frame GIFs
      // (which only store changed regions) render correctly.
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      const patchCanvas = document.createElement("canvas");
      const patchCtx = patchCanvas.getContext("2d")!;

      const zip = new JSZip();
      const baseName = f.name.replace(/\.gif$/i, "");

      for (let i = 0; i < frames.length; i++) {
        setProgress(`Extracting frame ${i + 1} of ${frames.length}...`);
        const frame = frames[i];
        const { width: fw, height: fh, left, top } = frame.dims;

        if (frame.disposalType === 2) ctx.clearRect(0, 0, width, height);

        patchCanvas.width = fw;
        patchCanvas.height = fh;
        patchCtx.putImageData(new ImageData(new Uint8ClampedArray(frame.patch), fw, fh), 0, 0);
        ctx.drawImage(patchCanvas, left, top);

        const blob = await new Promise<Blob>((res, rej) =>
          canvas.toBlob((b) => (b ? res(b) : rej(new Error("Export failed"))), "image/png")
        );
        zip.file(`${baseName}-frame-${String(i + 1).padStart(3, "0")}.png`, blob);
      }

      setProgress("Packaging ZIP...");
      const blob = await zip.generateAsync({ type: "blob" });
      setResult({ blob, name: `${baseName}-frames.zip`, frames: frames.length });
    } catch (e) {
      console.error(e);
      setError("Failed to read this GIF.");
    }
    setProcessing(false);
    setProgress("");
  };

  return (
    <div className="space-y-6">
      <UploadZone accept={{ "image/gif": [".gif"] }} multiple={false} onFilesChange={(f) => { setFiles(f); setResult(null); setError(""); }} title="Upload animated GIF" description="Every frame is saved as a separate PNG image" />

      {files.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button onClick={handleExtract} disabled={processing} size="lg" className="w-full" variant="gradient">
            {processing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />{progress || "Extracting..."}</> : <><Film className="w-4 h-4 mr-2" />Extract Frames</>}
          </Button>
        </motion.div>
      )}

      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-2xl p-6">
          <p className="font-semibold text-green-700 dark:text-green-400 mb-3">
            Extracted {result.frames} frame{result.frames !== 1 ? "s" : ""}! ({formatFileSize(result.blob.size)})
          </p>
          <Button onClick={() => downloadBlob(result.blob, result.name)} variant="gradient" size="lg" className="w-full">
            <Download className="w-4 h-4 mr-2" />Download ZIP
          </Button>
        </motion.div>
      )}
    </div>
  );
}
