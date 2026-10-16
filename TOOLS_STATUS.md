# AirTools tool audit — 2026-10-16

**Scope:** source-level audit of the default branch before this PR plus its focused fixes. This table does **not** certify tools as working. No representative end-to-end outputs could be verified in this session; the public Vercel page was inaccessible through the available web browser. Test status is therefore NOT RUN for every tool.

The initial registry defines **74 tool routes** (32 PDF, 7 eBook, 24 image, 11 utility). All have explicit mappings in `dynamic-tool-processor.tsx`; mapping alone does not prove a processor works. Shared components and existing routing are preserved.

**Status meanings:** WORKING = actual successful representative output verified; PARTIAL = implementation exists but feature/fidelity/test gaps remain; UI ONLY = interface without real operation; BROKEN = demonstrated incorrect output/failure; PLANNED = not implemented; BLOCKED = depends on an unverified/unavailable backend or required authorization. PARTIAL is a conservative **audit status**, not proof of working behavior.

**Next verification:** run clean `npm ci`, `npx tsc --noEmit`, `npm run lint`, `npm run build`; then test uploads/output validity for each route, including PDF page counts, format signatures, archives, invalid inputs and mobile usability. Reclassify each row only with evidence.

| Tool | Route | Category | Source processor | Status | Claimed source format family (verify per tool) | Limits | Test | Findings / required follow-up |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Compress PDF | `/tools/compress-pdf` | pdf | CompressPDF | PARTIAL | PDF / tool-specific DOCX, XLSX, PPTX, image or TXT | Not fully audited | **NOT RUN** | Structural PDF rewrite only; image quality not altered. Code change awaiting CI/output verification. |
| Merge PDF | `/tools/merge-pdf` | pdf | MergePDF | PARTIAL | PDF / tool-specific DOCX, XLSX, PPTX, image or TXT | Not fully audited | **NOT RUN** | Code route exists; representative input/output and error cases not verified. |
| Merge PDF & Image | `/tools/merge-pdf-image` | pdf | MergePDF | PARTIAL | PDF / tool-specific DOCX, XLSX, PPTX, image or TXT | Not fully audited | **NOT RUN** | Code route exists; representative input/output and error cases not verified. |
| Split PDF | `/tools/split-pdf` | pdf | SplitPDF | PARTIAL | PDF / tool-specific DOCX, XLSX, PPTX, image or TXT | Not fully audited | **NOT RUN** | Code route exists; representative input/output and error cases not verified. |
| Crop PDF | `/tools/crop-pdf` | pdf | CropPDF | PARTIAL | PDF / tool-specific DOCX, XLSX, PPTX, image or TXT | Not fully audited | **NOT RUN** | Code route exists; representative input/output and error cases not verified. |
| Organize PDF | `/tools/organize-pdf` | pdf | OrganizePDF | PARTIAL | PDF / tool-specific DOCX, XLSX, PPTX, image or TXT | Not fully audited | **NOT RUN** | Code route exists; representative input/output and error cases not verified. |
| Rotate PDF | `/tools/rotate-pdf` | pdf | RotatePDF | PARTIAL | PDF / tool-specific DOCX, XLSX, PPTX, image or TXT | Not fully audited | **NOT RUN** | Code route exists; representative input/output and error cases not verified. |
| Remove Pages | `/tools/remove-pages` | pdf | SelectPagesPDF | PARTIAL | PDF / tool-specific DOCX, XLSX, PPTX, image or TXT | Not fully audited | **NOT RUN** | Code route exists; representative input/output and error cases not verified. |
| Extract PDF | `/tools/extract-pdf` | pdf | SelectPagesPDF | PARTIAL | PDF / tool-specific DOCX, XLSX, PPTX, image or TXT | Not fully audited | **NOT RUN** | Code route exists; representative input/output and error cases not verified. |
| Extract Images | `/tools/extract-images` | pdf | ExtractImagesPDF | PARTIAL | PDF / tool-specific DOCX, XLSX, PPTX, image or TXT | Not fully audited | **NOT RUN** | Code route exists; representative input/output and error cases not verified. |
| Add Page Numbers | `/tools/add-page-numbers` | pdf | AddPageNumbers | PARTIAL | PDF / tool-specific DOCX, XLSX, PPTX, image or TXT | Not fully audited | **NOT RUN** | Code route exists; representative input/output and error cases not verified. |
| Add Watermark | `/tools/add-watermark` | pdf | AddWatermark | PARTIAL | PDF / tool-specific DOCX, XLSX, PPTX, image or TXT | Not fully audited | **NOT RUN** | Code route exists; representative input/output and error cases not verified. |
| Image to PDF | `/tools/image-to-pdf` | pdf | ImageToPDF | PARTIAL | PDF / tool-specific DOCX, XLSX, PPTX, image or TXT | Not fully audited | **NOT RUN** | Code route exists; representative input/output and error cases not verified. |
| PDF to Image | `/tools/pdf-to-image` | pdf | PDFToImage | PARTIAL | PDF / tool-specific DOCX, XLSX, PPTX, image or TXT | Not fully audited | **NOT RUN** | Code route exists; representative input/output and error cases not verified. |
| JPG to PDF | `/tools/jpg-to-pdf` | pdf | ImageToPDF | PARTIAL | PDF / tool-specific DOCX, XLSX, PPTX, image or TXT | Not fully audited | **NOT RUN** | Code route exists; representative input/output and error cases not verified. |
| PDF to JPG | `/tools/pdf-to-jpg` | pdf | PDFToImage | PARTIAL | PDF / tool-specific DOCX, XLSX, PPTX, image or TXT | Not fully audited | **NOT RUN** | Code route exists; representative input/output and error cases not verified. |
| Word to PDF | `/tools/word-to-pdf` | pdf | WordToPDF | PARTIAL | PDF / tool-specific DOCX, XLSX, PPTX, image or TXT | Not fully audited | **NOT RUN** | Uses mammoth + pdf-lib; basic DOCX text only, legacy DOC not accepted. |
| PDF to Word | `/tools/pdf-to-word` | pdf | PDFToWord | PARTIAL | PDF / tool-specific DOCX, XLSX, PPTX, image or TXT | Not fully audited | **NOT RUN** | Selectable text is reflowed into DOCX. No layout/image preservation. |
| PPT to PDF | `/tools/ppt-to-pdf` | pdf | PPTToPDF | PARTIAL | PDF / tool-specific DOCX, XLSX, PPTX, image or TXT | Not fully audited | **NOT RUN** | Verify fidelity with representative presentations. |
| PDF to PPT | `/tools/pdf-to-ppt` | pdf | PDFToPPT | PARTIAL | PDF / tool-specific DOCX, XLSX, PPTX, image or TXT | Not fully audited | **NOT RUN** | Inspect slide editability and image layout before claiming conversion fidelity. |
| Excel to PDF | `/tools/excel-to-pdf` | pdf | ExcelToPDF | PARTIAL | PDF / tool-specific DOCX, XLSX, PPTX, image or TXT | Not fully audited | **NOT RUN** | Formatting is not guaranteed. |
| PDF to Excel | `/tools/pdf-to-excel` | pdf | PDFToExcel | PARTIAL | PDF / tool-specific DOCX, XLSX, PPTX, image or TXT | Not fully audited | **NOT RUN** | Code route exists; representative input/output and error cases not verified. |
| TXT to PDF | `/tools/txt-to-pdf` | pdf | TxtToPDF | PARTIAL | PDF / tool-specific DOCX, XLSX, PPTX, image or TXT | Not fully audited | **NOT RUN** | Code route exists; representative input/output and error cases not verified. |
| PDF to Text | `/tools/pdf-to-txt` | pdf | PDFToTxt | PARTIAL | PDF / tool-specific DOCX, XLSX, PPTX, image or TXT | Not fully audited | **NOT RUN** | Code route exists; representative input/output and error cases not verified. |
| Unlock PDF | `/tools/unlock-pdf` | pdf | UnlockPDF | PARTIAL | PDF / tool-specific DOCX, XLSX, PPTX, image or TXT | Not fully audited | **NOT RUN** | Code route exists; representative input/output and error cases not verified. |
| Protect PDF | `/tools/protect-pdf` | pdf | ProtectPDF | PARTIAL | PDF / tool-specific DOCX, XLSX, PPTX, image or TXT | Not fully audited | **NOT RUN** | Code route exists; representative input/output and error cases not verified. |
| Resize PDF | `/tools/resize-pdf` | pdf | ResizePDF | PARTIAL | PDF / tool-specific DOCX, XLSX, PPTX, image or TXT | Not fully audited | **NOT RUN** | Code route exists; representative input/output and error cases not verified. |
| Repair PDF | `/tools/repair-pdf` | pdf | RepairPDF | PARTIAL | PDF / tool-specific DOCX, XLSX, PPTX, image or TXT | Not fully audited | **NOT RUN** | Rewrites parseable PDFs; cannot claim recovery of arbitrary corruption. |
| Remove Annotations | `/tools/remove-annotations` | pdf | RemoveAnnotations | PARTIAL | PDF / tool-specific DOCX, XLSX, PPTX, image or TXT | Not fully audited | **NOT RUN** | Code route exists; representative input/output and error cases not verified. |
| Rename PDF | `/tools/rename-pdf` | pdf | RenamePDF | PARTIAL | PDF / tool-specific DOCX, XLSX, PPTX, image or TXT | Not fully audited | **NOT RUN** | Code route exists; representative input/output and error cases not verified. |
| Edit PDF | `/tools/edit-pdf` | pdf | EditPDF | PARTIAL | PDF / tool-specific DOCX, XLSX, PPTX, image or TXT | Not fully audited | **NOT RUN** | Code route exists; representative input/output and error cases not verified. |
| OCR PDF | `/tools/ocr-pdf` | pdf | OCRPDF | PARTIAL | PDF / tool-specific DOCX, XLSX, PPTX, image or TXT | Not fully audited | **NOT RUN** | Code route exists; representative input/output and error cases not verified. |
| eBook to PDF | `/tools/ebook-to-pdf` | ebook | EpubToPDF | PARTIAL | EPUB / MOBI / AZW / PDF (verify per processor) | Not fully audited | **NOT RUN** | Code route exists; representative input/output and error cases not verified. |
| EPUB to PDF | `/tools/epub-to-pdf` | ebook | EpubToPDF | PARTIAL | EPUB / MOBI / AZW / PDF (verify per processor) | Not fully audited | **NOT RUN** | Code route exists; representative input/output and error cases not verified. |
| MOBI to PDF | `/tools/mobi-to-pdf` | ebook | MobiToPDF | PARTIAL | EPUB / MOBI / AZW / PDF (verify per processor) | Not fully audited | **NOT RUN** | Code route exists; representative input/output and error cases not verified. |
| AZW to PDF | `/tools/azw-to-pdf` | ebook | MobiToPDF | PARTIAL | EPUB / MOBI / AZW / PDF (verify per processor) | Not fully audited | **NOT RUN** | Code route exists; representative input/output and error cases not verified. |
| PDF to EPUB | `/tools/pdf-to-epub` | ebook | PDFToEpub | PARTIAL | EPUB / MOBI / AZW / PDF (verify per processor) | Not fully audited | **NOT RUN** | Code route exists; representative input/output and error cases not verified. |
| PDF to MOBI | `/tools/pdf-to-mobi` | ebook | PDFToEpub | PARTIAL | EPUB / MOBI / AZW / PDF (verify per processor) | Not fully audited | **NOT RUN** | Actual generated output is EPUB, not a MOBI file. |
| PDF to AZW3 | `/tools/pdf-to-azw3` | ebook | PDFToEpub | PARTIAL | EPUB / MOBI / AZW / PDF (verify per processor) | Not fully audited | **NOT RUN** | Actual generated output is EPUB, not AZW3. |
| Image Upscaler | `/tools/upscale-image` | image | UpscaleImage | BLOCKED | JPG / PNG / WebP / supported tool-specific formats | Not fully audited | **NOT RUN** | External Worker calls third-party AI; live endpoint, output and privacy policy not verified. |
| Remove Background | `/tools/remove-background` | image | RemoveBackground | PARTIAL | JPG / PNG / WebP / supported tool-specific formats | Not fully audited | **NOT RUN** | Local model and separate background-removal service exist; benchmark/test separately. |
| Compress Image | `/tools/compress-image` | image | CompressImage | PARTIAL | JPG / PNG / WebP / supported tool-specific formats | Not fully audited | **NOT RUN** | Code route exists; representative input/output and error cases not verified. |
| Compress JPG | `/tools/compress-jpg` | image | CompressImage | PARTIAL | JPG / PNG / WebP / supported tool-specific formats | Not fully audited | **NOT RUN** | Code route exists; representative input/output and error cases not verified. |
| Compress JPEG | `/tools/compress-jpeg` | image | CompressImage | PARTIAL | JPG / PNG / WebP / supported tool-specific formats | Not fully audited | **NOT RUN** | Code route exists; representative input/output and error cases not verified. |
| Compress PNG | `/tools/compress-png` | image | CompressImage | PARTIAL | JPG / PNG / WebP / supported tool-specific formats | Not fully audited | **NOT RUN** | Code route exists; representative input/output and error cases not verified. |
| Compress BMP | `/tools/compress-bmp` | image | CompressImage | PARTIAL | JPG / PNG / WebP / supported tool-specific formats | Not fully audited | **NOT RUN** | Code route exists; representative input/output and error cases not verified. |
| Compress WEBP | `/tools/compress-webp` | image | CompressImage | PARTIAL | JPG / PNG / WebP / supported tool-specific formats | Not fully audited | **NOT RUN** | Code route exists; representative input/output and error cases not verified. |
| Image to JPG | `/tools/image-to-jpg` | image | ConvertImage | PARTIAL | JPG / PNG / WebP / supported tool-specific formats | Not fully audited | **NOT RUN** | Code route exists; representative input/output and error cases not verified. |
| Image to PNG | `/tools/image-to-png` | image | ConvertImage | PARTIAL | JPG / PNG / WebP / supported tool-specific formats | Not fully audited | **NOT RUN** | Code route exists; representative input/output and error cases not verified. |
| Image to JPEG | `/tools/image-to-jpeg` | image | ConvertImage | PARTIAL | JPG / PNG / WebP / supported tool-specific formats | Not fully audited | **NOT RUN** | Code route exists; representative input/output and error cases not verified. |
| Image to WEBP | `/tools/image-to-webp` | image | ConvertImage | PARTIAL | JPG / PNG / WebP / supported tool-specific formats | Not fully audited | **NOT RUN** | Code route exists; representative input/output and error cases not verified. |
| Image to BMP | `/tools/image-to-bmp` | image | ConvertImage | PARTIAL | JPG / PNG / WebP / supported tool-specific formats | Not fully audited | **NOT RUN** | Code route exists; representative input/output and error cases not verified. |
| Crop Image | `/tools/crop-image` | image | CropImage | PARTIAL | JPG / PNG / WebP / supported tool-specific formats | Not fully audited | **NOT RUN** | Code route exists; representative input/output and error cases not verified. |
| Resize Image | `/tools/resize-image` | image | ResizeImage | PARTIAL | JPG / PNG / WebP / supported tool-specific formats | Not fully audited | **NOT RUN** | Code route exists; representative input/output and error cases not verified. |
| Rotate Image | `/tools/rotate-image` | image | RotateImage | PARTIAL | JPG / PNG / WebP / supported tool-specific formats | Not fully audited | **NOT RUN** | Code route exists; representative input/output and error cases not verified. |
| Crop Circle Image | `/tools/crop-circle-image` | image | CropCircleImage | PARTIAL | JPG / PNG / WebP / supported tool-specific formats | Not fully audited | **NOT RUN** | Code route exists; representative input/output and error cases not verified. |
| Flip Image | `/tools/flip-image` | image | FlipImage | PARTIAL | JPG / PNG / WebP / supported tool-specific formats | Not fully audited | **NOT RUN** | Code route exists; representative input/output and error cases not verified. |
| Watermark Image | `/tools/watermark-image` | image | WatermarkImage | PARTIAL | JPG / PNG / WebP / supported tool-specific formats | Not fully audited | **NOT RUN** | Code route exists; representative input/output and error cases not verified. |
| Image to Text (OCR) | `/tools/ocr-image` | image | OCRImage | PARTIAL | JPG / PNG / WebP / supported tool-specific formats | Not fully audited | **NOT RUN** | Code route exists; representative input/output and error cases not verified. |
| Image Merge | `/tools/image-merge` | image | ImageMerge | PARTIAL | JPG / PNG / WebP / supported tool-specific formats | Not fully audited | **NOT RUN** | Code route exists; representative input/output and error cases not verified. |
| Photo Signature Resize | `/tools/photo-signature-resize` | image | PhotoSignatureResize | PARTIAL | JPG / PNG / WebP / supported tool-specific formats | Not fully audited | **NOT RUN** | Code route exists; representative input/output and error cases not verified. |
| GIF Maker | `/tools/gif-maker` | image | GifMaker | PARTIAL | JPG / PNG / WebP / supported tool-specific formats | Not fully audited | **NOT RUN** | Code route exists; representative input/output and error cases not verified. |
| GIF to Images | `/tools/gif-to-images` | image | GifToImages | PARTIAL | JPG / PNG / WebP / supported tool-specific formats | Not fully audited | **NOT RUN** | Code route exists; representative input/output and error cases not verified. |
| ZIP Maker | `/tools/zip-maker` | utility | ZipMaker | PARTIAL | Tool-specific text / ZIP / images / form data | Not fully audited | **NOT RUN** | Code route exists; representative input/output and error cases not verified. |
| ZIP Extractor | `/tools/zip-extractor` | utility | ZipExtractor | PARTIAL | Tool-specific text / ZIP / images / form data | ZIP ≤25 MiB, ≤100 files, ≤20 MiB/file, ≤80 MiB total | **NOT RUN** | Conservative resource and path checks added; integration test still required. |
| Barcode Generator | `/tools/barcode-generator` | utility | BarcodeGenerator | PARTIAL | Tool-specific text / ZIP / images / form data | Not fully audited | **NOT RUN** | Code route exists; representative input/output and error cases not verified. |
| Password Generator | `/tools/password-generator` | utility | PasswordGenerator | PARTIAL | Tool-specific text / ZIP / images / form data | Not fully audited | **NOT RUN** | Code route exists; representative input/output and error cases not verified. |
| Image to Color | `/tools/image-to-color` | utility | ColorExtractor | PARTIAL | Tool-specific text / ZIP / images / form data | Not fully audited | **NOT RUN** | Code route exists; representative input/output and error cases not verified. |
| Color Extractor | `/tools/color-extractor` | utility | ColorExtractor | PARTIAL | Tool-specific text / ZIP / images / form data | Not fully audited | **NOT RUN** | Code route exists; representative input/output and error cases not verified. |
| Word Counter | `/tools/word-counter` | utility | TextTools | PARTIAL | Tool-specific text / ZIP / images / form data | Not fully audited | **NOT RUN** | Code route exists; representative input/output and error cases not verified. |
| JSON Formatter | `/tools/json-formatter` | utility | TextTools | PARTIAL | Tool-specific text / ZIP / images / form data | Not fully audited | **NOT RUN** | Code route exists; representative input/output and error cases not verified. |
| Base64 Encoder | `/tools/base64-encoder` | utility | TextTools | PARTIAL | Tool-specific text / ZIP / images / form data | Not fully audited | **NOT RUN** | Code route exists; representative input/output and error cases not verified. |
| Hash Generator | `/tools/hash-generator` | utility | TextTools | PARTIAL | Tool-specific text / ZIP / images / form data | Not fully audited | **NOT RUN** | Code route exists; representative input/output and error cases not verified. |
| EMRS SPR Maker | `/tools/emrs-spr-maker` | utility | EMRSSprMaker | PARTIAL | Tool-specific text / ZIP / images / form data | Not fully audited | **NOT RUN** | Code route exists; representative input/output and error cases not verified. |

