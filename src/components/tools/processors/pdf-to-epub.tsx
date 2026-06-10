"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Loader2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UploadZone } from "@/components/tools/upload-zone";
import { UploadedFile, Tool } from "@/types";
import { downloadBlob, formatFileSize, ACCEPTED_PDF_TYPES } from "@/lib/utils";
import { extractPdfText } from "@/lib/pdf-client";

const escapeXml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

async function buildEpub(title: string, chapters: { title: string; text: string }[]): Promise<Blob> {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  const uuid = `urn:uuid:${crypto.randomUUID()}`;

  // mimetype must be the first entry and stored uncompressed.
  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });
  zip.file(
    "META-INF/container.xml",
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>
</container>`
  );

  const manifestItems = chapters
    .map((_, i) => `<item id="ch${i + 1}" href="chapter${i + 1}.xhtml" media-type="application/xhtml+xml"/>`)
    .join("\n    ");
  const spineItems = chapters.map((_, i) => `<itemref idref="ch${i + 1}"/>`).join("\n    ");
  const navPoints = chapters
    .map((c, i) => `<li><a href="chapter${i + 1}.xhtml">${escapeXml(c.title)}</a></li>`)
    .join("\n      ");

  zip.file(
    "OEBPS/content.opf",
    `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="uid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="uid">${uuid}</dc:identifier>
    <dc:title>${escapeXml(title)}</dc:title>
    <dc:language>en</dc:language>
    <meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d+Z$/, "Z")}</meta>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    ${manifestItems}
  </manifest>
  <spine>
    ${spineItems}
  </spine>
</package>`
  );

  zip.file(
    "OEBPS/nav.xhtml",
    `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>Contents</title></head>
<body><nav epub:type="toc"><h1>Contents</h1><ol>
      ${navPoints}
</ol></nav></body></html>`
  );

  chapters.forEach((c, i) => {
    const paras = c.text
      .split(/\n+/)
      .filter((p) => p.trim())
      .map((p) => `<p>${escapeXml(p.trim())}</p>`)
      .join("\n");
    zip.file(
      `OEBPS/chapter${i + 1}.xhtml`,
      `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>${escapeXml(c.title)}</title></head>
<body><h2>${escapeXml(c.title)}</h2>
${paras}
</body></html>`
    );
  });

  return zip.generateAsync({ type: "blob", mimeType: "application/epub+zip" });
}

// Handles pdf-to-epub, pdf-to-mobi and pdf-to-azw3. The output is always
// EPUB — the format modern Kindles accept directly via Send to Kindle.
export default function PDFToEpub({ tool }: { tool: Tool }) {
  const isKindleTool = tool.slug === "pdf-to-mobi" || tool.slug === "pdf-to-azw3";
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
      const pages = await extractPdfText(await f.file.arrayBuffer());
      const nonEmpty = pages.filter((p) => p.text.trim());
      if (!nonEmpty.length) {
        setError("No selectable text found — this looks like a scanned PDF. Run it through the OCR PDF tool first.");
        setProcessing(false);
        return;
      }
      const title = f.name.replace(/\.pdf$/i, "");
      const blob = await buildEpub(
        title,
        nonEmpty.map((p) => ({ title: `Page ${p.page}`, text: p.text }))
      );
      setResult({ blob, name: `${title}.epub` });
    } catch (e) {
      console.error(e);
      setError("Failed to convert this PDF.");
    }
    setProcessing(false);
  };

  return (
    <div className="space-y-6">
      <UploadZone accept={ACCEPTED_PDF_TYPES} multiple={false} onFilesChange={(f) => { setFiles(f); setResult(null); setError(""); }} title="Upload PDF to convert" description="Text content becomes a reflowable eBook" />

      {files.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {isKindleTool && (
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 text-xs text-blue-700 dark:text-blue-400">
              ℹ️ Output is EPUB — the format Amazon now uses for Kindle. Send it to your device with the free &quot;Send to Kindle&quot; app or email, and it converts automatically.
            </div>
          )}
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button onClick={handleConvert} disabled={processing} size="lg" className="w-full" variant="gradient">
            {processing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Converting...</> : <><BookOpen className="w-4 h-4 mr-2" />Convert to EPUB</>}
          </Button>
        </motion.div>
      )}

      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-2xl p-6">
          <p className="font-semibold text-green-700 dark:text-green-400 mb-3">Conversion Complete! ({formatFileSize(result.blob.size)})</p>
          <Button onClick={() => downloadBlob(result.blob, result.name)} variant="gradient" size="lg" className="w-full">
            <Download className="w-4 h-4 mr-2" />Download EPUB
          </Button>
        </motion.div>
      )}
    </div>
  );
}
