# AirTools changelog

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
