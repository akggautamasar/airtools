"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Loader2, ScanText, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadZone } from "@/components/tools/upload-zone";
import { UploadedFile, Tool } from "@/types";
import { downloadBlob, ACCEPTED_IMAGE_TYPES } from "@/lib/utils";

const LANGUAGES = [
  { code: "eng", name: "English" },
  { code: "spa", name: "Spanish" },
  { code: "fra", name: "French" },
  { code: "deu", name: "German" },
  { code: "por", name: "Portuguese" },
  { code: "ita", name: "Italian" },
  { code: "hin", name: "Hindi" },
  { code: "ara", name: "Arabic" },
  { code: "rus", name: "Russian" },
  { code: "chi_sim", name: "Chinese (Simplified)" },
  { code: "jpn", name: "Japanese" },
  { code: "kor", name: "Korean" },
];

export default function OCRImage({ tool }: { tool: Tool }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [language, setLanguage] = useState("eng");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);

  const handleRecognize = async () => {
    if (!files.length) return;
    setProcessing(true);
    setText("");
    setError("");
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker(language, 1, {
        logger: (m) => {
          if (m.status === "recognizing text") setProgress(`Recognizing... ${Math.round(m.progress * 100)}%`);
          else setProgress(m.status);
        },
      });
      const parts: string[] = [];
      for (let i = 0; i < files.length; i++) {
        if (files.length > 1) setProgress(`Image ${i + 1} of ${files.length}...`);
        const { data } = await worker.recognize(files[i].file);
        parts.push(data.text.trim());
      }
      await worker.terminate();
      const combined = parts.filter(Boolean).join("\n\n----------\n\n");
      if (!combined) setError("No text could be recognized in the image(s).");
      else setText(combined);
    } catch (e) {
      console.error(e);
      setError("Text recognition failed. Try a clearer image.");
    }
    setProcessing(false);
    setProgress("");
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <UploadZone accept={ACCEPTED_IMAGE_TYPES} multiple onFilesChange={(f) => { setFiles(f); setText(""); setError(""); }} title="Upload images to read text from" description="Extract text from photos, screenshots and scans" />

      {files.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
            <Label>Document language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => <SelectItem key={l.code} value={l.code}>{l.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button onClick={handleRecognize} disabled={processing} size="lg" className="w-full" variant="gradient">
            {processing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />{progress || "Recognizing..."}</> : <><ScanText className="w-4 h-4 mr-2" />Extract Text</>}
          </Button>
        </motion.div>
      )}

      {text && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-2xl p-6 space-y-3">
          <p className="font-semibold text-green-700 dark:text-green-400">Text Recognized!</p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-56 bg-white dark:bg-card border border-border rounded-xl p-3 text-sm font-mono resize-y"
          />
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={handleCopy} variant="outline" size="lg">
              {copied ? <><Check className="w-4 h-4 mr-2" />Copied!</> : <><Copy className="w-4 h-4 mr-2" />Copy Text</>}
            </Button>
            <Button onClick={() => downloadBlob(new Blob([text], { type: "text/plain;charset=utf-8" }), "extracted-text.txt")} variant="gradient" size="lg">
              <Download className="w-4 h-4 mr-2" />Download TXT
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