## Additional browser tools — 9 new routes (2026-10-16)

These were added on the follow-up branch after the 74-route source audit. They all have processor code, but no site deployment is assumed; source-level tests are included and end-to-end browser tests remain a separate requirement.

| Tool | Route | Category | Processor | Status | Formats | Limits | Tests | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PDF Metadata Viewer | `/tools/pdf-metadata` | pdf | FileInspector | PARTIAL | PDF | See tool UI | CI + real browser smoke test needed | Processor implemented. Mark WORKING only after representative output tests. |
| CSV to JSON | `/tools/csv-to-json` | utility | DataConverter | PARTIAL | Input-specific | See tool UI | CI + real browser smoke test needed | Processor implemented. Mark WORKING only after representative output tests. |
| JSON to CSV | `/tools/json-to-csv` | utility | DataConverter | PARTIAL | Input-specific | See tool UI | CI + real browser smoke test needed | Processor implemented. Mark WORKING only after representative output tests. |
| Image Dimensions & Info | `/tools/image-info` | image | FileInspector | PARTIAL | PNG / JPG / GIF / WebP / BMP | See tool UI | CI + real browser smoke test needed | Processor implemented. Mark WORKING only after representative output tests. |
| File SHA-256 Checksum | `/tools/file-checksum` | utility | FileInspector | PARTIAL | Input-specific | See tool UI | CI + real browser smoke test needed | Processor implemented. Mark WORKING only after representative output tests. |
| File Type Inspector | `/tools/file-signature` | utility | FileInspector | PARTIAL | Input-specific | See tool UI | CI + real browser smoke test needed | Processor implemented. Mark WORKING only after representative output tests. |
| URL Encoder & Decoder | `/tools/url-encoder` | utility | TextHelpers | PARTIAL | Input-specific | See tool UI | CI + real browser smoke test needed | Processor implemented. Mark WORKING only after representative output tests. |
| Unix Timestamp Converter | `/tools/timestamp-converter` | utility | TextHelpers | PARTIAL | Input-specific | See tool UI | CI + real browser smoke test needed | Processor implemented. Mark WORKING only after representative output tests. |
| Text Difference Checker | `/tools/text-diff` | utility | TextHelpers | PARTIAL | Input-specific | See tool UI | CI + real browser smoke test needed | Processor implemented. Mark WORKING only after representative output tests. |

