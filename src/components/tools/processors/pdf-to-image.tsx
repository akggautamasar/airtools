"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Loader2, FileImage } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { UploadZone } from "@/components/tools/upload-zone";
import { UploadedFile, Tool } from "@/types";
import { downloadBlob, formatFileSize, ACCEPTED_PDF_TYPES } from "@/lib/utils";
import { renderPdfPages, canvasToBlob } from "@/lib/pdf-client";
import JSZip from "jszip";

type Format = "jpeg" | "png" | "webp";

const FORMATS: { id: Format; label: string; ext: string }[] = [
  { id: "jpeg", label: "JPG", ext: "jpg" },
  { id: "png", label: "PNG", ext: "png" },
  { id: "webp", label: "WEBP", ext: "webp" },
];

const QUALITIES = [
  { scale: 1.5, label: "Normal", desc: "Smaller files" },
  { scale: 2.5, label: "High", desc: "Recommended" },
  { scale: 4, label: "Ultra", desc: "Print quality" },
];

export default function PDFToImage({ tool }: { tool: Tool }) {
  const isJpgTool = tool.slug === "pdf-to-jpg";
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [format, setFormat] = useState<Format>("jpeg");
  const [scale, setScale] = useState(2.5);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ blob: Blob; name: string; pages: number } | null>(null);

  const handleConvert = async () => {
    if (!files.length) return;
    setProcessing(true);
    setResult(null);
    setError("");
    try {
      const f = files[0];
      const bytes = await f.file.arrayBuffer();
      const ext = FORMATS.find((fm) => fm.id === format)!.ext;
      const baseName = f.name.replace(/\.pdf$/i, "");
      const pageBlobs: Blob[] = [];

      await renderPdfPages(bytes, scale, async (canvas, idx, total) => {
        setProgress(`Converting page ${idx + 1} of ${total}...`);
        pageBlobs.push(await canvasToBlob(canvas, `image/${format}`, format === "png" ? undefined : 0.92));
      });

      if (pageBlobs.length === 1) {
        setResult({ blob: pageBlobs[0], name: `${baseName}.${ext}`, pages: 1 });
      } else {
        setProgress("Packaging ZIP...");
        const zip = new JSZip();
        pageBlobs.forEach((b, i) => zip.file(`${baseName}-page-${i + 1}.${ext}`, b));
        const blob = await zip.generateAsync({ type: "blob" });
        setResult({ blob, name: `${baseName}-images.zip`, pages: pageBlobs.length });
      }
    } catch (e) {
      console.error(e);
      setError("Failed to convert PDF. The file may be corrupted or password-protected.");
    }
    setProcessing(false);
    setProgress("");
  };

  return (
    <div className="space-y-6">
      <UploadZone accept={ACCEPTED_PDF_TYPES} multiple={false} onFilesChange={setFiles} title="Upload PDF to convert" description="Each page becomes a high-quality image" />

      {files.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            {!isJpgTool && (
              <div className="space-y-2">
                <Label>Image Format</Label>
                <div className="grid grid-cols-3 gap-2">
                  {FORMATS.map((fm) => (
                    <button key={fm.id} onClick={() => setFormat(fm.id)} className={`p-2.5 rounded-xl border-2 text-sm font-medium transition-all ${format === fm.id ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                      {fm.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>Quality</Label>
              <div className="grid grid-cols-3 gap-2">
                {QUALITIES.map((q) => (
                  <button key={q.scale} onClick={() => setScale(q.scale)} className={`p-2.5 rounded-xl border-2 text-center transition-all ${scale === q.scale ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                    <p className="font-semibold text-sm">{q.label}</p>
                    <p className="text-xs text-muted-foreground">{q.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button onClick={handleConvert} disabled={processing} size="lg" className="w-full" variant="gradient">
            {processing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />{progress || "Converting..."}</> : <><FileImage className="w-4 h-4 mr-2" />Convert to {isJpgTool ? "JPG" : FORMATS.find((fm) => fm.id === format)!.label}</>}
          </Button>
        </motion.div>
      )}

      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-2xl p-6">
          <p className="font-semibold text-green-700 dark:text-green-400 mb-3">
            Converted {result.pages} page{result.pages !== 1 ? "s" : ""}! ({formatFileSize(result.blob.size)})
          </p>
          <Button onClick={() => downloadBlob(result.blob, result.name)} variant="gradient" size="lg" className="w-full">
            <Download className="w-4 h-4 mr-2" />Download {result.pages > 1 ? "ZIP" : "Image"}
          </Button>
        </motion.div>
      )}
    </div>
  );
}
