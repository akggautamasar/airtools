# AirTools Bare Thumb Photo Ink Styling

Routes:
- `/tools/thumb-photo-to-ink` (Image Tools, Image Toolbox > Popular)
- `/tools/exam-thumb-photo-ink` (Exam Tools, Image Toolbox > Exam & ID sizes)

The existing `/tools/exam-thumb-impression` remains the editor for **genuine ink impressions**.

## What works
- Local-only JPEG/PNG/WebP bare-thumb photo upload (15 MiB/30 MP input limits).
- User-positioned rectangular crop: pan, zoom, white background.
- Non-generative adaptive local contrast for image detail already visible in the photo.
- Black, blue and grayscale ink-style outputs.
- Custom 50–2000 px output dimensions (up to 4 megapixels).
- JPEG/PNG export with optional JPEG iterative quality compression for a user-defined maximum KB.
- Optional filename override; otherwise the uploaded basename gets `-AirTools` and the resulting extension.
- Live preview, actual byte-size reporting, low-detail warning, and download.

## Limitations and privacy
- A regular photo of skin rarely contains enough true ridge resolution to produce a useful authentic thumbprint. This tool **does not** synthesize, reconstruct, detect, verify, or authenticate biometric ridge patterns.
- The processing algorithm may emphasize pores, shadows, folds or compression noise in addition to visible skin detail; there is no claim of agency acceptance.
- A prepared ink-style illustration **is not** a genuine ink impression or fingerprint scan.
- Uploaded photos are processed in-browser; the processor makes no network call. The tool has no account, photo-storage or cloud dependency.
- Image upload is not assumed to meet any specific recruitment portal's file or biometric requirements.

## Validation
Run `node --experimental-strip-types --test tests/thumb-photo-ink.test.mjs` and `npm run build`.
Manually check live preview and downloads on desktop and Android Chrome with actual thumb photos; small output pixels and strict KB targets require special attention.
