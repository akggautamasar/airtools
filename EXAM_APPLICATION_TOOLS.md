# Custom Photo, Signature & Thumb Resizer

AirTools' Exam Application Tools category is a **general image-resize workspace**. There are no agency-specific, year-specific, notice-specific, or default "official" preset requirements in the editor.

## Workflow
1. Choose a file type (Photo, Signature, Thumb impression, Declaration or Document PDF); upload a JPEG, PNG or WebP image.
2. The editor reads its original pixel width and height and populates both fields automatically. Select **By Size** for user-entered width/height or **As Percentage** for a percentage slider; aspect ratio lock is enabled by default in Size mode. Unlock to choose independent width and height.
3. Fit entire image (pad with white where aspect differs) is the default, especially useful for signatures/thumb scans. Users can choose Fill (crop) with zoom and horizontal/vertical position sliders, or Stretch (which may distort).
4. Optional maximum KB and optional advanced minimum KB; output format Original, JPG, PNG or WebP. On image export, the program tries progressively lower JPEG/WebP qualities to meet the limit while preserving output pixels; PNG often cannot meet a small KB cap, in which case an actionable warning appears. The output file is still provided and its actual dimensions, bytes and MIME are validated.
5. The right panel previews the resized image and shows original dimensions → requested dimensions. Export produces a downloadable file and tracks it in the user's in-memory multi-file ZIP kit.
6. Optional accepted/rejected checklist, without any automated government approval claim.
7. Document mode converts one uploaded scanned image into a single-page A4 PDF. Source PDF uploads are a separate tool.

## Limits and caveats
- Browser-only processing, no server/cloud upload, payment service or account registration. Source image up to 15 MiB and 28 MP; output pixels bounded by 20–4000 each and 16 MP total. KB limits are in 1024-byte increments, user-configurable (1–5000 KB max).
- Original EXIF metadata and DPI are not guaranteed to survive canvas export; a chosen pixel size is NOT a certified DPI result.
- A target maximum cannot always be achieved by changing JPEG/WebP quality at fixed dimensions, and PNG may remain too large. The UI shows when actual output is out of range.
- Never promise recruitment website acceptance. Users enter requirements taken from their own current portal. Do not alter protected identification details, generate handwriting/fingerprints or circumvent compulsory live-camera capture.
- UX design is inspired by the familiar layout and workflow of ImageResizer.com/resize/editor (By Size, As Percentage, aspect ratio lock, optional KB target and format picker); this is an independently implemented AirTools component with its own layout and code.
