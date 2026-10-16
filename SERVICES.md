# Processing services — source audit, 2026-10-16

## Existing image upscale Worker
- **Location:** `workers/upscale-image.js` (existing source retained without destructive changes).
- **Hosting:** Cloudflare Workers; intended for lightweight request handling.
- **Frontend:** `src/components/tools/processors/upscale-image.tsx` sends a base64 data URL to `NEXT_PUBLIC_UPSCALE_API_URL`; the source also contains a hardcoded fallback Worker URL. This is a public endpoint, **not verified online**.
- **Upstream:** Worker sends images to `https://ai-services.visual-paradigm.com/api/super-resolution/file`. A third-party service receives the image; its licensing, retention, availability, commercial permission and costs require verification.
- **Known risks:** Worker source supports arbitrary HTTP image URLs (SSRF risk), broad CORS, large base64 bodies and missing request authentication/rate limits; result MIME and dimensions should be validated before client download. Restrict allowed inputs, enforce image signatures/sizes, disable unauthenticated URL fetch, add allowlisted origins/rate controls and provider timeout tests before deploying updates.
- **Testing:** not run; live Worker health and actual image enhancement are **unverified**.
- **Deployment:** install Wrangler, log in to an authorized Cloudflare account, review the Worker security requirements, then deploy deliberately: `npx wrangler deploy workers/upscale-image.js --name <your-existing-worker-name> --compatibility-date 2026-10-16`. Update `NEXT_PUBLIC_UPSCALE_API_URL` on Vercel only after verifying the resulting endpoint and CORS. Do **not** copy secrets into source or replace a running Worker without a tested rollback.
- **Rollback:** restore the previous Cloudflare deployment in Dashboard → Workers & Pages → selected Worker → Deployments.

## Existing background-removal service
- **Location:** `services/remove-bg/` with `Dockerfile`, `app.py`, `requirements.txt`, `README.md`.
- **Hosting:** Docker-compatible container platform (deployment target/production URL must be confirmed).
- **Status:** source available; no external deployment created and no live response verified in this session.
- **Setup:** follow its checked-in README and configure the actual service URL/secret names in the relevant app integration. Confirm input bounds, content type, auth, CORS and failure behavior.
- **Costs:** container CPU/memory and possible ML inference charges are provider-specific; do not assume a permanent free tier.
- **Rollback:** redeploy the last known-good container image; restore previous environment variables.

## New services
None introduced in this milestone. New browser-side ZIP validation and PDF structural optimization need no new Worker, database or object storage.

## Required production checks
Image response signature/dimensions, authentication, origin restrictions, request caps, service-specific retention, external provider legal terms, and monitoring. Do not advertise a verified zero-retention guarantee without evidence.
