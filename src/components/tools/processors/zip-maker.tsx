"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Loader2, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadZone } from "@/components/tools/upload-zone";
import { UploadedFile, Tool } from "@/types";
import { downloadBlob, formatFileSize } from "@/lib/utils";
import JSZip from "jszip";

export default function ZipMaker({ tool }: { tool: Tool }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [zipName, setZipName] = useState("archive");
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<Blob | null>(null);

  const handleZip = async () => {
    if (!files.length) return;
    setProcessing(true);
    setResult(null);
    try {
      const zip = new JSZip();
      for (const f of files) {
        const bytes = await f.file.arrayBuffer();
        zip.file(f.name, bytes);
      }
      const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
      setResult(blob);
    } catch (e) { console.error(e); }
    setProcessing(false);
  };

  return (
    <div className="space-y-6">
      <UploadZone multiple onFilesChange={setFiles} title="Upload files to add to ZIP" description="Any file type supported" />
      {files.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
            <Label>ZIP File Name</Label>
            <Input value={zipName} onChange={(e) => setZipName(e.target.value)} placeholder="archive" />
          </div>
          <Button onClick={handleZip} disabled={processing} size="lg" className="w-full" variant="gradient">
            {processing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Creating ZIP...</> : <><Archive className="w-4 h-4 mr-2" />Create ZIP ({files.length} files)</>}
          </Button>
        </motion.div>
      )}
      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-2xl p-6">
          <p className="font-semibold text-green-700 dark:text-green-400 mb-3">ZIP Created! ({formatFileSize(result.size)})</p>
          <Button onClick={() => downloadBlob(result, `${zipName || "archive"}.zip`)} variant="gradient" size="lg" className="w-full">
            <Download className="w-4 h-4 mr-2" />Download ZIP
          </Button>
        </motion.div>
      )}
    </div>
  );
}
