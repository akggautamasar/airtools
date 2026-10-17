/** Shared public contract; contains no API keys or server implementation. */
export const PDF_EPUB_PROXY_MAX_BYTES = 4_000_000; // Legacy small-payload proxy.
export const PDF_EPUB_DIRECT_MAX_BYTES = 18 * 1024 * 1024; // Direct browser -> Cloudflare KV (18 MiB). // Leave room below Vercel's 4.5 MB request limit.
export const PDF_EPUB_PRESETS = ["balanced", "maximum_compression", "high_fidelity"] as const;
export type PdfEpubPreset = typeof PDF_EPUB_PRESETS[number];
export const PDF_EPUB_LANGUAGES = ["eng+hin", "eng", "hin"] as const;
export type PdfEpubLanguage = typeof PDF_EPUB_LANGUAGES[number];
export type PdfEpubStatus = "queued" | "running" | "completed" | "failed" | "cancelled" | "expired";
export interface PdfEpubJob {
  job_id: string;
  status: PdfEpubStatus;
  progress_percent?: number;
  attempts?: number;
  expires_at?: string;
  error?: { code?: string; message?: string };
}
export interface PdfEpubReport {
  pages?: number;
  native_pages?: number;
  ocr_pages?: number;
  image_assets?: number;
  quality_preset?: string;
  warnings?: string[];
  original_bytes?: number;
  epub_bytes?: number;
  reduction_percent?: number;
  duration_seconds?: number;
  validation?: string;
}
export const PDF_EPUB_ID_REGEX = /^[a-f\d]{8}-[a-f\d]{4}-[1-8][a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i;
export function validatePdfEpubSettings(preset: string, languages: string): boolean {
  return PDF_EPUB_PRESETS.some((p) => p === preset) && PDF_EPUB_LANGUAGES.some((p) => p === languages);
}
export function normalizeJobProgress(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(100, Math.max(0, Math.floor(n))) : 0;
}
export function isPdfHeader(bytes: Uint8Array): boolean {
  return bytes.length >= 5 && bytes[0] === 37 && bytes[1] === 80 && bytes[2] === 68 && bytes[3] === 70 && bytes[4] === 45;
}
