import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { PDF_EPUB_PROXY_MAX_BYTES, PDF_EPUB_DIRECT_MAX_BYTES, isPdfHeader, validatePdfEpubSettings } from "@/lib/pdf-epub-contract";
import {
  attachJobSession, callEpubApi, epubApiConfigured,
  jsonError, parseBackendError, sameSiteRequest, upstreamErrorStatus,
} from "@/lib/pdf-epub-server";

export const runtime = "nodejs";
export const maxDuration = 60;

export function GET() {
  return NextResponse.json({
    available: epubApiConfigured(),
    max_upload_bytes: PDF_EPUB_DIRECT_MAX_BYTES,
    method: "short_lived_direct_upload_token",
    storage: "Cloudflare KV (24-hour temporary retention)",
    upload: "direct_chunks_for_large_pdf",
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  if (!sameSiteRequest(request)) return jsonError("origin", "Request must originate from this website.", 403);
  if (!epubApiConfigured()) return jsonError("not_configured", "Advanced conversion is unavailable. Use Basic browser conversion.", 503);
  if ((request.headers.get("content-type") || "").split(";")[0].toLowerCase() !== "application/pdf") {
    return jsonError("invalid_media", "Upload raw PDF bytes.", 415);
  }
  const length = Number(request.headers.get("content-length"));
  if (!Number.isSafeInteger(length) || length < 5 || length > PDF_EPUB_PROXY_MAX_BYTES) {
    return jsonError("invalid_size", "PDF must be 4 MB (4,000,000 bytes) or smaller.", 413);
  }
  const url = new URL(request.url);
  const preset = url.searchParams.get("preset") || "balanced";
  const languages = url.searchParams.get("ocr_languages") || "eng+hin";
  if (!validatePdfEpubSettings(preset, languages)) return jsonError("invalid_options", "Unsupported preset or OCR language.", 422);
  const title = (url.searchParams.get("title") || "").trim().slice(0, 160);
  const author = (url.searchParams.get("author") || "").trim().slice(0, 160);
  try {
    const bytes = new Uint8Array(await request.arrayBuffer());
    if (bytes.byteLength !== length || !isPdfHeader(bytes)) {
      return jsonError("invalid_pdf", "Invalid PDF or upload length.", 422);
    }
    const args = new URLSearchParams({ preset, ocr_languages: languages });
    if (title) args.set("title", title);
    if (author) args.set("author", author);
    const upstream = await callEpubApi("/v1/convert?" + args.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(bytes.length),
        "Idempotency-Key": randomUUID(),
      },
      body: bytes,
    });
    if (!upstream.ok) {
      return jsonError("upstream", await parseBackendError(upstream), upstreamErrorStatus(upstream.status));
    }
    const job = await upstream.json() as { job_id?: string; status?: string };
    if (!job.job_id || !/^[a-f\d-]{36}$/i.test(job.job_id)) {
      return jsonError("invalid_response", "Conversion service did not return a valid job ID.", 502);
    }
    return attachJobSession(NextResponse.json(job, { status: 202 }), job.job_id);
  } catch {
    return jsonError("unreachable", "Advanced converter could not be reached. Try again later or choose browser conversion.", 502);
  }
}
