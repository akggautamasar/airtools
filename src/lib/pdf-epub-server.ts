import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { PDF_EPUB_ID_REGEX } from "@/lib/pdf-epub-contract";

const COOKIE_NAME = "airtools_epub_job";
const COOKIE_TTL = 24 * 60 * 60;
const DEFAULT_ENDPOINT = "https://pdfepub-edge.worksbeyondworks.workers.dev";

export function epubApiConfigured(): boolean {
  return !!process.env.PDFEPUB_API_KEY && !!process.env.PDFEPUB_API_KEY.trim();
}

export function epubApiEndpoint(): string {
  const configured = process.env.PDFEPUB_API_ENDPOINT || DEFAULT_ENDPOINT;
  const url = new URL(configured);
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash || url.pathname !== "/"
      || !(url.hostname.endsWith(".workers.dev") || url.hostname === "pdfepub-edge.worksbeyondworks.workers.dev")) {
    throw new Error("Invalid PDFEPUB_API_ENDPOINT server configuration.");
  }
  return url.origin;
}

function signature(message: string): Buffer {
  const key = process.env.PDFEPUB_API_KEY;
  if (!key) throw new Error("PDF EPUB API is not configured.");
  // Domain separation: this token cannot be used as a Worker credential.
  return createHmac("sha256", key).update("airtools-pdfepub-session:v1:" + message).digest();
}

export function attachJobSession(reply: NextResponse, jobId: string): NextResponse {
  const expires = Math.floor(Date.now() / 1000) + COOKIE_TTL;
  const message = jobId + "." + expires;
  reply.cookies.set(COOKIE_NAME, message + "." + signature(message).toString("hex"), {
    httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production",
    path: "/api/pdf-epub", maxAge: COOKIE_TTL,
  });
  reply.headers.set("Cache-Control", "no-store");
  return reply;
}

export function authorizeJob(request: NextRequest, jobId: string): boolean {
  if (!PDF_EPUB_ID_REGEX.test(jobId) || !epubApiConfigured()) return false;
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return false;
  const parsed = /^([a-f\d-]{36})\.(\d{10})\.([0-9a-f]{64})$/i.exec(token);
  if (!parsed || parsed[1] !== jobId || Number(parsed[2]) < Math.floor(Date.now() / 1000)) return false;
  const expected = signature(parsed[1] + "." + parsed[2]);
  return timingSafeEqual(expected, Buffer.from(parsed[3], "hex"));
}

export function sameSiteRequest(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try { return new URL(origin).origin === request.nextUrl.origin; }
  catch { return false; }
}

export function jsonError(code: string, message: string, status: number): NextResponse {
  return NextResponse.json({ error: { code, message } }, {
    status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}

export async function callEpubApi(path: string, options: RequestInit = {}): Promise<Response> {
  if (!epubApiConfigured()) throw new Error("PDF EPUB service credentials are not configured.");
  if (!path.startsWith("/v1/") || path.includes("..") || path.includes("//")) {
    throw new Error("Invalid API route.");
  }
  const headers = new Headers(options.headers);
  headers.set("Authorization", "Bearer " + process.env.PDFEPUB_API_KEY!.trim());
  return fetch(epubApiEndpoint() + path, {
    ...options, headers, cache: "no-store", signal: options.signal || AbortSignal.timeout(40000),
  });
}

export async function parseBackendError(res: Response): Promise<string> {
  const json = await res.json().catch(() => null) as { error?: { message?: string } } | null;
  return (json?.error?.message || "Conversion service returned HTTP " + res.status).slice(0, 280);
}

export function upstreamErrorStatus(status: number): number {
  if ([400, 401, 403, 404, 409, 410, 411, 413, 415, 422, 429, 503].includes(status)) {
    return status === 401 || status === 403 ? 503 : status;
  }
  return 502;
}
