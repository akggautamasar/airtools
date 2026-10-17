# Exam Application Tools — requirements, evidence and limitations (17 October 2026)

AirTools now has a dedicated category at `/tools?category=exam`, with a reusable client-side processor on eight URLs.

## Features
- Prepare *original* photograph, signature, thumb impression, handwritten declaration and scanned certificate image (converted to A4 PDF).
- Choose notice-labeled example presets (not universal) or edit width/height pixels, image output format, minimum/maximum KiB, manual crop scale/position and image compression.
- For handwriting and thumb impressions, maintain aspect ratio over white paper; optional brightening of nearly-white scanned paper; no AI re-creation, signature generation or image forgery.
- JPEG/WebP compression search tries multiple encoder qualities; PNG size optimization is limited to the browser encoder. Impossible file-size ranges are flagged rather than reported as passing.
- Technical output validation for bytes, MIME and pixels (A4 document PDF checks maximum size). Optional local heuristic brightness, contrast and near-edge dark marks. This is NOT a blur/face biometric certification or government portal validation.
- Contextual good/bad examples in text, plus four manual checklist confirmations.
- Build single-candidate ZIP containing different prepared file types. No uploads to third-party AI models, cloud storage or servers; source and output stay in browser memory.
- Limits: source JPEG/PNG/WebP <= 15 MiB / <= 28 megapixels; target pixel width/height 20–4000; max target 3000 KiB; source documents are images, NOT existing PDFs.

## Examples grounded in particular notices
- RRB CEN 09/2025 Group-D FAQ: **photo JPEG 40–70 KB, signature JPEG 30–70 KB, minimum 100 DPI**. https://www.rrbcdg.gov.in/uploads/2025/09-LVL1/092025-FAQs.pdf
- RRB CEN 02/2025 Technician: scanned signature **JPEG 30–49 KB, at least 140×60 px, 100 DPI scan**, genuine black running cursive on white. https://www.rrbcdg.gov.in/uploads/2025/02-TECH/022025-CEN.pdf
- IBPS-hosted 2025/26 NABF recruitment upload instructions: **signature 140×60 preferred, 10–20 KB; thumb 240×240 preferred, 20–50 KB; declaration 800×400 preferred, 50–100 KB**. Those are specific to the cited registration, NOT all IBPS recruitment processes. https://ibpsreg.ibps.in/nabfdsadec25/
- SSC CHSL 2024 historical notice: signature **10–20 KB JPEG, about 4×2 cm**; *live photo capture* required. Do not replace a live capture with edited photo. https://ssc.gov.in/api/attachment/uploads/masterData/NoticeBoards/Notice%20of%20CHSLE%202024_05_04_24.pdf
- These are dated reference templates. Recruitment bodies frequently change upload procedures and exact file limits, and a particular applicant portal is authoritative. Where source specifies physical dimensions or a minimum only, working pixel dimensions in our tool are explicitly labeled *editable, not official*.

## What is not provided
- No guarantee of acceptance, no official endorsement, no identity/biometric verification, no artificial signatures/handwriting/thumb impressions, no alteration of identity features, no ability to override required in-app live photo capture.
- A cropped/resized image does not carry certified 100/200/300 DPI metadata merely because its dimensions are set; inspect original scanner DPI and the portal requirements separately.
- Not all JPEG encoders can achieve a narrow min-max size range without lossy degradation. Visual legibility must be reviewed by candidate.
- PDFs with multiple existing pages are out of scope for the A4 certificate tool; use PDF processor routes.
