"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Loader2, ListOrdered } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadZone } from "@/components/tools/upload-zone";
import { UploadedFile, Tool } from "@/types";
import { downloadBlob, formatFileSize, ACCEPTED_PDF_TYPES } from "@/lib/utils";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export default function AddPageNumbers({ tool }: { tool: Tool }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [position, setPosition] = useState("bottom-center");
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; name: string } | null>(null);

  const getXY = (pos: string, w: number, h: number, textW: number) => {
    const margin = 30;
    const positions: Record<string, [number, number]> = {
      "top-left": [margin, h - margin],
      "top-center": [w / 2 - textW / 2, h - margin],
      "top-right": [w - margin - textW, h - margin],
      "bottom-left": [margin, margin],
      "bottom-center": [w / 2 - textW / 2, margin],
      "bottom-right": [w - margin - textW, margin],
    };
    return positions[pos] || [w / 2, margin];
  };

  const handleAdd = async () => {
    if (!files.length) return;
    setProcessing(true);
    setResult(null);
    const f = files[0];
    try {
      const bytes = await f.file.arrayBuffer();
      const doc = await PDFDocument.load(bytes);
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const pages = doc.getPages();
      pages.forEach((page, i) => {
        const { width, height } = page.getSize();
        const text = `${i + 1}`;
        const textW = font.widthOfTextAtSize(text, 12);
        const [x, y] = getXY(position, width, height, textW);
        page.drawText(text, { x, y, size: 12, font, color: rgb(0.3, 0.3, 0.3) });
      });
      const out = await doc.save();
      setResult({ blob: new Blob([out as BlobPart], { type: "application/pdf" }), name: f.name });
    } catch (e) { console.error(e); }
    setProcessing(false);
  };

  return (
    <div className="space-y-6">
      <UploadZone accept={ACCEPTED_PDF_TYPES} multiple={false} onFilesChange={setFiles} title="Upload PDF to add page numbers" />
      {files.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h3 className="font-semibold">Number Position</h3>
            <div className="space-y-2">
              <Label>Position</Label>
              <Select value={position} onValueChange={setPosition}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="top-left">Top Left</SelectItem>
                  <SelectItem value="top-center">Top Center</SelectItem>
                  <SelectItem value="top-right">Top Right</SelectItem>
                  <SelectItem value="bottom-left">Bottom Left</SelectItem>
                  <SelectItem value="bottom-center">Bottom Center</SelectItem>
                  <SelectItem value="bottom-right">Bottom Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleAdd} disabled={processing} size="lg" className="w-full" variant="gradient">
            {processing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Adding Numbers...</> : <><ListOrdered className="w-4 h-4 mr-2" />Add Page Numbers</>}
          </Button>
        </motion.div>
      )}
      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-2xl p-6">
          <p className="font-semibold text-green-700 dark:text-green-400 mb-3">Page Numbers Added!</p>
          <Button onClick={() => downloadBlob(result.blob, `numbered-${result.name}`)} variant="gradient" size="lg" className="w-full">
            <Download className="w-4 h-4 mr-2" />Download ({formatFileSize(result.blob.size)})
          </Button>
        </motion.div>
      )}
    </div>
  );
}
