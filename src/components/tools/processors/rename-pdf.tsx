"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Loader2, FileEdit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadZone } from "@/components/tools/upload-zone";
import { UploadedFile, Tool } from "@/types";
import { downloadBlob, ACCEPTED_PDF_TYPES } from "@/lib/utils";

function sanitizeFilename(text: string): string {
  return text
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

async function extractFirstLineOfText(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

  const bytes = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
  const page = await pdf.getPage(1);
  const textContent = await page.getTextContent();
  const items = textContent.items as { str: string }[];
  const fullText = items.map((item) => item.str).join(" ").trim();
  return fullText.split(/\s{2,}|\n/)[0] || fullText;
}

export default function RenamePDF({ tool }: { tool: Tool }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [newName, setNewName] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleFilesChange = (f: UploadedFile[]) => {
    setFiles(f);
    setDone(false);
    setError("");
    setNewName(f.length ? f[0].name.replace(/\.pdf$/i, "") : "");
  };

  const handleSuggest = async () => {
    if (!files.length) return;
    setProcessing(true);
    setError("");
    try {
      const suggestion = await extractFirstLineOfText(files[0].file);
      const cleaned = sanitizeFilename(suggestion);
      if (cleaned) setNewName(cleaned);
      else setError("No readable text found on the first page. Enter a name manually.");
    } catch (e) {
      console.error(e);
      setError("Could not extract text from this PDF. Enter a name manually.");
    }
    setProcessing(false);
  };

  const handleDownload = () => {
    if (!files.length || !newName.trim()) return;
    const finalName = `${sanitizeFilename(newName)}.pdf`;
    downloadBlob(files[0].file, finalName);
    setDone(true);
  };

  return (
    <div className="space-y-6">
      <UploadZone accept={ACCEPTED_PDF_TYPES} multiple={false} onFilesChange={handleFilesChange} title="Upload PDF to rename" />
      {files.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <div className="space-y-2">
              <Label>New Filename</Label>
              <div className="flex items-center gap-2">
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Enter new filename" className="flex-1" />
                <span className="text-sm text-muted-foreground">.pdf</span>
              </div>
            </div>
            <Button onClick={handleSuggest} disabled={processing} variant="outline" size="sm" className="w-full">
              {processing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Reading PDF text...</> : <><FileEdit className="w-4 h-4 mr-2" />Suggest name from PDF text</>}
            </Button>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <p className="text-xs text-muted-foreground">
              We read the first line of text on page 1 and clean it up into a filename. You can edit it before downloading.
            </p>
          </div>
          <Button onClick={handleDownload} disabled={!newName.trim()} size="lg" className="w-full" variant="gradient">
            <Download className="w-4 h-4 mr-2" />Download as &quot;{sanitizeFilename(newName) || "..."}.pdf&quot;
          </Button>
          {done && (
            <p className="text-sm text-green-600 dark:text-green-400 text-center">Downloaded! The PDF content is unchanged — only the filename is new.</p>
          )}
        </motion.div>
      )}
    </div>
  );
}
