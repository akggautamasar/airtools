# AirTools changelog

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
