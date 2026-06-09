"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Loader2, LockOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadZone } from "@/components/tools/upload-zone";
import { UploadedFile, Tool } from "@/types";
import { downloadBlob, formatFileSize, ACCEPTED_PDF_TYPES } from "@/lib/utils";
import { PDFDocument } from "pdf-lib";

export default function UnlockPDF({ tool }: { tool: Tool }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [password, setPassword] = useState("");
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; name: string } | null>(null);
  const [error, setError] = useState("");

  const handleUnlock = async () => {
    if (!files.length) return;
    setProcessing(true);
    setResult(null);
    setError("");
    const f = files[0];
    try {
      const bytes = await f.file.arrayBuffer();
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const out = await doc.save();
      setResult({ blob: new Blob([out.buffer as ArrayBuffer], { type: "application/pdf" }), name: f.name });
    } catch (e) {
      setError("Failed to unlock PDF. Check the password and try again.");
    }
    setProcessing(false);
  };

  return (
    <div className="space-y-6">
      <UploadZone accept={ACCEPTED_PDF_TYPES} multiple={false} onFilesChange={setFiles} title="Upload password-protected PDF" />
      {files.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h3 className="font-semibold">Enter PDF Password</h3>
            <div className="space-y-2">
              <Label>Password (leave blank if not protected)</Label>
              <Input type="password" placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
          <Button onClick={handleUnlock} disabled={processing} size="lg" className="w-full" variant="gradient">
            {processing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Unlocking...</> : <><LockOpen className="w-4 h-4 mr-2" />Unlock PDF</>}
          </Button>
        </motion.div>
      )}
      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-2xl p-6">
          <p className="font-semibold text-green-700 dark:text-green-400 mb-3">PDF Unlocked!</p>
          <Button onClick={() => downloadBlob(result.blob, `unlocked-${result.name}`)} variant="gradient" size="lg" className="w-full">
            <Download className="w-4 h-4 mr-2" />Download ({formatFileSize(result.blob.size)})
          </Button>
        </motion.div>
      )}
    </div>
  );
}
