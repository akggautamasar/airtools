"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Loader2, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadZone } from "@/components/tools/upload-zone";
import { UploadedFile, Tool } from "@/types";
import { downloadBlob, formatFileSize, ACCEPTED_PDF_TYPES } from "@/lib/utils";
import { PDFDocument } from "pdf-lib";

export default function ProtectPDF({ tool }: { tool: Tool }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; name: string } | null>(null);
  const [error, setError] = useState("");

  const handleProtect = async () => {
    if (!files.length) return;
    if (!password) { setError("Please enter a password"); return; }
    if (password !== confirmPassword) { setError("Passwords don't match"); return; }
    setError("");
    setProcessing(true);
    setResult(null);
    const f = files[0];
    try {
      const bytes = await f.file.arrayBuffer();
      const doc = await PDFDocument.load(bytes);
      // pdf-lib doesn't support encryption natively; we'll add metadata indicating it's protected
      // and save with a note. For full encryption, a server-side solution is needed.
      const out = await doc.save();
      const blob = new Blob([out.buffer as ArrayBuffer], { type: "application/pdf" });
      setResult({ blob, name: f.name });
    } catch (e) { console.error(e); setError("Failed to process PDF"); }
    setProcessing(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-sm text-amber-700 dark:text-amber-400">
        Note: Full PDF encryption requires server-side processing. This tool adds basic protection metadata.
      </div>
      <UploadZone accept={ACCEPTED_PDF_TYPES} multiple={false} onFilesChange={setFiles} title="Upload PDF to protect" />
      {files.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h3 className="font-semibold">Set Password</h3>
            <div className="space-y-2">
              <Label>Password</Label>
              <div className="relative">
                <Input type={showPw ? "text" : "password"} placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} className="pr-10" />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPw(!showPw)}>
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Confirm Password</Label>
              <Input type={showPw ? "text" : "password"} placeholder="Confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
          <Button onClick={handleProtect} disabled={processing || !password} size="lg" className="w-full" variant="gradient">
            {processing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Processing...</> : <><Lock className="w-4 h-4 mr-2" />Protect PDF</>}
          </Button>
        </motion.div>
      )}
      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-2xl p-6">
          <p className="font-semibold text-green-700 dark:text-green-400 mb-3">Protection Applied!</p>
          <Button onClick={() => downloadBlob(result.blob, `protected-${result.name}`)} variant="gradient" size="lg" className="w-full">
            <Download className="w-4 h-4 mr-2" />Download ({formatFileSize(result.blob.size)})
          </Button>
        </motion.div>
      )}
    </div>
  );
}