## High-priority gaps
- The compressor previously exposed fake quality presets; it now attempts **structural-only** optimization and retains original bytes when rewriting would enlarge the PDF. Image downsampling remains unimplemented.
- PDF/DOCX and ebook conversion fidelity requires representative tests; never equate text extraction with layout-aware conversion. MOBI/AZW3 labels require genuine matching output or route reclassification.
- The externally hosted upscaler remains unverified. Its Worker accepts remote URLs and forwards input to a third-party provider; review SSRF, abuse controls, content validation and provider terms before production rollout.
- ZIP extraction has new preflight safeguards, but browser memory/CPU consumption still needs integration benchmarking.
- Do not count registry entries as independently verified working tools. Distinct routes often share the same processor.

## New differentiated workflow — Document Consistency Radar (2026-10-16)

- Route: `/tools/document-consistency-radar` · category: utility · processor: `consistency-radar.tsx`
- Status: **PARTIAL (implemented, automated tests required)**; browser OCR/PDF verification still requires smoke testing.
- Compares user-confirmed full name, date of birth, and parent names across up to eight records. Files: PDF, DOCX, TXT, JPG, PNG, WebP; 12 MiB/file, first 25 PDF pages checked for text suggestions.
- No extraction is treated as authoritative; signed/personal records and scanned images may not expose reliable text. Optional OCR may download model assets but does not upload the document.
- Exports optional-value JSON/TXT mismatch reports, with sensitive values omitted by default. Not an official verification or guarantee of portal acceptance.

## PDF Studio enhancement (2026-10-16)

- Existing route: `/tools/edit-pdf`; processor: `src/components/tools/processors/edit-pdf.tsx`.
- New: page thumbnails/search/reorder/removal, responsive zoom, 30-step markup undo/redo, selected formatting, image upload controls, explicit export types.
- Export modes: layered (preserves source PDF content when page order unchanged; **whiteout is not secure redaction**) and flattened (new image-only PDF, original text and interactivity stripped). Flattening can reduce resolution/searchability/accessibility.
- Status: PARTIAL until file-based browser verification and regression tests. **True in-place editing of PDF content streams is NOT implemented**; the existing-text tool is a visual cover/replacement overlay. Fidelity varies with fonts, source rotation, layout, complex forms and annotations.
