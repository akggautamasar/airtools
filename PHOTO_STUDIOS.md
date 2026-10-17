# AirTools photo studios — feature and compliance notes

## AI Background Studio
- Reuses the existing `@imgly/background-removal` package with **AGPL license**, which requires appropriate source availability/compliance for network services. Review your complete distributed service licensing obligations. Source: https://github.com/imgly/background-removal-js
- Processing is on-device (browser). The initial model assets are downloaded from a third-party CDN; input image bytes are not uploaded to AirTools or to a background-removal API in this studio.
- Batch supports up to 10 JPG/PNG/WebP images, 12 MiB per file. Model inference is sequential, limited by device RAM/CPU. Export is PNG or ZIP; options include transparent, solid, gradients or a user-supplied image, shadows and marketplace sizing.
- Manual alpha cleanup edits a reduced-size mask. "Restore" paints original pixels and may also bring back some background. Unlike commercial AI services, **there is no genuine text-prompt backdrop generation, smart relighting, or guaranteed fine-hair pixel accuracy**.
- HD-size PNG exports increase the canvas dimensions, not the source image detail. The separate old upscaler API is not called here.

## Passport & ID Photo Studio
- In-browser crop/reposition and simple optional native browser Shape Detection API FaceDetector for coarse centering only. This API is unsupported in many browsers, so there is no promise of automatic biometric checks.
- U.S. **printed** passport: 2 x 2 inch photo, head approximately 25–35 mm. Official authority: https://travel.state.gov/en/passports/apply/help/photos.html
- U.K. **printed** passport: 35 x 45 mm photo, head 29–34 mm. Official authority: https://www.gov.uk/photos-for-passports/photo-requirements
- General 35x45, 25x35, 50x50, custom sizes are not official visa templates or guaranteed accepted in India or other countries.
- **Do not digitally change backgrounds, clothing, faces or appearance for official photos**, especially US submissions. US State Department specifically rejects AI/photo enhancement and asks for the original picture. The studio intentionally does not offer AI suit swapping or background replacement.
- Output JPG/PNG at 300-DPI pixel dimensions and print sheets as dimensionally accurate PDF at 72 PDF points/inch; print at **Actual size / 100%**, not Fit to Page.
- Crop position is manual or approximate detection, not certified head-height measurement or human review. User must confirm issuer rules and photo authenticity. The tool cannot guarantee acceptance.

## Operational
- No new server, paid API, credit card or database necessary.
- Existing public repo source provides an audit path. Validate quality on real photos and major browsers (especially Android).
