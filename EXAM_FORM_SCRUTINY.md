# AirTools — Pre-Submission Exam Form Scrutiny

**Route:** `/tools/exam-form-scrutiny`.

## Purpose
Candidate saves the **pre-final-submit application preview** as PDF, saved HTML or readable screenshot. They upload supporting documents (up to 12), categorise and manually confirm extracted details, compare evidence, and download an optionally redacted scrutiny report.

A response status is one of:
- **Matched (green):** both the application value AND a relevant supporting document value have been confirmed by the user and normalise to the same value.
- **Mismatch (red):** confirmed values differ. Candidates should verify originals and official rules; this is not a legal finding.
- **Review required (amber):** multiple source documents conflict, or an initial/name-order difference needs human verification.
- **Not checked (gray):** absent form field, absent relevant document, unreadable field, manual-only checklist field, or unconfirmed record. No false green.

## Available
- PDF selectable-text extraction, user-saved HTML (parsed inertly, active markup removed), TXT, DOCX, JPG, PNG, WEBP.
- Optional local English OCR of images and first three scanned PDF pages with Tesseract. OCR language assets may be fetched when first used.
- Candidate name, DOB, parent names, gender, reservation category, masked Aadhaar last 4, Class 10/12 examination data, diploma, graduation, domicile, EWS/PwD claims and manual email/mobile reminder.
- Editable extracted values, per-document evidence class, manual verification gates, consistent red/green/amber/gray per-field report.
- Privacy-first TXT and JSON report downloads: field values and filenames omitted by default; only explicit opt-in adds values; full Aadhaar number is NEVER included in reports.
- No account, no stored uploads or server-side document processing. All text and comparisons exist in the current browser session.
- Before-final-submit manual checklist for subject eligibility, cut-off date, category, post preferences, upload quality and fees.

## Critical limits
- **Not official** and not a legal eligibility, identity authenticity, certificate validity or application-acceptance determination.
- Extraction is heuristic label-led English parsing, not a general-purpose AI judge. Labels/tables differ across agencies and languages; review/edit is mandatory. Scanned PDFs may require OCR. Hindi OCR not promised.
- Saved HTML may not include fields populated dynamically; use Print → Save as PDF with legible displayed fields when possible. MHTML is not supported; web pages are not executed.
- PDFs read up to 15 pages, files up to 12 MiB, up to 12 supporting records. Optional OCR reads first 3 pages only.
- Category documentation depends on the current recruitment notice; a social category cannot be inferred from a name or Aadhaar. Class 10 DOB requirements are notice-specific.
- Do not upload Aadhaar if unnecessary; prefer a Masked Aadhaar. Never upload OTPs, credentials or confidential third-party records without authorisation.
- No invented pass/acceptance probability, and no unconfirmed extraction receives a green status.
- Report exports redact personal information by default. Local files are not sent to AirTools; third-party OCR library can fetch language assets.
- Manual browser testing remains essential, especially actual government PDF layouts, saved HTML and phone browsers.

## Suggested next improvements
- Better layout-aware PDF parsing with bounding boxes / two-column form support.
- More languages via explicitly configured opt-in OCR packs.
- Candidate-defined checklist and notice constraints/cut-off-aware checks based only on verified notices.
- Support rules for educational qualifications and verified document issuers, when legal permission and high-quality datasets exist.
