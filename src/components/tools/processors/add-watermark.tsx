"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Loader2, Stamp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { UploadZone } from "@/components/tools/upload-zone";
import { UploadedFile, Tool } from "@/types";
import { downloadBlob, formatFileSize, ACCEPTED_PDF_TYPES } from "@/lib/utils";
import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";

export default function AddWatermark({ tool }: { tool: Tool }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [text, setText] = useState("CONFIDENTIAL");
  const [opacity, setOpacity] = useState(30);
  const [fontSize, setFontSize] = useState(48);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; name: string } | null>(null);

  const handleWatermark = async () => {
    if (!files.length || !text) return;
    setProcessing(true);
    setResult(null);
    const f = files[0];
    try {
      const bytes = await f.file.arrayBuffer();
      const doc = await PDFDocument.load(bytes);
      const font = await doc.embedFont(StandardFonts.HelveticaBold);
      doc.getPages().forEach((page) => {
        const { width, height } = page.getSize();
        page.drawText(text, {
          x: width / 2 - (font.widthOfTextAtSize(text, fontSize) / 2),
          y: height / 2,
          size: fontSize,
          font,
          color: rgb(0.5, 0.5, 0.5),
          opacity: opacity / 100,
          rotate: degrees(45),
        });
      });
      const out = await doc.save();
      setResult({ blob: new Blob([out.buffer as ArrayBuffer], { type: "application/pdf" }), name: f.name });
    } catch (e) { console.error(e); }
    setProcessing(false);
  };

  return (
    <div className="space-y-6">
      <UploadZone accept={ACCEPTED_PDF_TYPES} multiple={false} onFilesChange={setFiles} title="Upload PDF to watermark" />
      {files.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h3 className="font-semibold">Watermark Settings</h3>
            <div className="space-y-2">
              <Label>Watermark Text</Label>
              <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="CONFIDENTIAL" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between"><Label>Opacity: {opacity}%</Label></div>
              <Slider value={[opacity]} onValueChange={([v]) => setOpacity(v)} min={5} max={100} step={5} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between"><Label>Font Size: {fontSize}px</Label></div>
              <Slider value={[fontSize]} onValueChange={([v]) => setFontSize(v)} min={12} max={120} step={4} />
            </div>
          </div>
          <Button onClick={handleWatermark} disabled={processing || !text} size="lg" className="w-full" variant="gradient">
            {processing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Adding Watermark...</> : <><Stamp className="w-4 h-4 mr-2" />Add Watermark</>}
          </Button>
        </motion.div>
      )}
      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-2xl p-6">
          <p className="font-semibold text-green-700 dark:text-green-400 mb-3">Watermark Added!</p>
          <Button onClick={() => downloadBlob(result.blob, `watermarked-${result.name}`)} variant="gradient" size="lg" className="w-full">
            <Download className="w-4 h-4 mr-2" />Download ({formatFileSize(result.blob.size)})
          </Button>
        </motion.div>
      )}
    </div>
  );
}
