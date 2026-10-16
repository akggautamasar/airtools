"use client";

import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { Download, Copy, ScanSearch, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tool } from "@/types";
import { downloadBlob, formatFileSize } from "@/lib/utils";
import { formatHex, sniffFileSignature } from "@/lib/file-signatures";

type Detail = { label: string; value: string };
type Result = { name: string; rows: Detail[] };

const MAX_HASH_BYTES = 64 * 1024 * 1024;
const MAX_PDF_BYTES = 40 * 1024 * 1024;
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/bmp"];

const safeDate = (date: Date | undefined) => date && !Number.isNaN(date.getTime()) ? date.toISOString() : "Not set";

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((part) => part.toString(16).padStart(2, "0")).join("");
}

export default function FileInspector({ tool }: { tool: Tool }) {
  const isPdf = tool.slug === "pdf-metadata";
  const isImage = tool.slug === "image-info";
  const isHash = tool.slug === "file-checksum";
  const [file, setFile] = useState<File | null>(null);
  const [details, setDetails] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const accept = isPdf ? ".pdf,application/pdf" : isImage ? "image/png,image/jpeg,image/webp,image/gif,image/bmp" : undefined;

  async function inspect() {
    if (!file || loading) return;
    setLoading(true);
    setDetails(null);
    setError("");
    try {
      const base: Detail[] = [
        { label: "File name", value: file.name },
        { label: "File size", value: formatFileSize(file.size) + " (" + file.size + " bytes)" },
        { label: "Browser-reported MIME", value: file.type || "Not provided" },
      ];
      if (isPdf) {
        if (file.size === 0 || file.size > MAX_PDF_BYTES) throw new Error("PDF must be between 1 byte and 40 MiB.");
        const pdf = await PDFDocument.load(await file.arrayBuffer());
        const firstPage = pdf.getPageCount() ? pdf.getPage(0) : null;
        const size = firstPage?.getSize();
        base.push(
          { label: "Page count", value: String(pdf.getPageCount()) },
          { label: "First page dimensions", value: size ? Math.round(size.width) + " × " + Math.round(size.height) + " points" : "No pages" },
          { label: "Title", value: pdf.getTitle() || "Not set" },
          { label: "Author", value: pdf.getAuthor() || "Not set" },
          { label: "Subject", value: pdf.getSubject() || "Not set" },
          { label: "Keywords", value: pdf.getKeywords() || "Not set" },
          { label: "Creator", value: pdf.getCreator() || "Not set" },
          { label: "Producer", value: pdf.getProducer() || "Not set" },
          { label: "Creation date", value: safeDate(pdf.getCreationDate()) },
          { label: "Modification date", value: safeDate(pdf.getModificationDate()) },
        );
      } else if (isImage) {
        if (!IMAGE_TYPES.includes(file.type)) throw new Error("Choose a supported PNG, JPEG, WebP, GIF or BMP image.");
        if (file.size === 0 || file.size > 40 * 1024 * 1024) throw new Error("Images must be between 1 byte and 40 MiB.");
        const bitmap = await createImageBitmap(file);
        try {
          const width = bitmap.width, height = bitmap.height;
          if (!width || !height) throw new Error("Image dimensions could not be read.");
          const gcd = (a: number, b: number): number => b ? gcd(b, a % b) : a;
          const factor = gcd(width, height);
          base.push(
            { label: "Decoded dimensions", value: width + " × " + height + " pixels" },
            { label: "Aspect ratio", value: (width / factor) + ":" + (height / factor) },
            { label: "Pixel count", value: (width * height).toLocaleString() },
            { label: "Megapixels", value: (width * height / 1_000_000).toFixed(2) + " MP" },
          );
        } finally { bitmap.close(); }
      } else if (isHash) {
        if (file.size === 0 || file.size > MAX_HASH_BYTES) throw new Error("Files must be between 1 byte and 64 MiB for browser hashing.");
        if (!crypto?.subtle) throw new Error("SHA-256 requires a secure browser context (HTTPS).");
        const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
        base.push({ label: "SHA-256 checksum", value: toHex(new Uint8Array(digest)) });
      } else {
        const head = new Uint8Array(await file.slice(0, 64).arrayBuffer());
        base.push(
          { label: "Detected signature", value: sniffFileSignature(head) },
          { label: "First bytes (hex)", value: formatHex(head) || "Empty file" },
          { label: "Verification note", value: "A matching header is not proof that the full file is safe or valid." },
        );
      }
      setDetails({ name: file.name, rows: base });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Inspection could not be completed.");
    } finally { setLoading(false); }
  }

  const textReport = details ? details.rows.map((r) => r.label + ": " + r.value).join("\n") + "\n" : "";
  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        File inspection happens in your browser; nothing is uploaded by this tool.
        {isPdf && " Displays standard PDF document metadata. Password-protected or damaged PDFs may not open."}
        {isImage && " Reports decoded image dimensions, not camera EXIF or GPS metadata."}
        {isHash && " Computes SHA-256 for integrity comparisons. This is not a malware scanner."}
        {!isPdf && !isImage && !isHash && " Identifies a few common file signatures, not file safety."}
      </p>
      <label className="block rounded-xl border border-dashed border-border bg-card p-5 text-sm">
        <span className="font-semibold">Choose a file to inspect</span>
        <input
          type="file"
          accept={accept}
          className="mt-3 block w-full text-sm"
          onChange={(e) => { setFile(e.target.files?.[0] || null); setDetails(null); setError(""); e.target.value = ""; }}
          aria-label="Choose file for inspection"
        />
      </label>
      {file && (
        <div className="space-y-2">
          <p className="text-sm font-medium break-all">{file.name} · {formatFileSize(file.size)}</p>
          <Button onClick={() => { void inspect(); }} disabled={loading} variant="gradient" size="lg" className="w-full">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ScanSearch className="w-4 h-4 mr-2" />}
            {loading ? "Inspecting…" : "Inspect file"}
          </Button>
        </div>
      )}
      {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
      {details && (
        <section className="space-y-3 rounded-2xl border border-border bg-card p-5">
          <h3 className="text-lg font-semibold">File information</h3>
          <dl className="divide-y divide-border">
            {details.rows.map((row) => (
              <div key={row.label} className="grid gap-1 sm:grid-cols-[180px_1fr] py-3 text-sm">
                <dt className="font-medium text-muted-foreground">{row.label}</dt>
                <dd className="break-all font-mono">{row.value}</dd>
              </div>
            ))}
          </dl>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={async () => {
              try { await navigator.clipboard.writeText(textReport); } catch { setError("Clipboard unavailable; use Download."); }
            }}><Copy className="w-4 h-4 mr-1" />Copy details</Button>
            <Button size="sm" onClick={() => downloadBlob(new Blob([textReport], { type: "text/plain;charset=utf-8" }), details.name.replace(/\.[^.]+$/, "") + "-info.txt")}>
              <Download className="w-4 h-4 mr-1" />Download report
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
