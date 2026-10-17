# AirTools changelog

## 2026-10-17 — Photo studios
- Upgraded legacy AI Background Remover into an on-device studio with batch cutouts, backdrops, shadows, brush edge cleanup and watermark-free PNG/ZIP exports.
- Added discoverable Background Studio, Batch Background Remover and Product Photo Studio tool entries.
- Added Passport & ID Photo Maker with physical-size presets, manual crop, opportunistic browser face centering, and print-ready PDF sheets (A4/4 × 6 in). No biometric certification, government acceptance guarantee, virtual suit changer or alteration of identity features.
- Background AI engine is third-party AGPL; attribution and source links included. Government source links are displayed for UK and US preset requirements.

## 2026-10-17 — PDF→EPUB 100 MB chunk upload
- Added up to 100,000,000-byte uploads with 5 MiB chunks and a progress indicator.
- Authorized upload tickets are scoped to one file and time-limited; Vercel never receives PDF bytes.
- Client retries individual failed chunks and can resume within the current tab using the original two-hour authorization.
- Backend requires the matching Cloudflare D1 migration, Worker and Render updates; no increased compute allocation or guarantee of successful conversion of huge scanned books.


## 2026-10-17 — Advanced PDF→EPUB integration
- Connected existing `/tools/pdf-to-epub` processor to reusable airpdftoepub Cloudflare/Render conversion API using a server-only bearer credential and HTTP-only job cookie.
- Added preset/language choices, asynchronous job progress, cancel, report and EPUB download.
- Kept in-browser text-only EPUB processing and accurate Kindle label notices.
- Advanced uploads are limited to 4,000,000 bytes because of Vercel request limits. Larger books should use the standalone converter; this is not high-volume hosting.
- Advanced PDFs leave the device and are temporarily stored in Cloudflare KV for approximately 24 hours. Basic processing stays local.
- Conversion service health, background workers and file fidelity must be tested separately with representative files.



## 2026-10-16 — PDF Studio enhancement (feature review)
- Upgraded existing `edit-pdf` Konva editor instead of replacing its annotation processor.
- Added page thumbnails, navigation, reorder/remove/reset, selectable-text search, responsive zoom and fit-width.
- Added 30-step markup undo/redo, selected text size/color editing, keyboard shortcut support and better error handling.
- Added safer PNG/JPEG insertion limits (5 MiB), PDF size/page/pixel limits to protect browser memory.
- Added **Layered export** preserving source PDF content when unmodified, or copying reordered pages when needed. This is *not* secure redaction.
- Added **Flattened export** constructing a new image-only PDF from the visible pages/overlays; source text, links and forms are not copied into output. Quality, searchability and accessibility are reduced.
- Added page-order and canvas text wrapping tests.
- Production deployment status is separate from source integration. Confirm representative PDF sample output and rotated/complex cases before claiming high-fidelity source-text editing.


## 2026-10-16 — Document Consistency Radar
- Added a differentiated local application-record comparison workflow for name, initials, name order, birth date, and parent-name discrepancies.
- Sources: user-selected PDF, DOCX, TXT and image records; selectable PDF/DOCX text suggests values without auto-accepting them. Optional English OCR for image records, using Tesseract language assets.
- Manual confirmation is required; the tool never determines identity equivalence or provides legal advice.
- Reproducible discrepancy statuses, a fictional interactive example, redacted-by-default report exports, bounded file/page limits and unit tests.
- Do not claim the tool is the first of its kind; comparable research tools and specialized prototypes exist.


## 2026-10-16 — Additional browser tools (follow-up PR)
- Added nine implemented routes: CSV to JSON, JSON to CSV, PDF Metadata Viewer, Image Dimensions & Info, File SHA-256 Checksum, File Type Inspector, URL Encoder & Decoder, Unix Timestamp Converter, Text Difference Checker.
- Added bounded CSV and JSON parsing, CSV formula-prefix protection option, file-header signature checks, timestamp parser, and bounded line comparison.
- Added source-based tests and expanded CI to run all unit test files. Tools use local browser APIs; no new paid service or secret needed.
- Replaced incorrect generic FAQ promises about every tool processing locally or preserving output.
- Build/CI status must be verified separately; this changelog is not evidence of live deployment.


## 2026-10-16 — Trust and file-safety foundation (review milestone)
- Removed unverified usage numbers and testimonials from the rendered homepage.
- Adjusted privacy, speed and quality claims to reflect per-tool behavior.
- Made homepage tool preview tiles link to their corresponding tool routes.
- Corrected default site canonical base to the actual Vercel domain.
- Replaced misleading PDF quality control with honest structural PDF optimization; never reports an enlarged PDF as a reduction, retains original on non-reducing rewrites, checks output page count and reports individual failures.
- Added ZIP archive path validation, entry-count/size/ratio preflight, bounded sequential extraction and error feedback.
- Added archive-safety unit tests and pull-request CI workflow.
- Created initial source-derived 74-route inventory and service/research/deployment documentation.
- **Unverified:** full build, real PDF/ZIP output tests, the deployed site, the upscaling third party, container deployment and service limits. Existing services were not redeployed.

## Next
Run CI and representative file tests; fix pre-existing issues separately; audit each processor and remove incompatible format promises.
