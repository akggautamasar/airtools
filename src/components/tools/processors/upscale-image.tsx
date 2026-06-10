"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Loader2, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UploadZone } from "@/components/tools/upload-zone";
import { UploadedFile, Tool } from "@/types";
import { downloadBlob, formatFileSize, ACCEPTED_IMAGE_TYPES } from "@/lib/utils";

const UPSCALE_API_URL =
  process.env.NEXT_PUBLIC_UPSCALE_API_URL || "https://airupscaler.worksbeyondworks.workers.dev";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export default function UpscaleImage({ tool }: { tool: Tool }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<{
    name: string;
    blob: Blob;
    preview: string;
    originalPreview: string;
    originalSize: number;
  }[]>([]);

  const handleFilesChange = (f: UploadedFile[]) => {
    setFiles(f);
    setResults([]);
    setError("");
  };

  const handleUpscale = async () => {
    if (!files.length) return;
    setProcessing(true);
    setResults([]);
    setError("");
    const newResults = [];

    for (const f of files) {
      try {
        const dataUrl = await fileToDataUrl(f.file);
        const res = await fetch(UPSCALE_API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: dataUrl }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => null);
          throw new Error(err?.error || `Upscaling failed (${res.status})`);
        }

        const blob = await res.blob();
        newResults.push({
          name: f.name.replace(/\.[^.]+$/, "") + "-upscaled" + (f.name.match(/\.[^.]+$/)?.[0] || ".png"),
          blob,
          preview: URL.createObjectURL(blob),
          originalPreview: f.preview || URL.createObjectURL(f.file),
          originalSize: f.size,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to upscale image. Please try again.");
      }
    }

    setResults(newResults);
    setProcessing(false);
  };

  return (
    <div className="space-y-6">
      <UploadZone
        accept={ACCEPTED_IMAGE_TYPES}
        multiple
        onFilesChange={handleFilesChange}
        title="Upload images to upscale"
        description="JPG, PNG, WEBP supported · AI-powered enhancement"
      />

      {files.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 text-xs text-blue-700 dark:text-blue-400">
            ✨ AirTools AI Upscaler enhances resolution and sharpness. Larger images may take longer to process.
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button onClick={handleUpscale} disabled={processing} size="lg" className="w-full" variant="gradient">
            {processing ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" />Enhancing image{files.length > 1 ? "s" : ""}...</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" />Upscale {files.length} Image{files.length > 1 ? "s" : ""}</>
            )}
          </Button>
        </motion.div>
      )}

      {results.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-2xl p-6 space-y-4"
        >
          <p className="font-semibold text-green-700 dark:text-green-400">Upscale Complete!</p>
          {results.map((r, i) => (
            <div key={i} className="bg-white dark:bg-card rounded-xl p-3 border border-green-200 dark:border-green-800 space-y-3">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.originalPreview} alt="Original" className="w-20 h-20 object-cover rounded-lg border border-border" />
                <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.preview} alt="Upscaled" className="w-20 h-20 object-cover rounded-lg border border-green-300 dark:border-green-700" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{r.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(r.originalSize)} → <span className="text-green-600 dark:text-green-400 font-medium">{formatFileSize(r.blob.size)}</span>
                  </p>
                </div>
              </div>
              <Button size="sm" className="w-full" onClick={() => downloadBlob(r.blob, r.name)}>
                <Download className="w-3 h-3 mr-1" />Download
              </Button>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
