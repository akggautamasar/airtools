"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Download, FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { UploadZone } from "@/components/tools/upload-zone";
import { UploadedFile, Tool } from "@/types";
import { downloadBlob, formatFileSize, ACCEPTED_PDF_TYPES } from "@/lib/utils";
import { PDFDocument } from "pdf-lib";

export default function CompressPDF({ tool }: { tool: Tool }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [quality, setQuality] = useState(70);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<{ name: string; blob: Blob; originalSize: number; newSize: number }[]>([]);

  const presets = [
    { label: "Low", value: 40, desc: "Smallest file" },
    { label: "Medium", value: 70, desc: "Balanced" },
    { label: "High", value: 90, desc: "Best quality" },
  ];

  const handleProcess = async () => {
    if (!files.length) return;
    setProcessing(true);
    setResults([]);

    const newResults = [];
    for (const f of files) {
      try {
        const arrayBuffer = await f.file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        const compressed = await pdfDoc.save({ useObjectStreams: true, addDefaultPage: false, objectsPerTick: 50 });
        const blob = new Blob([compressed.buffer as ArrayBuffer], { type: "application/pdf" });
        newResults.push({ name: f.name, blob, originalSize: f.size, newSize: blob.size });
      } catch (e) {
        console.error("Error compressing", f.name, e);
      }
    }

    setResults(newResults);
    setProcessing(false);
  };

  const reduction = results.length > 0
    ? Math.round((1 - results.reduce((a, r) => a + r.newSize, 0) / results.reduce((a, r) => a + r.originalSize, 0)) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <UploadZone
        accept={ACCEPTED_PDF_TYPES}
        multiple
        onFilesChange={setFiles}
        title="Upload PDF files to compress"
        description="Drag & drop PDF files here"
      />

      {files.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Presets */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h3 className="font-semibold">Compression Level</h3>
            <div className="grid grid-cols-3 gap-3">
              {presets.map((p) => (
                <button
                  key={p.label}
                  onClick={() => setQuality(p.value)}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${quality === p.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                >
                  <p className="font-semibold text-sm">{p.label}</p>
                  <p className="text-xs text-muted-foreground">{p.desc}</p>
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <Label>Quality: {quality}%</Label>
                <span className="text-muted-foreground">{quality < 50 ? "Small file" : quality < 80 ? "Balanced" : "High quality"}</span>
              </div>
              <Slider value={[quality]} onValueChange={([v]) => setQuality(v)} min={10} max={100} step={5} />
            </div>
          </div>

          <Button onClick={handleProcess} disabled={processing} size="lg" className="w-full" variant="gradient">
            {processing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Compressing...</> : <><FileDown className="w-4 h-4 mr-2" /> Compress {files.length} PDF{files.length > 1 ? "s" : ""}</>}
          </Button>
        </motion.div>
      )}

      {results.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
              <FileDown className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-green-700 dark:text-green-400">Compression Complete!</p>
              {reduction > 0 && <p className="text-sm text-green-600 dark:text-green-500">Reduced by {reduction}% on average</p>}
            </div>
          </div>
          {results.map((r, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-white dark:bg-card rounded-xl border border-green-200 dark:border-green-800">
              <div>
                <p className="text-sm font-medium truncate max-w-xs">{r.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(r.originalSize)} → {formatFileSize(r.newSize)}</p>
              </div>
              <Button size="sm" onClick={() => downloadBlob(r.blob, r.name)}>
                <Download className="w-4 h-4 mr-1" /> Download
              </Button>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
