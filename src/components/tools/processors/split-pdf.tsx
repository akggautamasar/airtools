"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Loader2, FileMinus2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadZone } from "@/components/tools/upload-zone";
import { UploadedFile, Tool } from "@/types";
import { downloadBlob, formatFileSize, ACCEPTED_PDF_TYPES } from "@/lib/utils";
import { PDFDocument } from "pdf-lib";
import JSZip from "jszip";

type SplitMode = "every" | "range" | "interval";

export default function SplitPDF({ tool }: { tool: Tool }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [mode, setMode] = useState<SplitMode>("every");
  const [range, setRange] = useState("1-3,5,7-9");
  const [interval, setInterval] = useState(2);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<Blob | null>(null);

  const parseRanges = (rangeStr: string, maxPage: number): number[][] => {
    const parts = rangeStr.split(",").map((s) => s.trim());
    return parts
      .map((p) => {
        if (p.includes("-")) {
          const [start, end] = p.split("-").map(Number);
          return Array.from({ length: end - start + 1 }, (_, i) => start + i - 1).filter((n) => n >= 0 && n < maxPage);
        }
        const n = Number(p) - 1;
        return n >= 0 && n < maxPage ? [n] : [];
      })
      .filter((g) => g.length > 0);
  };

  const handleSplit = async () => {
    if (!files.length) return;
    setProcessing(true);
    setResult(null);
    try {
      const f = files[0];
      const bytes = await f.file.arrayBuffer();
      const srcDoc = await PDFDocument.load(bytes);
      const totalPages = srcDoc.getPageCount();

      let groups: number[][] = [];
      if (mode === "every") {
        groups = Array.from({ length: totalPages }, (_, i) => [i]);
      } else if (mode === "range") {
        groups = parseRanges(range, totalPages);
      } else {
        for (let i = 0; i < totalPages; i += interval) {
          groups.push(Array.from({ length: Math.min(interval, totalPages - i) }, (_, j) => i + j));
        }
      }

      const zip = new JSZip();
      for (let i = 0; i < groups.length; i++) {
        const newDoc = await PDFDocument.create();
        const pages = await newDoc.copyPages(srcDoc, groups[i]);
        pages.forEach((p) => newDoc.addPage(p));
        const data = await newDoc.save();
        zip.file(`part-${i + 1}.pdf`, data);
      }

      const blob = await zip.generateAsync({ type: "blob" });
      setResult(blob);
    } catch (e) {
      console.error(e);
    }
    setProcessing(false);
  };

  return (
    <div className="space-y-6">
      <UploadZone accept={ACCEPTED_PDF_TYPES} multiple={false} onFilesChange={setFiles} title="Upload PDF to split" description="Upload one PDF file" />

      {files.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h3 className="font-semibold">Split Mode</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: "every" as SplitMode, label: "Every Page", desc: "One file per page" },
                { id: "range" as SplitMode, label: "By Range", desc: "Custom ranges" },
                { id: "interval" as SplitMode, label: "Fixed Interval", desc: "Every N pages" },
              ].map((m) => (
                <button key={m.id} onClick={() => setMode(m.id)} className={`p-3 rounded-xl border-2 text-center transition-all ${mode === m.id ? "border-primary bg-primary/5" : "border-border"}`}>
                  <p className="font-semibold text-sm">{m.label}</p>
                  <p className="text-xs text-muted-foreground">{m.desc}</p>
                </button>
              ))}
            </div>
            {mode === "range" && (
              <div className="space-y-1">
                <Label>Page Ranges (e.g. 1-3, 5, 7-9)</Label>
                <Input value={range} onChange={(e) => setRange(e.target.value)} placeholder="1-3, 5, 7-9" />
              </div>
            )}
            {mode === "interval" && (
              <div className="space-y-1">
                <Label>Pages per file</Label>
                <Input type="number" min={1} value={interval} onChange={(e) => setInterval(Number(e.target.value))} />
              </div>
            )}
          </div>

          <Button onClick={handleSplit} disabled={processing} size="lg" className="w-full" variant="gradient">
            {processing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Splitting...</> : <><FileMinus2 className="w-4 h-4 mr-2" />Split PDF</>}
          </Button>
        </motion.div>
      )}

      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-2xl p-6">
          <p className="font-semibold text-green-700 dark:text-green-400 mb-3">Split Complete!</p>
          <Button onClick={() => downloadBlob(result, "split-pages.zip")} variant="gradient" size="lg" className="w-full">
            <Download className="w-4 h-4 mr-2" />Download ZIP ({formatFileSize(result.size)})
          </Button>
        </motion.div>
      )}
    </div>
  );
}
