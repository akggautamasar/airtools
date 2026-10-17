import { NextRequest, NextResponse } from "next/server";
import { PDF_EPUB_DIRECT_MAX_BYTES, PDF_EPUB_ID_REGEX, validatePdfEpubSettings } from "@/lib/pdf-epub-contract";
import { attachJobSession, callEpubApi, epubApiConfigured, epubApiEndpoint, jsonError, parseBackendError, sameSiteRequest, upstreamErrorStatus } from "@/lib/pdf-epub-server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!sameSiteRequest(request)) return jsonError("origin", "Request must come from AirTools.", 403);
  if (!epubApiConfigured()) return jsonError("not_configured", "Advanced PDF conversion is not configured.", 503);
  if (!(request.headers.get("content-type") || "").startsWith("application/json")) {
    return jsonError("media", "Expected JSON upload settings.", 415);
  }
  const length = Number(request.headers.get("content-length"));
  if (!Number.isSafeInteger(length) || length < 2 || length > 2048) {
    return jsonError("length", "Upload settings request is too large.", 413);
  }
  try {
    const payload = await request.json() as Record<string, unknown>;
    const fileBytes = payload.file_bytes;
    const preset = payload.preset;
    const languages = payload.ocr_languages;
    if (!Number.isSafeInteger(fileBytes) || (fileBytes as number) < 5 || (fileBytes as number) > PDF_EPUB_DIRECT_MAX_BYTES) {
      return jsonError("size", "PDF must be 18 MiB or smaller.", 413);
    }
    if (typeof preset !== "string" || typeof languages !== "string" || !validatePdfEpubSettings(preset, languages)) {
      return jsonError("options", "Invalid preset or OCR language.", 422);
    }
    const title = typeof payload.title === "string" ? payload.title.slice(0, 160) : "";
    const author = typeof payload.author === "string" ? payload.author.slice(0, 160) : "";
    const upstream = await callEpubApi("/v1/upload-tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        origin: request.nextUrl.origin, file_bytes: fileBytes,
        preset, ocr_languages: languages, title, author,
      }),
    });
    if (!upstream.ok) return jsonError("upstream", await parseBackendError(upstream), upstreamErrorStatus(upstream.status));
    const ticket = await upstream.json() as { job_id?: string; upload_url?: string; upload_token?: string; expires_at?: string };
    if (!ticket.job_id || !PDF_EPUB_ID_REGEX.test(ticket.job_id) ||
        typeof ticket.upload_token !== "string" || !/^up_[a-f0-9]{64}$/i.test(ticket.upload_token) ||
        typeof ticket.upload_url !== "string") {
      return jsonError("response", "Conversion service returned an invalid upload authorization.", 502);
    }
    const upload = new URL(ticket.upload_url);
    if (upload.origin !== epubApiEndpoint() || upload.pathname !== "/v1/direct-upload" || upload.search || upload.hash) {
      return jsonError("url", "Conversion service returned an unexpected upload destination.", 502);
    }
    const response = NextResponse.json({
      job_id: ticket.job_id, upload_url: ticket.upload_url,
      upload_token: ticket.upload_token, expires_at: ticket.expires_at,
      max_upload_bytes: PDF_EPUB_DIRECT_MAX_BYTES,
    }, { status: 201 });
    response.headers.set("Referrer-Policy", "no-referrer");
    return attachJobSession(response, ticket.job_id);
  } catch {
    return jsonError("unavailable", "Could not issue direct upload authorization. Try again shortly.", 502);
  }
}
