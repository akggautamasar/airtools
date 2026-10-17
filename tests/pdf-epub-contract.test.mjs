import assert from "node:assert/strict";
import { test } from "node:test";
import { PDF_EPUB_PROXY_MAX_BYTES, PDF_EPUB_DIRECT_MAX_BYTES, PDF_EPUB_ID_REGEX, validatePdfEpubSettings, isPdfHeader, normalizeJobProgress } from "../src/lib/pdf-epub-contract.ts";

test("direct PDF upload bypasses Vercel and supports 18 MiB", () => {
  assert.equal(PDF_EPUB_DIRECT_MAX_BYTES, 18 * 1024 * 1024);
  assert.ok(PDF_EPUB_DIRECT_MAX_BYTES > 18_000_000);
});
test("legacy proxy upload remains below Vercel request limit", () => {
  assert.ok(PDF_EPUB_PROXY_MAX_BYTES < 4_500_000);
  assert.ok(PDF_EPUB_PROXY_MAX_BYTES > 1_000_000);
});
test("validates settings before forwarding to API", () => {
  assert.ok(validatePdfEpubSettings("balanced", "eng+hin"));
  assert.ok(validatePdfEpubSettings("high_fidelity", "hin"));
  assert.equal(validatePdfEpubSettings("bad", "eng"), false);
  assert.equal(validatePdfEpubSettings("balanced", "fra"), false);
});
test("PDF header and status parsing", () => {
  assert.equal(isPdfHeader(new TextEncoder().encode("%PDF-1.7")), true);
  assert.equal(isPdfHeader(new TextEncoder().encode("hello")), false);
  assert.equal(normalizeJobProgress(34.4), 34);
  assert.equal(normalizeJobProgress(200), 100);
  assert.equal(normalizeJobProgress("garbage"), 0);
});
test("accepts only canonical versioned job IDs", () => {
  assert.ok(PDF_EPUB_ID_REGEX.test("65f44baf-4db6-4b67-93be-1f83033cf86a"));
  assert.ok(!PDF_EPUB_ID_REGEX.test("../internal"));
  assert.ok(!PDF_EPUB_ID_REGEX.test("not-a-uuid"));
});
