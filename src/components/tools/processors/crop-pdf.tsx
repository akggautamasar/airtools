"use client";
import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Download, Loader2, Crop } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { UploadZone } from "@/components/tools/upload-zone";
import { UploadedFile, Tool } from "@/types";
import { downloadBlob, formatFileSize, ACCEPTED_PDF_TYPES } from "@/lib/utils";
import { loadPdfJs } from "@/lib/pdf-client";

interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const PREVIEW_SCALE = 1.2;

export default function CropPDF({ tool }: { tool: Tool }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewSize, setPreviewSize] = useState({ width: 0, height: 0 });
  const [crop, setCrop] = useState<CropRect | null>(null);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ blob: Blob; name: string } | null>(null);

  const handleFilesChange = async (f: UploadedFile[]) => {
    setFiles(f);
    setResult(null);
    setError("");
    setCrop(null);
    setPreviewUrl("");
    if (!f.length) return;
    try {
      const pdfjsLib = await loadPdfJs();
      const bytes = await f[0].file.arrayBuffer();
      const task = pdfjsLib.getDocument({ data: bytes });
      const pdf = await task.promise;
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: PREVIEW_SCALE });
      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      await page.render({ canvas, canvasContext: canvas.getContext("2d")!, viewport }).promise;
      setPreviewSize({ width: canvas.width, height: canvas.height });
      setPreviewUrl(canvas.toDataURL("image/png"));
      await task.destroy();
    } catch (e) {
      console.error(e);
      setError("Could not preview this PDF.");
    }
  };

  const getPos = useCallback((e: React.PointerEvent) => {
    const rect = containerRef.current!.getBoundingClientRect();
    const scaleX = previewSize.width / rect.width;
    const scaleY = previewSize.height / rect.height;
    return {
      x: Math.max(0, Math.min(previewSize.width, (e.clientX - rect.left) * scaleX)),
      y: Math.max(0, Math.min(previewSize.height, (e.clientY - rect.top) * scaleY)),
    };
  }, [previewSize]);

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
    setCrop({
      x: Math.min(s.x, pos.x),
      y: Math.min(s.y, pos.y),
      width: Math.abs(pos.x - s.x),
      height: Math.abs(pos.y - s.y),
    });
  };

  const onPointerUp = () => {
    setDragging(false);
    dragStart.current = null;
    setCrop((c) => (c && (c.width < 10 || c.height < 10) ? null : c));
  };

  const handleCrop = async () => {
    if (!files.length || !crop) return;
    setProcessing(true);
    setResult(null);
    setError("");
    try {
      const { PDFDocument } = await import("pdf-lib");
      const f = files[0];
      const doc = await PDFDocument.load(await f.file.arrayBuffer(), { ignoreEncryption: true });

      for (const page of doc.getPages()) {
        const { width: pw, height: ph } = page.getSize();
        // Preview is rendered at PREVIEW_SCALE from page 1; apply the same
        // relative crop box to every page.
        const relX = crop.x / previewSize.width;
        const relY = crop.y / previewSize.height;
        const relW = crop.width / previewSize.width;
        const relH = crop.height / previewSize.height;
        // PDF origin is bottom-left; preview origin is top-left.
        page.setCropBox(relX * pw, ph - (relY + relH) * ph, relW * pw, relH * ph);
      }

      const out = await doc.save();
      setResult({
        blob: new Blob([out.buffer as ArrayBuffer], { type: "application/pdf" }),
        name: f.name.replace(/\.pdf$/i, "-cropped.pdf"),
      });
    } catch (e) {
      console.error(e);
      setError("Failed to crop PDF.");
    }
    setProcessing(false);
  };

  return (
    <div className="space-y-6">
      <UploadZone accept={ACCEPTED_PDF_TYPES} multiple={false} onFilesChange={handleFilesChange} title="Upload PDF to crop" description="Drag on the preview to select the area to keep" />

      {previewUrl && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
            <Label>Drag to select the crop area (applied to all pages)</Label>
            <div
              ref={containerRef}
              className="relative mx-auto cursor-crosshair select-none touch-none border border-border rounded-lg overflow-hidden"
              style={{ maxWidth: previewSize.width }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="Page 1 preview" className="w-full h-auto block pointer-events-none" draggable={false} />
              {crop && containerRef.current && (
                <div
                  className="absolute border-2 border-primary bg-primary/15 pointer-events-none"
                  style={{
                    left: `${(crop.x / previewSize.width) * 100}%`,
                    top: `${(crop.y / previewSize.height) * 100}%`,
                    width: `${(crop.width / previewSize.width) * 100}%`,
                    height: `${(crop.height / previewSize.height) * 100}%`,
                  }}
                />
              )}
            </div>
            {crop && (
              <Button variant="outline" size="sm" onClick={() => setCrop(null)}>Reset selection</Button>
            )}
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button onClick={handleCrop} disabled={processing || !crop} size="lg" className="w-full" variant="gradient">
            {processing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Cropping...</> : <><Crop className="w-4 h-4 mr-2" />Crop PDF</>}
          </Button>
        </motion.div>
      )}

      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-2xl p-6">
          <p className="font-semibold text-green-700 dark:text-green-400 mb-3">Crop Complete! ({formatFileSize(result.blob.size)})</p>
          <Button onClick={() => downloadBlob(result.blob, result.name)} variant="gradient" size="lg" className="w-full">
            <Download className="w-4 h-4 mr-2" />Download PDF
          </Button>
        </motion.div>
      )}
    </div>
  );
}
