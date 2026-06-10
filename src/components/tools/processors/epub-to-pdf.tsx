"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Loader2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UploadZone } from "@/components/tools/upload-zone";
import { UploadedFile, Tool } from "@/types";
import { downloadBlob, formatFileSize } from "@/lib/utils";
import { textToPdfBytes } from "@/lib/pdf-client";

async function epubToText(buffer: ArrayBuffer): Promise<string> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(buffer);
  const parser = new DOMParser();

  // Locate the OPF package file via META-INF/container.xml.
  const containerXml = await zip.file("META-INF/container.xml")?.async("text");
  if (!containerXml) throw new Error("Not a valid EPUB (missing container.xml)");
  const container = parser.parseFromString(containerXml, "application/xml");
  const opfPath = container.querySelector("rootfile")?.getAttribute("full-path");
  if (!opfPath) throw new Error("Not a valid EPUB (missing rootfile)");

  const opfXml = await zip.file(opfPath)?.async("text");
  if (!opfXml) throw new Error("Not a valid EPUB (missing OPF)");
  const opf = parser.parseFromString(opfXml, "application/xml");
  const opfDir = opfPath.includes("/") ? opfPath.slice(0, opfPath.lastIndexOf("/") + 1) : "";

  // Map manifest ids to hrefs, then walk the spine in reading order.
  const manifest = new Map<string, string>();
  for (const item of Array.from(opf.querySelectorAll("manifest > item"))) {
    const id = item.getAttribute("id");
    const href = item.getAttribute("href");
    if (id && href) manifest.set(id, href);
  }

  const chapters: string[] = [];
  for (const itemref of Array.from(opf.querySelectorAll("spine > itemref"))) {
    const idref = itemref.getAttribute("idref");
    const href = idref ? manifest.get(idref) : null;
    if (!href) continue;
    const path = decodeURIComponent(opfDir + href);
    const html = await zip.file(path)?.async("text");
    if (!html) continue;
    const doc = parser.parseFromString(html, "text/html");
    doc.querySelectorAll("script,style").forEach((el) => el.remove());
    // Preserve block structure as line breaks.
    const blocks = Array.from(doc.body?.querySelectorAll("h1,h2,h3,h4,h5,h6,p,li,blockquote") || []);
    const text = blocks.length
      ? blocks.map((b) => b.textContent?.trim()).filter(Boolean).join("\n\n")
      : (doc.body?.textContent || "").trim();
    if (text.trim()) chapters.push(text.trim());
  }

  if (!chapters.length) throw new Error("No readable chapters found");
  return chapters.join("\n\n\n");
}

// Handles ebook-to-pdf and epub-to-pdf.
export default function EpubToPDF({ tool }: { tool: Tool }) {
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
      const text = await epubToText(await f.file.arrayBuffer());
      const bytes = await textToPdfBytes(text, f.name);
      setResult({
        blob: new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" }),
        name: f.name.replace(/\.epub$/i, "") + ".pdf",
      });
    } catch (e) {
      console.error(e);
      setError(e instanceof Error && e.message.includes("EPUB") ? e.message : "Failed to convert this eBook. DRM-protected files cannot be converted.");
    }
    setProcessing(false);
  };

  return (
    <div className="space-y-6">
      <UploadZone
        accept={{ "application/epub+zip": [".epub"] }}
        multiple={false}
        onFilesChange={(f) => { setFiles(f); setResult(null); setError(""); }}
        title="Upload EPUB eBook"
        description="Chapters are converted to a clean, readable PDF"
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
