# AirTools research and architecture — 2026-10-16

## Verified sources and competitor comparison (focused initial pass)
| Product | Observed workflow / positioning | Opportunity for AirTools | Source |
| --- | --- | --- | --- |
| PDF24 Tools | Broad categorized PDF directory; split/assemble support page-level operations; online jobs are processed on their servers | Honest client-processing distinction; good page organizers | https://tools.pdf24.org/en/all-tools and https://tools.pdf24.org/en/assemble-pdf |
| PDF24 Compress | Exposes real DPI, image-quality and other compression controls | Do not display controls unsupported by the engine | https://tools.pdf24.org/en/compress-pdf |
| iLovePDF | Cloud document workflows, selectable files and temporary download links | Integrate straightforward multi-file workflows with clear retention | https://www.ilovepdf.com/help/documentation |
| Remaining products | 11zon, Smallpdf, Sejda, Acrobat Online, CloudConvert, Convertio, TinyPNG, Squoosh, Photopea, Canva and others | **Research pending**; no unsupported comparison or pricing claims | Verify primary documentation before feature selection |

## Verified platform constraints
- **Vercel Functions:** request and response payloads limited to **4.5 MB**; avoid proxying large uploads. Source: https://vercel.com/docs/functions/limitations
- **Cloudflare Workers Free:** **100,000 requests/day, 10ms CPU/request and 128 MB memory** per published limits (Oct 8, 2026). Not appropriate for heavy OCR/FFmpeg/native conversion. Source: https://developers.cloudflare.com/workers/platform/limits/
- Provider free tiers and prices change. Free does not mean unlimited or safe for commercial use.

## Recommended architecture
1. Keep Next.js frontend deployed to Vercel and preserve established public routes.
2. Use Web Workers, PDF libraries and browser-native APIs for lightweight PDF/image/ZIP operations, with explicit memory budgets.
3. Keep Cloudflare Workers for validation/orchestration **only** where runtime budgets allow. Require auth/abuse protection on services that invoke paid inference.
4. Use dedicated container services for high-fidelity office conversion (LibreOffice), complex OCR and media processing **only after** quotas, deployment and privacy are specified.
5. Introduce temporary storage, signed URLs, jobs and queues only for concrete large-file asynchronous workloads; define lifecycle and cleanup first.

## Prioritized roadmap
1. **Immediate:** remove misleading UI claims, unsafe ZIP patterns and ineffective compression settings; add unit/CI validation (this milestone).
2. **Next:** test every existing route with actual representative outputs and error files; classify WORKING/BROKEN accurately.
3. **Then:** improve true PDF image compression, accurate EPUB/MOBI formats, image batch workflows, accessible previews, and per-tool privacy notices.
4. **Later:** benchmark and deploy isolated high-fidelity document/OCR conversions, with storage expiration and usage limits.
5. **Longer term:** workflows, favorites, deeper search, performance, SEO for genuinely working routes, and mobile/browser QA.

Security: reject malicious archives, validate MIME/signatures, avoid exposing secrets, do not promise output integrity from status codes alone. External inference must disclose where files go.
