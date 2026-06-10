"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Loader2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UploadZone } from "@/components/tools/upload-zone";
import { UploadedFile, Tool } from "@/types";
import { downloadBlob, formatFileSize } from "@/lib/utils";
import { textToPdfBytes } from "@/lib/pdf-client";

// Minimal MOBI/AZW reader: parses the PalmDB container, decompresses the
// PalmDOC-compressed text records and strips the HTML markup. DRM-protected
// and HUFF/CDIC-compressed books are detected and rejected with a clear
// message.
function mobiToText(buffer: ArrayBuffer): string {
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  const numRecords = view.getUint16(76);
  if (numRecords < 2) throw new Error("Not a valid MOBI/AZW file.");
  const recordOffsets: number[] = [];
  for (let i = 0; i < numRecords; i++) {
    recordOffsets.push(view.getUint32(78 + i * 8));
  }
  recordOffsets.push(buffer.byteLength);

  // Record 0: PalmDOC header.
  const r0 = recordOffsets[0];
  const compression = view.getUint16(r0);
  const textRecordCount = view.getUint16(r0 + 8);
  const encryption = view.getUint16(r0 + 12);

  if (encryption !== 0) {
    throw new Error("This book is DRM-protected and cannot be converted.");
  }
  if (compression === 17480) {
    throw new Error("This book uses HUFF/CDIC compression, which isn't supported. Convert it with Calibre instead.");
  }
  if (compression !== 1 && compression !== 2) {
    throw new Error("Unrecognized MOBI compression format.");
  }

  const decoder = new TextDecoder("utf-8", { fatal: false });
  let html = "";
  for (let i = 1; i <= Math.min(textRecordCount, numRecords - 1); i++) {
    const start = recordOffsets[i];
    const end = recordOffsets[i + 1];
    const record = bytes.subarray(start, end);

    if (compression === 1) {
      html += decoder.decode(record);
      continue;
    }

    // PalmDOC LZ77 decompression.
    const out: number[] = [];
    let p = 0;
    while (p < record.length) {
      const c = record[p++];
      if (c === 0) {
        out.push(0);
      } else if (c <= 8) {
        // literal run of c bytes
        for (let k = 0; k < c && p < record.length; k++) out.push(record[p++]);
      } else if (c <= 0x7f) {
        out.push(c);
      } else if (c <= 0xbf) {
        // length-distance pair packed into two bytes
        if (p >= record.length) break;
        const next = record[p++];
        const pair = ((c & 0x3f) << 8) | next;
        const distance = pair >> 3;
        const length = (pair & 7) + 3;
        for (let k = 0; k < length; k++) {
          const idx = out.length - distance;
          out.push(idx >= 0 ? out[idx] : 32);
        }
      } else {
        // space + char
        out.push(32, c ^ 0x80);
      }
    }
    html += decoder.decode(new Uint8Array(out));
  }

  // Strip HTML to text, preserving paragraph breaks.
  const text = html
    .replace(/<\s*(p|br|div|h[1-6])[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!text) throw new Error("No readable text found in this book.");
  return text;
}

// Handles mobi-to-pdf and azw-to-pdf (AZW is MOBI-based).
export default function MobiToPDF({ tool }: { tool: Tool }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ blob: Blob; name: string } | null>(null);

  const handleConvert = async () => {
    if (!files.length) return;
    setProcessing(true);
    setResult(null);
    setError("");
    try {
      const f = files[0];
      const text = mobiToText(await f.file.arrayBuffer());
      const bytes = await textToPdfBytes(text, f.name);
      setResult({
        blob: new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" }),
        name: f.name.replace(/\.(mobi|azw3?|prc)$/i, "") + ".pdf",
      });
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Failed to convert this book.");
    }
    setProcessing(false);
  };

  return (
    <div className="space-y-6">
      <UploadZone
        accept={{ "application/octet-stream": [".mobi", ".azw", ".azw3", ".prc"] }}
        multiple={false}
        onFilesChange={(f) => { setFiles(f); setResult(null); setError(""); }}
        title="Upload MOBI / AZW eBook"
        description="DRM-free Kindle books are converted to a readable PDF"
      />

      {files.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button onClick={handleConvert} disabled={processing} size="lg" className="w-full" variant="gradient">
            {processing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Converting...</> : <><BookOpen className="w-4 h-4 mr-2" />Convert to PDF</>}
          </Button>
        </motion.div>
      )}

      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-2xl p-6">
          <p className="font-semibold text-green-700 dark:text-green-400 mb-3">Conversion Complete! ({formatFileSize(result.blob.size)})</p>
          <Button onClick={() => downloadBlob(result.blob, result.name)} variant="gradient" size="lg" className="w-full">
            <Download className="w-4 h-4 mr-2" />Download PDF
          </Button>
        </motion.div>
      )}
    </div>
  );
}
