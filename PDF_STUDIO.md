# AirTools PDF Studio — editor notes

## Motivation and competitor comparison
- [Sejda PDF Editor](https://www.sejda.com/pdf-editor): add text, edit existing text, upload/draw signatures, images, create/fill forms, links, whiteout and annotations.
- [PDFgear Online PDF Editor](https://www.pdfgear.com/edit-pdf/): annotates and reorganizes pages in a browser; its own comparison says direct existing-text editing is only supported in the desktop version.
- User discussions emphasize two major frustrations: replacement text altering fonts/layout, and unsafe white rectangles mistaken for secure redaction.
- AirTools cannot currently promise font-preserving source-stream text editing or form authoring. Do not imply parity with Sejda in these areas.

## How to use
1. Open `/tools/edit-pdf` and upload a supported PDF (20 MiB / 30 pages / 24 million preview pixels maximum).
2. Use toolbar tools to add/select text, image, highlight, shape, draw or cover a region; inspect thumbnails to select, move or remove pages.
3. Search selectable PDF text and jump to matching pages. Scanned pages without text layers are not searchable.
4. Use undo/redo for *markups*, not page-order changes. Restore page order using the dedicated control.
5. Select an output:
   - **Layered PDF:** generally retains source content and adds drawings on top. Covering old text only hides it visually, never securely removes it. Reordering source pages can affect interactive form behavior.
   - **Flattened image-only PDF:** reconstructs pages as JPEG images in a new PDF. Source text, links, interactive forms and source metadata are not transferred. This can be useful for visual concealment, but requires careful visual review and is not a certification of redaction for legal proceedings.
6. Validate page count and download. Keep the original source copy.

## Implementation
- Next.js dynamic processor `src/components/tools/processors/edit-pdf.tsx` with Konva canvas and PDF.js preview.
- PDF-lib performs layered page annotation and PDF construction. Flattening paints background and edits into canvas, embeds JPEG page images, never imports original PDF pages.
- No server, upload endpoint, API key, storage account, or billable inference required. All uploaded PDF processing happens in the browser.
- Rasterization and Unicode text may depend on available browser/system fonts; added text in layered mode uses standard Helvetica and has narrower language support.
- Unit tests: `tests/pdf-editor-enhancements.test.mjs`, existing tests. Run `node --experimental-strip-types --test tests/*.test.mjs`, `npx tsc --noEmit`, `npm run lint`, `npm run build`.

## Known limitations
- No true in-place text-stream rewriting, full form designer, embedded PDF signature certificates or full accessibility preservation.
- Rotated source PDF with new overlays requires flattened export to avoid misalignment.
- Flattened export removes searchable text and will not retain links or form fields.
- ZIP/PDF tooling elsewhere in AirTools does not affect this editor.
- Very large PDFs are blocked to avoid exhausting mobile memory.
- Preview crop/image text layer may have inaccuracies for unusual fonts and visual transforms.

## Next quality priorities
Add browser-level end-to-end sample fixtures (simple vector PDF, multi-page reorder, scanned PDF, inserted signature image, Unicode, rotated source PDF), then audit complex forms and annotations before broadening limits.
