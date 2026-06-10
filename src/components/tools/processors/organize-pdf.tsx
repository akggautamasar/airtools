"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Loader2, LayoutGrid, RotateCw, Trash2, ArrowLeft, ArrowRight, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UploadZone } from "@/components/tools/upload-zone";
import { UploadedFile, Tool } from "@/types";
import { downloadBlob, formatFileSize, ACCEPTED_PDF_TYPES } from "@/lib/utils";
import { renderPdfPages } from "@/lib/pdf-client";

interface PageItem {
  srcIndex: number;
  thumb: string;
  rotation: number; // additional rotation in degrees
}

export default function OrganizePDF({ tool }: { tool: Tool }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ blob: Blob; name: string } | null>(null);

  const handleFilesChange = async (f: UploadedFile[]) => {
    setFiles(f);
    setPages([]);
    setResult(null);
    setError("");
    if (!f.length) return;
    setLoading(true);
    try {
      const bytes = await f[0].file.arrayBuffer();
      const items: PageItem[] = [];
      await renderPdfPages(bytes, 0.4, (canvas, idx) => {
        items.push({ srcIndex: idx, thumb: canvas.toDataURL("image/jpeg", 0.7), rotation: 0 });
      });
      setPages(items);
    } catch (e) {
      console.error(e);
      setError("Could not read this PDF.");
    }
    setLoading(false);
  };

  const move = (i: number, dir: -1 | 1) => {
    setPages((p) => {
      const j = i + dir;
      if (j < 0 || j >= p.length) return p;
      const next = [...p];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const rotate = (i: number) => {
    setPages((p) => p.map((pg, idx) => (idx === i ? { ...pg, rotation: (pg.rotation + 90) % 360 } : pg)));
  };

  const remove = (i: number) => {
    setPages((p) => p.filter((_, idx) => idx !== i));
  };

  const handleSave = async () => {
    if (!files.length || !pages.length) return;
    setProcessing(true);
    setResult(null);
    setError("");
    try {
      const { PDFDocument, degrees } = await import("pdf-lib");
      const f = files[0];
      const srcDoc = await PDFDocument.load(await f.file.arrayBuffer(), { ignoreEncryption: true });
      const newDoc = await PDFDocument.create();
      const copied = await newDoc.copyPages(srcDoc, pages.map((p) => p.srcIndex));
      copied.forEach((page, i) => {
        const extra = pages[i].rotation;
        if (extra) page.setRotation(degrees((page.getRotation().angle + extra) % 360));
        newDoc.addPage(page);
      });
      const out = await newDoc.save();
      setResult({
        blob: new Blob([out.buffer as ArrayBuffer], { type: "application/pdf" }),
        name: f.name.replace(/\.pdf$/i, "-organized.pdf"),
      });
    } catch (e) {
      console.error(e);
      setError("Failed to save the reorganized PDF.");
    }
    setProcessing(false);
  };

  return (
    <div className="space-y-6">
      <UploadZone accept={ACCEPTED_PDF_TYPES} multiple={false} onFilesChange={handleFilesChange} title="Upload PDF to organize" description="Reorder, rotate or delete pages" />

      {loading && (
        <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />Generating page thumbnails...
        </div>
      )}

      {pages.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{pages.length} pages — use the buttons on each page</p>
            <Button variant="outline" size="sm" onClick={() => handleFilesChange(files)}>
              <Undo2 className="w-3.5 h-3.5 mr-1.5" />Reset
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {pages.map((p, i) => (
              <div key={`${p.srcIndex}-${i}`} className="border border-border rounded-xl overflow-hidden bg-card">
                <div className="relative bg-muted flex items-center justify-center p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.thumb}
                    alt={`Page ${p.srcIndex + 1}`}
                    className="max-h-40 w-auto transition-transform"
                    style={{ transform: `rotate(${p.rotation}deg)` }}
                  />
                  <span className="absolute top-1.5 left-1.5 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                    {i + 1}
                  </span>
                </div>
                <div className="flex items-center justify-center gap-1 p-1.5 border-t border-border">
                  <button onClick={() => move(i, -1)} disabled={i === 0} className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30" title="Move left">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <button onClick={() => rotate(i)} className="p-1.5 rounded-lg hover:bg-muted" title="Rotate 90°">
                    <RotateCw className="w-4 h-4" />
                  </button>
                  <button onClick={() => remove(i)} className="p-1.5 rounded-lg hover:bg-muted text-red-500" title="Delete page">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => move(i, 1)} disabled={i === pages.length - 1} className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30" title="Move right">
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button onClick={handleSave} disabled={processing} size="lg" className="w-full" variant="gradient">
            {processing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</> : <><LayoutGrid className="w-4 h-4 mr-2" />Save Organized PDF</>}
          </Button>
        </motion.div>
      )}

      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-2xl p-6">
          <p className="font-semibold text-green-700 dark:text-green-400 mb-3">PDF Organized! ({formatFileSize(result.blob.size)})</p>
          <Button onClick={() => downloadBlob(result.blob, result.name)} variant="gradient" size="lg" className="w-full">
            <Download className="w-4 h-4 mr-2" />Download PDF
          </Button>
        </motion.div>
      )}
    </div>
  );
}
