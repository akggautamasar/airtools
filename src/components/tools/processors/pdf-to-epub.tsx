"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Download, Loader2, BookOpen, Cloud, Monitor, AlertCircle, CheckCircle2, Clock, XCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UploadZone } from "@/components/tools/upload-zone";
import { UploadedFile, Tool } from "@/types";
import { downloadBlob, formatFileSize, ACCEPTED_PDF_TYPES } from "@/lib/utils";
import { extractPdfText } from "@/lib/pdf-client";
import { PDF_EPUB_DIRECT_MAX_BYTES, PDF_EPUB_PRESETS, PDF_EPUB_LANGUAGES, normalizeJobProgress, type PdfEpubJob, type PdfEpubReport, type PdfEpubPreset, type PdfEpubLanguage, type PdfEpubUploadTicket } from "@/lib/pdf-epub-contract";

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

// The full API-backed workflow is available on the existing PDF-to-EPUB page.
// Related legacy MOBI/AZW3 routes explicitly remain EPUB output for Send to Kindle.
export default function PDFToEpub({ tool }: { tool: Tool }) {
  const isKindleTool = tool.slug === "pdf-to-mobi" || tool.slug === "pdf-to-azw3";
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [mode, setMode] = useState<"advanced" | "browser">("advanced");
  const [serviceReady, setServiceReady] = useState<boolean | null>(null);
  const [preset, setPreset] = useState<PdfEpubPreset>("balanced");
  const [languages, setLanguages] = useState<PdfEpubLanguage>("eng+hin");
  const [bookTitle, setBookTitle] = useState("");
  const [bookAuthor, setBookAuthor] = useState("");
  const [processing, setProcessing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadStage, setUploadStage] = useState("");
  const uploadTicketRef = useRef<PdfEpubUploadTicket | null>(null);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ blob: Blob; name: string } | null>(null);
  const [job, setJob] = useState<PdfEpubJob | null>(null);
  const [report, setReport] = useState<PdfEpubReport | null>(null);
  const [elapsedPolling, setElapsedPolling] = useState(false);
  const active = useRef(true);
  const currentJobId = useRef<string | null>(null);

  useEffect(() => {
    active.current = true;
    const controller = new AbortController();
    fetch("/api/pdf-epub", { cache: "no-store", signal: controller.signal })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (!active.current) return;
        const configured = data?.available === true;
        setServiceReady(configured);
        if (!configured) setMode("browser");
      })
      .catch(() => {
        if (active.current) { setServiceReady(false); setMode("browser"); }
      });
    return () => { active.current = false; controller.abort(); };
  }, []);

  const reset = () => {
    setJob(null);
    setReport(null);
    setError("");
    setResult(null);
    setElapsedPolling(false);
    setUploadProgress(null);
    setUploadStage("");
  };

  const readError = async (response: Response): Promise<string> => {
    const payload = await response.json().catch(() => null) as { error?: { message?: string } } | null;
    return payload?.error?.message || "Service error (HTTP " + response.status + ").";
  };

  const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
  const nameOfOutput = () => (files[0]?.name || "converted.pdf").replace(/\.pdf$/i, "").replace(/[\\/]/g, "_") + ".epub";

  async function fetchReport(id: string) {
    try {
      const response = await fetch("/api/pdf-epub/jobs/" + id + "/report", { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json() as PdfEpubReport;
      if (active.current && currentJobId.current === id) setReport(data);
    } catch { /* Report is optional even if EPUB is ready. */ }
  }

  async function pollJob(id: string) {
    // Free compute may cold-start; do not poll rapidly or spin indefinitely.
    for (let attempt = 0; attempt < 120; attempt++) {
      if (!active.current || currentJobId.current !== id) return;
      await sleep(10_000);
      if (!active.current || currentJobId.current !== id) return;
      let response: Response;
      try {
        response = await fetch("/api/pdf-epub/jobs/" + id, { cache: "no-store" });
      } catch { continue; } // Temporary network drop; status can be retried.
      if (!response.ok) {
        if (response.status === 502 || response.status === 503 || response.status === 429) continue;
        throw new Error(await readError(response));
      }
      const next = await response.json() as PdfEpubJob;
      if (!active.current || currentJobId.current !== id) return;
      setJob(next);
      if (next.status === "completed") { await fetchReport(id); return; }
      if (["failed", "cancelled", "expired"].includes(next.status)) {
        throw new Error(next.error?.message || "Conversion " + next.status + ".");
      }
    }
    if (active.current && currentJobId.current === id) {
      setElapsedPolling(true);
      setError("The converter has not finished yet. Keep the job ID for support; this page stops checking automatically after 20 minutes.");
    }
  }

  async function convertAdvanced() {
    if (!files.length || processing) return;
    const file = files[0].file;
    if (file.size > PDF_EPUB_DIRECT_MAX_BYTES) {
      setError("Advanced conversion accepts PDFs up to 100 MB. Large scans may exceed the free converter's RAM or processing time.");
      return;
    }
    if (!file.size) { setError("Choose a nonempty PDF."); return; }
    setProcessing(true);
    reset();
    currentJobId.current = null;
    try {
      let ticket = uploadTicketRef.current;
      // If a chunk failed, retry using the same authorization and the already
      // uploaded chunks rather than uploading all 100 MB again.
      if (!ticket || (ticket.expires_at && new Date(ticket.expires_at).getTime() < Date.now() + 30_000)) {
        uploadTicketRef.current = null;
        setUploadStage("Authorizing private upload");
        const issued = await fetch("/api/pdf-epub/ticket", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file_bytes: file.size, preset, ocr_languages: languages,
            title: bookTitle.trim().slice(0, 160) || file.name.replace(/\.pdf$/i, ""),
            author: bookAuthor.trim().slice(0, 160),
          }),
        });
        if (!issued.ok) throw new Error(await readError(issued));
        ticket = await issued.json() as PdfEpubUploadTicket;
        uploadTicketRef.current = ticket;
      }
      setError("");
      let first: PdfEpubJob;
      if (ticket.upload_mode === "chunked") {
        if (!ticket.chunk_bytes || !ticket.chunk_count || !ticket.finalize_url) {
          throw new Error("Missing chunked-upload configuration.");
        }
        setUploadStage("Checking previously uploaded pieces");
        const headers = { Authorization: "Bearer " + ticket.upload_token };
        const statusRes = await fetch(ticket.upload_url, {
          mode: "cors", credentials: "omit", referrerPolicy: "no-referrer",
          headers,
        });
        if (!statusRes.ok) throw new Error(await readError(statusRes));
        const prior = await statusRes.json() as { uploaded?: number[]; uploaded_bytes?: number };
        const done = new Set(prior.uploaded || []);
        let uploaded = prior.uploaded_bytes || 0;
        setUploadProgress(Math.min(100, Math.floor(100 * uploaded / file.size)));
        for (let part = 0; part < ticket.chunk_count; part++) {
          if (done.has(part)) continue;
          const start = part * ticket.chunk_bytes;
          const blob = file.slice(start, Math.min(file.size, start + ticket.chunk_bytes));
          setUploadStage("Uploading piece " + (part + 1) + " of " + ticket.chunk_count);
          const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", await blob.arrayBuffer()));
          const checksum = Array.from(digest, (b) => b.toString(16).padStart(2, "0")).join("");
          let successful = false;
          for (let attempt = 0; attempt < 4; attempt++) {
            try {
              const response = await fetch(ticket.upload_url + "?part=" + part, {
                method: "POST", mode: "cors", credentials: "omit", referrerPolicy: "no-referrer",
                headers: {
                  ...headers, "Content-Type": "application/octet-stream",
                  "X-Chunk-SHA256": checksum,
                },
                body: blob,
              });
              if (!response.ok) {
                if (![409, 429, 503].includes(response.status)) throw new Error(await readError(response));
                throw new Error("Temporary upload congestion (HTTP " + response.status + ")");
              }
              successful = true;
              break;
            } catch (err) {
              if (attempt === 3) throw err;
              await sleep(1500 * (attempt + 1));
            }
          }
          if (!successful) throw new Error("Could not upload piece " + (part + 1));
          uploaded += blob.size;
          setUploadProgress(Math.min(100, Math.floor(100 * uploaded / file.size)));
        }
        setUploadStage("Verifying all pieces and starting conversion");
        const finalized = await fetch(ticket.finalize_url, {
          method: "POST", mode: "cors", credentials: "omit", referrerPolicy: "no-referrer",
          headers,
        });
        if (!finalized.ok) throw new Error(await readError(finalized));
        first = await finalized.json() as PdfEpubJob;
      } else {
        setUploadStage("Uploading PDF directly to Cloudflare");
        const response = await fetch(ticket.upload_url, {
          method: "POST", mode: "cors", credentials: "omit", referrerPolicy: "no-referrer",
          headers: {
            "Authorization": "Bearer " + ticket.upload_token,
            "Content-Type": "application/pdf",
          },
          body: file,
        });
        if (!response.ok) throw new Error(await readError(response));
        first = await response.json() as PdfEpubJob;
      }
      uploadTicketRef.current = null;
      setUploadStage("");
      setUploadProgress(null);
      if (first.job_id !== ticket.job_id) throw new Error("Conversion service returned a mismatched job ID.");
      if (!first.job_id) throw new Error("No job ID returned by conversion service.");
      currentJobId.current = first.job_id;
      setJob(first);
      await pollJob(first.job_id);
    } catch (e) {
      if (active.current) setError(e instanceof Error ? e.message : "Unable to convert this PDF.");
    } finally { if (active.current) setProcessing(false); }
  }

  async function convertBrowser() {
    if (!files.length || processing) return;
    setProcessing(true);
    reset();
    try {
      const file = files[0].file;
      // Avoid allocating unbounded PDF text and EPUBs in constrained browsers.
      if (file.size > 18 * 1024 * 1024) throw new Error("The browser converter is limited to 18 MiB per file.");
      const pages = await extractPdfText(await file.arrayBuffer());
      const found = pages.filter((p) => p.text.trim());
      if (!found.length) throw new Error("No selectable text found. This looks like a scanned PDF; use Advanced conversion for OCR on a smaller PDF.");
      const title = file.name.replace(/\.pdf$/i, "");
      const blob = await buildEpub(title, found.map((p) => ({ title: "Page " + p.page, text: p.text })));
      if (active.current) setResult({ blob, name: nameOfOutput() });
    } catch (e) {
      if (active.current) setError(e instanceof Error ? e.message : "Browser conversion failed.");
    } finally { if (active.current) setProcessing(false); }
  }

  async function downloadAdvanced() {
    if (!job || job.status !== "completed" || downloading) return;
    setDownloading(true);
    setError("");
    try {
      const res = await fetch("/api/pdf-epub/jobs/" + job.job_id + "/download", { cache: "no-store" });
      if (!res.ok) throw new Error(await readError(res));
      if (!(res.headers.get("Content-Type") || "").includes("application/epub+zip")) {
        throw new Error("The server returned an unexpected file type.");
      }
      const blob = await res.blob();
      const start = new Uint8Array(await blob.slice(0, 2).arrayBuffer());
      if (start[0] !== 0x50 || start[1] !== 0x4b) throw new Error("The downloaded file is not a valid EPUB archive.");
      downloadBlob(blob, nameOfOutput());
    } catch (e) { setError(e instanceof Error ? e.message : "Download failed."); }
    finally { setDownloading(false); }
  }

  async function cancelJob() {
    const id = currentJobId.current;
    if (!id || !job || !["queued", "running"].includes(job.status)) return;
    try {
      const res = await fetch("/api/pdf-epub/jobs/" + id, { method: "DELETE", credentials: "same-origin" });
      if (!res.ok) throw new Error(await readError(res));
      const cancelled = await res.json() as PdfEpubJob;
      currentJobId.current = null;
      setJob(cancelled);
      setProcessing(false);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not cancel."); }
  }

  const submitted = !!job;
  const maxFile = mode === "advanced" ? PDF_EPUB_DIRECT_MAX_BYTES : 18 * 1024 * 1024;
  const statusText = job?.status === "queued" ? "Waiting for an available converter…"
    : job?.status === "running" ? "Converting PDF to EPUB…"
    : job?.status === "completed" ? "Your EPUB is ready."
    : job?.status ? "Conversion " + job.status : "";

  return (
    <div className="space-y-6">
      {isKindleTool && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950/20 dark:text-blue-300">
          This tool produces EPUB, <strong>not a native MOBI or AZW3 file</strong>. EPUB can be uploaded using Send to Kindle.
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2" role="group" aria-label="Conversion method">
        <button type="button" aria-pressed={mode === "advanced"} disabled={processing || submitted}
          onClick={() => { setMode("advanced"); reset(); }}
          className={"rounded-xl border-2 p-4 text-left transition-colors " + (mode === "advanced" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30")}>
          <div className="flex items-center gap-2 font-semibold"><Cloud className="h-5 w-5" />Advanced OCR & layout</div>
          <p className="mt-1 text-xs text-muted-foreground">Uses our Cloudflare + Render converter. OCR, embedded images and conversion presets. Up to 100 MB via resumable, secured 5 MiB chunks on Cloudflare.</p>
          {serviceReady === false && <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">Currently not configured for this site</p>}
        </button>
        <button type="button" aria-pressed={mode === "browser"} disabled={processing || submitted}
          onClick={() => { setMode("browser"); reset(); }}
          className={"rounded-xl border-2 p-4 text-left transition-colors " + (mode === "browser" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30")}>
          <div className="flex items-center gap-2 font-semibold"><Monitor className="h-5 w-5" />Private browser conversion</div>
          <p className="mt-1 text-xs text-muted-foreground">Fast, offline-capable text-only EPUB. No document leaves your browser. Does not OCR scanned pages or preserve images.</p>
        </button>
      </div>

      {mode === "advanced" && (
        <p className="rounded-xl border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
          Advanced conversion sends the PDF directly from your browser to Cloudflare KV, bypassing the Vercel upload cap. It is processed by Render. Input/output files expire after approximately 24 hours.
          Free-tier compute may sleep or reach a daily quota. 100 MB is the upload limit, not a guarantee that large OCR-heavy books can be converted. Images, tables and equations may require manual review.
        </p>
      )}
      {mode === "advanced" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium">Conversion priority
            <select aria-label="EPUB conversion preset" value={preset} disabled={processing || submitted}
              onChange={(e) => setPreset(e.target.value as PdfEpubPreset)} className="mt-1 w-full rounded-lg border border-border bg-background p-3 text-sm">
              {PDF_EPUB_PRESETS.map((x) => <option key={x} value={x}>{x.replaceAll("_", " ").replace(/^./, (c) => c.toUpperCase())}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium">OCR language
            <select aria-label="EPUB OCR language" value={languages} disabled={processing || submitted}
              onChange={(e) => setLanguages(e.target.value as PdfEpubLanguage)} className="mt-1 w-full rounded-lg border border-border bg-background p-3 text-sm">
              {PDF_EPUB_LANGUAGES.map((x) => <option key={x} value={x}>{x === "eng+hin" ? "English + Hindi" : x === "eng" ? "English" : "Hindi"}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium">Book title (optional)
            <input type="text" maxLength={160} disabled={processing || submitted} value={bookTitle}
              onChange={(e) => setBookTitle(e.target.value)} placeholder="Use PDF filename"
              className="mt-1 w-full rounded-lg border border-border bg-background p-3 text-sm" />
          </label>
          <label className="text-sm font-medium">Author (optional)
            <input type="text" maxLength={160} disabled={processing || submitted} value={bookAuthor}
              onChange={(e) => setBookAuthor(e.target.value)} placeholder="Book author"
              className="mt-1 w-full rounded-lg border border-border bg-background p-3 text-sm" />
          </label>
        </div>
      )}

      {!submitted && !processing && (
        <UploadZone accept={ACCEPTED_PDF_TYPES} multiple={false} maxFiles={1} maxSize={maxFile}
          onFilesChange={(selected) => { setFiles(selected); uploadTicketRef.current = null; reset(); }}
          title="Choose a PDF to convert to EPUB"
          description={mode === "advanced" ? "Advanced OCR accepts PDF files up to 100 MB (100,000,000 bytes), using resumable chunks" : "Text-only conversion supports PDF up to 18 MiB locally"} />
      )}

      {files.length > 0 && !submitted && (
        <Button size="lg" variant="gradient" className="w-full" disabled={processing || (mode === "advanced" && serviceReady !== true)}
          onClick={() => { void (mode === "advanced" ? convertAdvanced() : convertBrowser()); }}>
          {processing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <BookOpen className="w-4 h-4 mr-2" />}
          {mode === "advanced" ? "Start advanced conversion" : "Convert locally to EPUB"}
        </Button>
      )}

      {processing && mode === "advanced" && uploadStage && (
        <div className="space-y-2 rounded-xl border border-border bg-card p-4" role="status">
          <p className="text-sm font-semibold">{uploadStage}</p>
          {uploadProgress !== null && (
            <>
              <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-primary transition-all" style={{ width: uploadProgress + "%" }} />
              </div>
              <p className="text-xs text-muted-foreground">{uploadProgress}% uploaded to Cloudflare</p>
            </>
          )}
        </div>
      )}
      {error && uploadTicketRef.current?.upload_mode === "chunked" && !processing && files.length > 0 && !job && (
        <p className="text-xs text-muted-foreground">Select Start advanced conversion again to resume the pieces already uploaded, while the two-hour ticket remains valid.</p>
      )}
      {job && mode === "advanced" && (
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="flex gap-2 items-center">
            {job.status === "completed" ? <CheckCircle2 className="h-5 w-5 text-green-600" /> :
             job.status === "failed" || job.status === "cancelled" ? <AlertCircle className="h-5 w-5 text-red-500" /> :
             <Clock className="h-5 w-5 text-primary" />}
            <h3 className="font-semibold">{statusText}</h3>
          </div>
          <div role="progressbar" aria-label="Conversion progress" aria-valuenow={normalizeJobProgress(job.progress_percent)}
            aria-valuemin={0} aria-valuemax={100} className="h-2.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary transition-all duration-500" style={{ width: normalizeJobProgress(job.progress_percent) + "%" }}/>
          </div>
          <p className="text-sm text-muted-foreground">{normalizeJobProgress(job.progress_percent)}% · Attempts: {job.attempts ?? 0} · Job ID: <span className="break-all font-mono">{job.job_id}</span></p>
          {elapsedPolling && <p className="text-xs text-amber-700">Automatic status polling stopped. Try the job status refresh below.</p>}
          {job.status === "completed" && (
            <Button variant="gradient" size="lg" className="w-full" disabled={downloading} onClick={() => { void downloadAdvanced(); }}>
              {downloading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
              Download enhanced EPUB
            </Button>
          )}
          {["queued", "running"].includes(job.status) && (
            <Button variant="outline" size="sm" onClick={() => { void cancelJob(); }}><XCircle className="w-4 h-4 mr-1" />Cancel job</Button>
          )}
          {!processing && job.status !== "completed" && (
            <Button variant="outline" size="sm" onClick={async () => {
              setError("");
              try {
                const r = await fetch("/api/pdf-epub/jobs/" + job.job_id, { cache: "no-store" });
                if (!r.ok) throw new Error(await readError(r));
                const next = await r.json() as PdfEpubJob;
                setJob(next);
                if (next.status === "completed") await fetchReport(next.job_id);
              } catch (e) { setError(e instanceof Error ? e.message : "Status is unavailable."); }
            }}>Refresh job status</Button>
          )}
          {report && (
            <div className="space-y-2 rounded-xl border border-border p-3 text-sm">
              <h4 className="font-semibold flex items-center gap-2"><FileText className="w-4 h-4" />Conversion report</h4>
              <p>Pages: {report.pages ?? "—"} · Native text: {report.native_pages ?? "—"} · OCR: {report.ocr_pages ?? "—"} · Embedded images: {report.image_assets ?? "—"}</p>
              <p className="text-muted-foreground">EPUB size: {typeof report.epub_bytes === "number" ? formatFileSize(report.epub_bytes) : "—"} · Validation: {report.validation || "Not reported"}</p>
              {!!report.warnings?.length && <div><p className="font-medium">Review warnings:</p>
                <ul className="list-disc pl-5">{report.warnings.slice(0, 15).map((w, i) => <li key={i}>{w}</li>)}</ul>
              </div>}
            </div>
          )}
        </motion.section>
      )}

      {result && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-green-200 bg-green-50 p-5 dark:border-green-900 dark:bg-green-950/20">
          <p className="mb-3 font-semibold text-green-700 dark:text-green-400">Browser conversion completed · {formatFileSize(result.blob.size)}</p>
          <Button onClick={() => downloadBlob(result.blob, result.name)} variant="gradient" size="lg" className="w-full">
            <Download className="w-4 h-4 mr-2" />Download EPUB
          </Button>
        </motion.div>
      )}

      {error && <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/20 dark:text-red-400">{error}</div>}
      {(submitted || result) && !processing && (
        <Button variant="outline" size="sm" onClick={() => { currentJobId.current = null; reset(); setFiles([]); }}>
          Start a new conversion
        </Button>
      )}
      <p className="text-xs text-muted-foreground">
        EPUB is a reflowable format; appearance can differ from PDF. Validate chapter order, equations, languages, tables and pictures before distribution.
      </p>
    </div>
  );
}
