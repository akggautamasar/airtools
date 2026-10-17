# AirTools Image Toolbox

## What is implemented
- `/tools/image-toolbox` is a searchable directory organized by user-provided screenshot categories. New links point to the **same real browser-side workbench with route-specific options**, and established AirTools tools are linked rather than reimplemented.
- Photo/image resizing (pixel/physical units, fitting/padding, aspect ratio), fixed-size photo templates, bulk resizing.
- Image compression with individually labeled exact maximum KiB targets. JPEG/WebP quality is lowered in steps. An optional strict mode can also reduce **pixel dimensions**. If the maximum cannot be met, the actual output bytes are shown with a failed-target warning rather than marking it compliant.
- Visual effects: grayscale/B&W, sepia, blur, motion-trail blur, pixelation, sharpening, inversion, exaggerated saturation/contrast, adjustable image region blurring/pixelation. "Face" operations are manual region controls, **not** AI facial detection.
- Text, name/date, optional logo and border/rounded overlay features, canvas collage layouts, and grid/image splitting.
- Format export JPEG, PNG, WebP (subject to browser support), BMP (true 24-bit encoder), ICO (true PNG-in-ICO container), JFIF; conversion from AVIF only if the browser can decode the input. No HEIC support promised.
- PNG pHYs density metadata and JPEG JFIF resolution metadata, including 200/300/600 DPI variants. Changing DPI metadata does not create additional visual pixels. These routines cover pHYs/JFIF only; full EXIF GPS/metadata editing is not supported.
- One-page A4 PDF from images with size-target attempts via iterative JPEG re-encoding and downscaling, using pdf-lib.
- Batch operations and ZIP download, up to 12 images of 20 MiB each / 30 MP sources, output max 16 MP canvas.
- User-provided images never go to the AirTools server *in the new workbench*. Linked legacy AI upscaler or OCR have their own separate behavior.

## Honest limits
- No claim to fully recreate every tool in the screenshot, including proprietary AI face generation, inpainting/remove-object, AI background relighting, arbitrary video encodes, HEIC conversion without decoder, professional unblur and retouch, complete EXIF editing or DOCX visual rendering.
- Adding JPEG APP15 padding can increase file size without increasing visual quality. Format readers accept valid APP15 markers but highly restrictive image upload portals may reject unknown metadata; the workbench explains this. Pixel/size compliance cannot guarantee government acceptance.
- New tools use canvas re-encoding, so existing EXIF/ICC/XMP/color profiles are generally discarded. The fixed-size ID shortcuts are editable dimensions, not authority-certified photo templates.
- The screenshot's advertising and visual branding are not copied. This is independent code and design.

## Validation
- Node tests cover catalog integrity, real mode mapping, file-size/DPI helpers, JPEG bytes and defaults.
- GitHub CI runs Node tests, TypeScript, ESLint, Next build. Manual browser tests should cover Chrome Android and desktop, particularly binary ICO/BMP output, PNG/JPEG density metadata, small KB targets, and large collage memory.
