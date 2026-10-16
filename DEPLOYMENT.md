# AirTools deployment and validation

The main application is the existing **Next.js 16 / React 19 / TypeScript** project. It is hosted through Vercel; **production access and deployment were not verified** during this change.

## Local
```bash
git clone https://github.com/akggautamasar/airtools.git
cd airtools
npm ci
node --experimental-strip-types --test tests/*.test.mjs
npx tsc --noEmit
npm run lint
npm run build
npm run dev
```
Note: tests and full build require dependencies/network access. A GitHub Actions workflow runs these commands on pull requests; verify its result before merging.

## Vercel frontend
1. In Vercel, verify the connected GitHub repository, production branch, build command (`npm run build`) and output settings.
2. Set `NEXT_PUBLIC_SITE_URL=https://airtools.vercel.app` (or an actually configured custom domain).
3. If using the existing upscaler, set `NEXT_PUBLIC_UPSCALE_API_URL` to the **verified deployed Worker** URL after reviewing `SERVICES.md`.
4. Keep provider credentials in Vercel Environment Variables or Cloudflare secret stores; never put them in `NEXT_PUBLIC_*` or commit them.
5. Deploy a preview branch, smoke test tool routes/downloads, then merge only after CI and output-integrity tests.
6. Roll back via Vercel → Deployments → previous known-good deployment → Promote/Redeploy.

## Existing Cloudflare Worker
Source: `workers/upscale-image.js`. This milestone does not modify/deploy it. Before a new Worker deployment, mitigate SSRF from user-supplied URLs, request abuse and unrestricted CORS; inspect commercial use permissions for the upstream inference provider.

```bash
npm install -g wrangler
wrangler login
wrangler deploy workers/upscale-image.js --name YOUR_EXISTING_WORKER_NAME --compatibility-date 2026-10-16
```
Use your real Worker name, not a fabricated URL. Verify HTTP status, output image type and dimensions. Rollback through Cloudflare deployment history. Monitor requests/CPU and third-party expenses.

## Functional checks after deployment
- PDF optimizer: tiny PDF, image-heavy PDF, corrupt PDF, encrypted PDF; verify page count and size, and confirm no false reductions.
- ZIP extraction: regular nested archive, oversized input, 101 entries, path traversal, excessive inflation, empty ZIP.
- Existing PDF, ebook, image and text processors: validate actual file signatures and format fidelity, not only successful HTTP responses.
- Confirm homepage links, redirects, sitemap/robots, accessible interaction and mobile layout.

The pull request is a safe review milestone, **not proof** that the live website changed.

## New browser tools (follow-up)
Nine routes require no additional environment variables, accounts or processing services. Run CI and test CSV/JSON round trips, PDF metadata, image dimensions, SHA-256 against a known checksum, signatures, URL encoding, timestamp edge cases and text differences. Uploaded files for these tools are processed in the browser.
