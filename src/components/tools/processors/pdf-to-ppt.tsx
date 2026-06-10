"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Loader2, Presentation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UploadZone } from "@/components/tools/upload-zone";
import { UploadedFile, Tool } from "@/types";
import { downloadBlob, formatFileSize, ACCEPTED_PDF_TYPES } from "@/lib/utils";
import { renderPdfPages } from "@/lib/pdf-client";

export default function PDFToPPT({ tool }: { tool: Tool }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ blob: Blob; name: string; slides: number } | null>(null);

  const handleConvert = async () => {
    if (!files.length) return;
    setProcessing(true);
    setResult(null);
    setError("");
    try {
      const f = files[0];
      const PptxGenJS = (await import("pptxgenjs")).default;
      const pptx = new PptxGenJS();
      let slideCount = 0;

      await renderPdfPages(await f.file.arrayBuffer(), 2, (canvas, idx, total) => {
        setProgress(`Converting page ${idx + 1} of ${total}...`);
        if (idx === 0) {
          pptx.layout = canvas.width >= canvas.height ? "LAYOUT_16x9" : "LAYOUT_4x3";
        }
        const slide = pptx.addSlide();
        // Fit the page image to the slide, preserving aspect ratio.
        const slideW = 10;
        const slideH = pptx.layout === "LAYOUT_16x9" ? 5.625 : 7.5;
        const scale = Math.min(slideW / canvas.width, slideH / canvas.height);
        const w = canvas.width * scale;
        const h = canvas.height * scale;
        slide.addImage({
          data: canvas.toDataURL("image/jpeg", 0.9),
          x: (slideW - w) / 2,
          y: (slideH - h) / 2,
          w,
          h,
        });
        slideCount++;
      });

      setProgress("Packaging PPTX...");
      const blob = (await pptx.write({ outputType: "blob" })) as Blob;
      setResult({ blob, name: f.name.replace(/\.pdf$/i, ".pptx"), slides: slideCount });
    } catch (e) {
      console.error(e);
      setError("Failed to convert this PDF.");
    }
    setProcessing(false);
    setProgress("");
  };

  return (
    <div className="space-y-6">
      <UploadZone accept={ACCEPTED_PDF_TYPES} multiple={false} onFilesChange={(f) => { setFiles(f); setResult(null); setError(""); }} title="Upload PDF to convert to PowerPoint" description="Each page becomes a full-size slide" />

      {files.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button onClick={handleConvert} disabled={processing} size="lg" className="w-full" variant="gradient">
            {processing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />{progress || "Converting..."}</> : <><Presentation className="w-4 h-4 mr-2" />Convert to PPTX</>}
          </Button>
        </motion.div>
      )}

      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-2xl p-6">
          <p className="font-semibold text-green-700 dark:text-green-400 mb-3">
            Created {result.slides} slide{result.slides !== 1 ? "s" : ""}! ({formatFileSize(result.blob.size)})
          </p>
          <Button onClick={() => downloadBlob(result.blob, result.name)} variant="gradient" size="lg" className="w-full">
            <Download className="w-4 h-4 mr-2" />Download PPTX
          </Button>
        </motion.div>
      )}
    </div>
  );
}
