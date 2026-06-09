"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Loader2, FolderOpen, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UploadZone } from "@/components/tools/upload-zone";
import { UploadedFile, Tool } from "@/types";
import { downloadBlob, formatFileSize } from "@/lib/utils";
import JSZip from "jszip";

interface ExtractedFile { name: string; blob: Blob; size: number; }

export default function ZipExtractor({ tool }: { tool: Tool }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [processing, setProcessing] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedFile[]>([]);
  const [error, setError] = useState("");

  const handleExtract = async () => {
    if (!files.length) return;
    setProcessing(true);
    setExtracted([]);
    setError("");
    try {
      const bytes = await files[0].file.arrayBuffer();
      const zip = await JSZip.loadAsync(bytes);
      const results: ExtractedFile[] = [];
      await Promise.all(
        Object.entries(zip.files).map(async ([name, f]) => {
          if (!f.dir) {
            const blob = await f.async("blob");
            results.push({ name, blob, size: blob.size });
          }
        })
      );
      setExtracted(results.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (e) { setError("Failed to extract ZIP. File may be corrupted or encrypted."); }
    setProcessing(false);
  };

  return (
    <div className="space-y-6">
      <UploadZone accept={{ "application/zip": [".zip"] }} multiple={false} onFilesChange={setFiles} title="Upload ZIP file to extract" description="Only ZIP files supported" />
      {files.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
          <Button onClick={handleExtract} disabled={processing} size="lg" className="w-full" variant="gradient">
            {processing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Extracting...</> : <><FolderOpen className="w-4 h-4 mr-2" />Extract ZIP</>}
          </Button>
        </motion.div>
      )}
      {extracted.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{extracted.length} files extracted</h3>
            <Button size="sm" variant="outline" onClick={async () => {
              const JSZipLib = (await import("jszip")).default;
              const newZip = new JSZipLib();
              for (const f of extracted) newZip.file(f.name, f.blob);
              const blob = await newZip.generateAsync({ type: "blob" });
              downloadBlob(blob, "extracted.zip");
            }}>Download All</Button>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {extracted.map((f, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                <File className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{f.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(f.size)}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => downloadBlob(f.blob, f.name)}>
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
