# AirTools: Advanced PDF to EPUB integration

## Existing services
- Source: https://github.com/akggautamasar/airpdftoepub
- API: https://pdfepub-edge.worksbeyondworks.workers.dev
- Convert: POST /v1/convert with raw PDF, authenticated server-side.
- Jobs: GET /v1/jobs/{id}, DELETE /v1/jobs/{id}, GET /v1/jobs/{id}/report and /download.
- Render processing service: pdfepub-compute.
- Temporary storage: Cloudflare Workers KV (about 24 h) and D1 job state.

## AirTools
- Page: /tools/pdf-to-epub (existing).
- POST /api/pdf-epub receives raw PDF bytes up to **4,000,000 bytes**, validates options and PDF magic bytes and forwards them to the Cloudflare API.
- GET /api/pdf-epub responds with deployment feature availability.
- /api/pdf-epub/jobs/{id} supports job status and cancellation.
- /api/pdf-epub/jobs/{id}/report and /download return report and streamed EPUB.
- Secure same-site HTTP-only session cookie ties the single active browser job to its ID. A second concurrent upload in the same browser will replace that cookie, so the initial UI runs one job at a time.
- Server secrets: PDFEPUB_API_KEY and PDFEPUB_API_ENDPOINT (NOT NEXT_PUBLIC_*). Do not put API keys in source.
- The API key is a dedicated Cloudflare D1 client quota, separate from other apps.
- Cloud conversion uploads personal PDF material to our temporary cloud storage. Browser-only fallback keeps material locally and does NOT OCR, preserve images, or promise faithful textbook layout.
- No native MOBI or AZW3 files generated.
- Conversion completion is asynchronous. Free-tier capacity, quotas and latency are not guaranteed.

## Security / production follow-up
- Apply abuse throttling and bot protection before allowing unrestricted public jobs. A D1 client cap of 12 jobs per day is set for the AirTools account, but this is **not** per visitor and can be exhausted or abused.
- Prefer Turnstile verification for public users and strict per-IP quotas enforced server-side with a strongly consistent store when budget permits.
- Vercel payload maximum requires capped proxy uploads. Streaming downloads should be confirmed on the deployed host with representative EPUBs.
- Worker's free KV output size and Render CPU/page limits remain constraining. The standalone API can accept a larger PDF with an authenticated client.
- Validate actual EPUB output, OCR and structure with test fixtures; neither a successful build nor a job marked completed guarantees high quality.
- Vercel environment changes require a **new deployment**, not only updating settings.

## Acceptance tests
1. Visit /tools/pdf-to-epub, verify Advanced option availability and fallback.
2. Upload a small native PDF with English text; observe queued/running/completed states and download a valid EPUB.
3. Upload a 1–3 page scanned English/Hindi PDF under 4 MB, verify OCR pages and warning reports.
4. Try invalid PDF/header, bad option and >4 MB upload; confirm local and server rejection.
5. Open status link without job cookie (403), cancel and verify state, retry expired download.
6. Test public endpoint through an authenticated browser and inspect resulting EPUB in an e-reader.

