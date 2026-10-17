import { Tool } from "@/types";
import { IMAGE_WORKBENCH_TOOLS, asImageTool } from "@/lib/image-workbench-presets";

export const ALL_TOOLS: Tool[] = [
  // Exam Application Tools (not government-affiliated; notice-specific examples)
  { slug: "exam-thumb-photo-ink", name: "Bare Thumb Photo to Ink Style (Experimental)", description: "Style actual detail visible in a bare-thumb photograph with black or blue ink, editable crop, image dimensions and KB target. Not a genuine biometric thumb impression.", category: "exam", icon: "Fingerprint", color: "text-amber-600", tags: ["thumb", "bare thumb photo", "black ink", "blue ink", "experimental", "exam"], new: true },
  { slug: "exam-application-studio", name: "Exam Application Upload Studio", description: "Prepare photo, signature, thumb, declaration and document files using your own pixels, optional size limits, aspect lock, preview and format settings.", category: "exam", icon: "GraduationCap", color: "text-amber-600", tags: ["exam", "ssc", "ibps", "rrb", "recruitment", "photo", "signature", "thumb", "declaration"], popular: true, new: true },
  { slug: "exam-photo-resizer", name: "Exam Photo Size & KB Maker", description: "Resize your photo by pixels or percentage, lock proportions, choose JPG/PNG/WebP and set an optional maximum KB.", category: "exam", icon: "Image", color: "text-amber-600", tags: ["photo", "size", "pixel", "kb", "recruitment"], new: true },
  { slug: "exam-signature-maker", name: "Signature Size & KB Converter", description: "Resize real signature images with exact pixels, aspect-ratio lock, white padding and optional file-size target.", category: "exam", icon: "PenLine", color: "text-amber-600", tags: ["signature", "resize", "kb", "rrb", "ssc"], new: true },
  { slug: "exam-thumb-impression", name: "Thumb Impression Resizer", description: "Resize real thumb impressions to your chosen dimensions and file size, with preview and legibility tips.", category: "exam", icon: "Fingerprint", color: "text-amber-600", tags: ["thumb", "finger", "impression", "ibps", "kb"], new: true },
  { slug: "exam-handwritten-declaration", name: "Handwritten Declaration Resizer", description: "Resize genuine handwritten declarations by pixels or percentage with preview and file-size limits.", category: "exam", icon: "ScrollText", color: "text-amber-600", tags: ["declaration", "handwriting", "ibps", "application"], new: true },
  { slug: "exam-document-to-pdf", name: "Exam Certificate Scan to PDF", description: "Convert an uploaded certificate scan into an A4 PDF with an optional maximum file size.", category: "exam", icon: "FileText", color: "text-amber-600", tags: ["document", "certificate", "pdf", "a4", "scan"], new: true },
  { slug: "exam-photo-checker", name: "Accepted / Rejected Photo Checker", description: "Use an optional visual checklist for photos, signatures and thumb impressions alongside the custom resize editor.", category: "exam", icon: "ShieldCheck", color: "text-amber-600", tags: ["accepted", "rejected", "photo", "signature", "checklist"], new: true },
  { slug: "exam-upload-kit", name: "Exam Upload Kit ZIP Builder", description: "Prepare your own photo, signature, thumb, declaration and document files and download them together as a ZIP.", category: "exam", icon: "Package", color: "text-amber-600", tags: ["exam kit", "zip", "form", "upload"], new: true },
  // PDF Tools
  { slug: "compress-pdf", name: "Compress PDF", description: "Optimize PDF structure when this reduces file size; embedded images are not recompressed.", category: "pdf", icon: "FileDown", color: "text-red-500", tags: ["compress", "reduce", "optimize"], popular: true },
  { slug: "merge-pdf", name: "Merge PDF", description: "Combine multiple PDF files into one document. Easily merge and organize your PDFs.", category: "pdf", icon: "FilePlus2", color: "text-red-500", tags: ["merge", "combine", "join"], popular: true },
  { slug: "merge-pdf-image", name: "Merge PDF & Image", description: "Combine PDF files and images into a single PDF document.", category: "pdf", icon: "FileImage", color: "text-red-500", tags: ["merge", "image", "combine"] },
  { slug: "split-pdf", name: "Split PDF", description: "Split a PDF into multiple files. Extract pages or create separate documents.", category: "pdf", icon: "FileMinus2", color: "text-red-500", tags: ["split", "extract", "separate"], popular: true },
  { slug: "crop-pdf", name: "Crop PDF", description: "Crop PDF pages to your desired dimensions and remove unwanted margins.", category: "pdf", icon: "Crop", color: "text-red-500", tags: ["crop", "trim", "resize"] },
  { slug: "organize-pdf", name: "Organize PDF", description: "Rearrange, delete or rotate pages in your PDF document with ease.", category: "pdf", icon: "LayoutGrid", color: "text-red-500", tags: ["organize", "arrange", "reorder"] },
  { slug: "rotate-pdf", name: "Rotate PDF", description: "Rotate PDF pages 90, 180, or 270 degrees. Fix orientation of your documents.", category: "pdf", icon: "RotateCw", color: "text-red-500", tags: ["rotate", "orientation", "flip"] },
  { slug: "remove-pages", name: "Remove Pages", description: "Delete specific pages from your PDF document quickly and easily.", category: "pdf", icon: "FileX", color: "text-red-500", tags: ["remove", "delete", "pages"] },
  { slug: "extract-pdf", name: "Extract PDF", description: "Extract specific pages from a PDF and save them as a new document.", category: "pdf", icon: "FileOutput", color: "text-red-500", tags: ["extract", "pages", "export"] },
  { slug: "extract-images", name: "Extract Images", description: "Extract all images from a PDF document and download them as a ZIP file.", category: "pdf", icon: "Images", color: "text-red-500", tags: ["extract", "images", "zip"] },
  { slug: "add-page-numbers", name: "Add Page Numbers", description: "Add page numbers to your PDF document with custom positioning and styling.", category: "pdf", icon: "ListOrdered", color: "text-red-500", tags: ["page numbers", "pagination", "numbering"] },
  { slug: "add-watermark", name: "Add Watermark", description: "Add text or image watermarks to your PDF pages for branding or security.", category: "pdf", icon: "Stamp", color: "text-red-500", tags: ["watermark", "branding", "security"] },
  { slug: "image-to-pdf", name: "Image to PDF", description: "Convert JPG, PNG, WEBP and other image formats to PDF documents.", category: "pdf", icon: "ImageIcon", color: "text-red-500", tags: ["image", "convert", "jpg"], popular: true },
  { slug: "pdf-to-image", name: "PDF to Image", description: "Convert PDF pages to high-quality images in JPG, PNG or WEBP format.", category: "pdf", icon: "FileImage", color: "text-red-500", tags: ["image", "convert", "export"], popular: true },
  { slug: "jpg-to-pdf", name: "JPG to PDF", description: "Convert JPG images to PDF format. Maintain quality and aspect ratio.", category: "pdf", icon: "ImageIcon", color: "text-red-500", tags: ["jpg", "convert", "create"] },
  { slug: "pdf-to-jpg", name: "PDF to JPG", description: "Convert PDF pages to JPG images with customizable quality settings.", category: "pdf", icon: "Download", color: "text-red-500", tags: ["jpg", "export", "convert"] },
  { slug: "word-to-pdf", name: "Word to PDF", description: "Convert basic text and structure from DOCX to PDF; complex layout and legacy DOC are unsupported.", category: "pdf", icon: "FileText", color: "text-red-500", tags: ["word", "docx", "convert"], popular: true },
  { slug: "pdf-to-word", name: "PDF to Word", description: "Extract selectable text into an editable DOCX; original layout and graphics are not preserved.", category: "pdf", icon: "FileText", color: "text-red-500", tags: ["word", "docx", "convert"], popular: true },
  { slug: "ppt-to-pdf", name: "PPT to PDF", description: "Convert PowerPoint presentations to PDF format maintaining all slides.", category: "pdf", icon: "Presentation", color: "text-red-500", tags: ["powerpoint", "pptx", "convert"] },
  { slug: "pdf-to-ppt", name: "PDF to PPT", description: "Generate PowerPoint slides from PDF pages with limited editability.", category: "pdf", icon: "Presentation", color: "text-red-500", tags: ["powerpoint", "pptx", "convert"] },
  { slug: "excel-to-pdf", name: "Excel to PDF", description: "Render spreadsheet content into PDF with limited formatting support.", category: "pdf", icon: "Table", color: "text-red-500", tags: ["excel", "xlsx", "convert"] },
  { slug: "pdf-to-excel", name: "PDF to Excel", description: "Convert PDF tables and data to editable Excel spreadsheets.", category: "pdf", icon: "Table", color: "text-red-500", tags: ["excel", "xlsx", "convert"] },
  { slug: "txt-to-pdf", name: "TXT to PDF", description: "Convert plain text files to professionally formatted PDF documents.", category: "pdf", icon: "FileText", color: "text-red-500", tags: ["text", "txt", "convert"] },
  { slug: "pdf-to-txt", name: "PDF to Text", description: "Extract text content from PDF files and save as plain text files.", category: "pdf", icon: "AlignLeft", color: "text-red-500", tags: ["text", "extract", "convert"] },
  { slug: "unlock-pdf", name: "Unlock PDF", description: "Remove password protection from PDF files for unrestricted access.", category: "pdf", icon: "LockOpen", color: "text-red-500", tags: ["unlock", "password", "security"] },
  { slug: "protect-pdf", name: "Protect PDF", description: "Add password protection and encryption to secure your PDF documents.", category: "pdf", icon: "Lock", color: "text-red-500", tags: ["protect", "password", "encrypt"] },
  { slug: "resize-pdf", name: "Resize PDF", description: "Add page margins and padding, or change PDF page size to A4, Letter, Legal and more.", category: "pdf", icon: "Maximize2", color: "text-red-500", tags: ["resize", "margins", "page size"] },
  { slug: "repair-pdf", name: "Repair PDF", description: "Recover data from a corrupted or damaged PDF document by rebuilding its structure.", category: "pdf", icon: "Hammer", color: "text-red-500", tags: ["repair", "fix", "recover", "corrupted"] },
  { slug: "remove-annotations", name: "Remove Annotations", description: "Batch remove highlights, comments, strikeouts and other annotations from a PDF.", category: "pdf", icon: "Eraser", color: "text-red-500", tags: ["annotations", "remove", "highlights", "clean"] },
  { slug: "rename-pdf", name: "Rename PDF", description: "Change a PDF's filename based on text extracted from its pages.", category: "pdf", icon: "FileEdit", color: "text-red-500", tags: ["rename", "filename", "organize"] },
  { slug: "edit-pdf", name: "PDF Studio — Edit & Annotate", description: "Edit PDF pages visually: add text, images, shapes, drawings and highlights; search, reorder and delete pages, use undo/redo and choose layered or flattened exports. Text cover-ups are not true replacements.", category: "pdf", icon: "Edit3", color: "text-red-500", tags: ["edit", "annotate", "text", "draw", "pdf studio", "whiteout", "flatten", "organize", "undo"], popular: true },
  { slug: "ocr-pdf", name: "OCR PDF", description: "Recognize text in scanned PDFs and turn them into searchable, selectable documents.", category: "pdf", icon: "ScanText", color: "text-red-500", tags: ["ocr", "scan", "searchable", "text recognition"], popular: true },

  // eBook Tools
  { slug: "ebook-to-pdf", name: "eBook to PDF", description: "Convert various eBook formats to PDF for universal compatibility.", category: "ebook", icon: "BookOpen", color: "text-purple-500", tags: ["ebook", "convert", "pdf"] },
  { slug: "epub-to-pdf", name: "EPUB to PDF", description: "Convert EPUB eBooks to PDF format while preserving formatting.", category: "ebook", icon: "BookOpen", color: "text-purple-500", tags: ["epub", "convert", "pdf"] },
  { slug: "mobi-to-pdf", name: "MOBI to PDF", description: "Convert MOBI Kindle files to PDF format for any device.", category: "ebook", icon: "BookOpen", color: "text-purple-500", tags: ["mobi", "kindle", "convert"] },
  { slug: "azw-to-pdf", name: "AZW to PDF", description: "Convert Amazon Kindle AZW files to PDF documents.", category: "ebook", icon: "BookOpen", color: "text-purple-500", tags: ["azw", "kindle", "convert"] },
  { slug: "pdf-to-epub", name: "PDF to EPUB", description: "Convert PDF to EPUB with optional English/Hindi OCR and image-aware cloud processing, or use private text-only browser conversion.", category: "ebook", icon: "BookOpen", color: "text-purple-500", tags: ["epub", "ebook", "convert"] },
  { slug: "pdf-to-mobi", name: "PDF to MOBI", description: "Create EPUB for Send to Kindle from PDF. This tool does not generate native MOBI files.", category: "ebook", icon: "BookOpen", color: "text-purple-500", tags: ["mobi", "kindle", "convert"] },
  { slug: "pdf-to-azw3", name: "PDF to AZW3", description: "Create EPUB for Send to Kindle from PDF. This tool does not generate native AZW3 files.", category: "ebook", icon: "BookOpen", color: "text-purple-500", tags: ["azw3", "kindle", "convert"] },

  // Newly implemented image-processing routes. Each has a concrete operation
  // in ImageWorkbench; existing dedicated tools remain mapped as before.
  { slug: "thumb-photo-to-ink", name: "Bare Thumb Photo to Black / Blue Ink", description: "Experimental local-only image processing to style visible thumb-photo details in black or blue. Cannot recreate missing fingerprint ridges.", category: "image", icon: "Fingerprint", color: "text-green-500", tags: ["thumb photo", "thumb impression", "ink", "black", "blue", "fingerprint"], new: true },
  { slug: "image-toolbox", name: "Image Toolbox — All Image Tools", description: "Browse a searchable directory of real image resizing, effects, conversion, exact-KB, PDF, DPI, photo and signature utilities.", category: "image", icon: "Grid3X3", color: "text-green-500", tags: ["image", "toolbox", "all tools", "edit", "convert", "compress"], popular: true, new: true },
  ...IMAGE_WORKBENCH_TOOLS.map(asImageTool),
  // Image Tools
  { slug: "upscale-image", name: "Image Upscaler", description: "Enhance and upscale images using AI for sharper, higher-resolution results.", category: "image", icon: "Sparkles", color: "text-green-500", tags: ["upscale", "enhance", "ai", "resolution"], popular: true },
  { slug: "remove-background", name: "AI Background Remover", description: "Private, no-watermark AI cutouts, custom commercial backdrops, alpha-edge brush cleanup and original-size PNG downloads.", category: "image", icon: "Wand2", color: "text-green-500", tags: ["background", "remove", "transparent", "ai", "product"], popular: true },
  { slug: "background-studio", name: "AI Background Studio", description: "Professional browser-based cutouts with solid colors, studio gradients, uploaded backdrops, shadows, brush cleanup and HD-sized PNG exports.", category: "image", icon: "Wand2", color: "text-green-500", tags: ["studio", "transparent", "background", "cutout", "shadow", "ai"], new: true },
  { slug: "batch-background-remover", name: "Batch Background Remover", description: "Process up to 10 photos on your own device and export transparent or studio-style images in a single ZIP file.", category: "image", icon: "Layers", color: "text-green-500", tags: ["batch", "background", "bulk", "zip", "transparent"], new: true },
  { slug: "product-photo-maker", name: "Product Photo Studio", description: "Make consistent marketplace product photos with square sizing, gradient studio looks, real shadows and batch ZIP export.", category: "image", icon: "ImageIcon", color: "text-green-500", tags: ["ecommerce", "product", "marketplace", "studio", "photos"], new: true },
  { slug: "passport-photo-maker", name: "Passport & ID Photo Maker", description: "Crop original photos to US, UK and general ID sizes with alignment guides, 300-DPI exports, and printable photo sheets. No acceptance guarantee.", category: "image", icon: "ScanFace", color: "text-green-500", tags: ["passport", "visa", "id photo", "photo size", "print"], new: true },
  { slug: "photo-print-sheet", name: "ID Photo Print Sheet Maker", description: "Lay out correctly sized photos on A4 and 4×6-inch PDF sheets for printing at actual size.", category: "image", icon: "Printer", color: "text-green-500", tags: ["passport", "print", "sheet", "id", "35x45"], new: true },
  { slug: "compress-image", name: "Compress Image", description: "Compress and optimize images without visible quality loss. Supports all major formats.", category: "image", icon: "ImageDown", color: "text-green-500", tags: ["compress", "optimize", "reduce"], popular: true },
  { slug: "compress-jpg", name: "Compress JPG", description: "Reduce JPG image file size with adjustable quality settings.", category: "image", icon: "ImageDown", color: "text-green-500", tags: ["jpg", "compress", "reduce"] },
  { slug: "compress-jpeg", name: "Compress JPEG", description: "Optimize JPEG images for web and email with smart compression.", category: "image", icon: "ImageDown", color: "text-green-500", tags: ["jpeg", "compress", "optimize"] },
  { slug: "compress-png", name: "Compress PNG", description: "Reduce PNG file size while maintaining transparency and quality.", category: "image", icon: "ImageDown", color: "text-green-500", tags: ["png", "compress", "reduce"] },
  { slug: "compress-bmp", name: "Compress BMP", description: "Convert and compress BMP images to reduce file size significantly.", category: "image", icon: "ImageDown", color: "text-green-500", tags: ["bmp", "compress", "convert"] },
  { slug: "compress-webp", name: "Compress WEBP", description: "Optimize WEBP images for faster web loading with minimal quality loss.", category: "image", icon: "ImageDown", color: "text-green-500", tags: ["webp", "compress", "optimize"] },
  { slug: "image-to-jpg", name: "Image to JPG", description: "Convert any image format to JPG with customizable quality settings.", category: "image", icon: "ImageIcon", color: "text-green-500", tags: ["jpg", "convert", "format"] },
  { slug: "image-to-png", name: "Image to PNG", description: "Convert images to PNG format with lossless compression support.", category: "image", icon: "ImageIcon", color: "text-green-500", tags: ["png", "convert", "lossless"] },
  { slug: "image-to-jpeg", name: "Image to JPEG", description: "Convert images to JPEG format with optimized compression.", category: "image", icon: "ImageIcon", color: "text-green-500", tags: ["jpeg", "convert", "format"] },
  { slug: "image-to-webp", name: "Image to WEBP", description: "Convert images to modern WEBP format for better web performance.", category: "image", icon: "ImageIcon", color: "text-green-500", tags: ["webp", "convert", "modern"] },
  { slug: "image-to-bmp", name: "Image to BMP", description: "Convert images to BMP bitmap format for compatibility.", category: "image", icon: "ImageIcon", color: "text-green-500", tags: ["bmp", "convert", "bitmap"] },
  { slug: "crop-image", name: "Crop Image", description: "Crop images to any size with free crop, fixed ratios, and social media presets.", category: "image", icon: "Crop", color: "text-green-500", tags: ["crop", "trim", "resize"], popular: true },
  { slug: "resize-image", name: "Resize Image", description: "Resize images by pixels or percentage with aspect ratio lock.", category: "image", icon: "Maximize2", color: "text-green-500", tags: ["resize", "scale", "dimensions"], popular: true },
  { slug: "rotate-image", name: "Rotate Image", description: "Rotate images 90, 180, 270 degrees or any custom angle.", category: "image", icon: "RotateCw", color: "text-green-500", tags: ["rotate", "flip", "orientation"] },
  { slug: "crop-circle-image", name: "Crop Circle Image", description: "Crop images into perfect circles for profile pictures and avatars.", category: "image", icon: "Circle", color: "text-green-500", tags: ["circle", "crop", "avatar"] },
  { slug: "flip-image", name: "Flip Image", description: "Mirror images horizontally or vertically, in bulk.", category: "image", icon: "FlipHorizontal2", color: "text-green-500", tags: ["flip", "mirror", "horizontal", "vertical"], new: true },
  { slug: "watermark-image", name: "Watermark Image", description: "Add text watermarks to photos with custom position, color and opacity.", category: "image", icon: "Stamp", color: "text-green-500", tags: ["watermark", "protect", "branding"], new: true },
  { slug: "ocr-image", name: "Image to Text (OCR)", description: "Extract text from photos, screenshots and scans in 12 languages.", category: "image", icon: "ScanText", color: "text-green-500", tags: ["ocr", "text", "extract", "recognition"], new: true },
  { slug: "image-merge", name: "Image Merge", description: "Combine multiple images horizontally or vertically into one image.", category: "image", icon: "Layers", color: "text-green-500", tags: ["merge", "combine", "collage"] },
  { slug: "photo-signature-resize", name: "Photo Signature Resize", description: "Resize photos and signatures to specific dimensions for official documents.", category: "image", icon: "PenLine", color: "text-green-500", tags: ["signature", "resize", "documents"] },
  { slug: "gif-maker", name: "GIF Maker", description: "Create animated GIFs from multiple images with custom speed and loop settings.", category: "image", icon: "Film", color: "text-green-500", tags: ["gif", "animate", "create"] },
  { slug: "gif-to-images", name: "GIF to Images", description: "Extract individual frames from animated GIF files as separate images.", category: "image", icon: "Film", color: "text-green-500", tags: ["gif", "frames", "extract"] },

  // Utility Tools
  { slug: "zip-maker", name: "ZIP Maker", description: "Create ZIP archives from multiple files for easy sharing and storage.", category: "utility", icon: "Archive", color: "text-blue-500", tags: ["zip", "archive", "compress"] },
  { slug: "zip-extractor", name: "ZIP Extractor", description: "Extract files from ZIP archives directly in your browser.", category: "utility", icon: "FolderOpen", color: "text-blue-500", tags: ["zip", "extract", "unzip"] },
  { slug: "barcode-generator", name: "Barcode Generator", description: "Generate barcodes in Code128, EAN13, UPC, and QR Code formats.", category: "utility", icon: "QrCode", color: "text-blue-500", tags: ["barcode", "qr", "generate"] },
  { slug: "password-generator", name: "Password Generator", description: "Generate strong, secure passwords with custom length and character options.", category: "utility", icon: "Key", color: "text-blue-500", tags: ["password", "security", "generate"], popular: true },
  { slug: "image-to-color", name: "Image to Color", description: "Extract dominant colors from any image and get HEX, RGB, and HSL values.", category: "utility", icon: "Pipette", color: "text-blue-500", tags: ["color", "extract", "palette"] },
  { slug: "color-extractor", name: "Color Extractor", description: "Extract a full color palette from images with HEX, RGB, and HSL codes.", category: "utility", icon: "Palette", color: "text-blue-500", tags: ["color", "palette", "extract"] },
  { slug: "word-counter", name: "Word Counter", description: "Count words, characters, sentences and estimated reading time in real time.", category: "utility", icon: "Type", color: "text-blue-500", tags: ["words", "count", "characters", "writing"], new: true },
  { slug: "json-formatter", name: "JSON Formatter", description: "Format, validate and minify JSON with instant error reporting.", category: "utility", icon: "Braces", color: "text-blue-500", tags: ["json", "format", "validate", "minify"], new: true },
  { slug: "base64-encoder", name: "Base64 Encoder", description: "Encode text to Base64 or decode Base64 back to text instantly.", category: "utility", icon: "ArrowDownUp", color: "text-blue-500", tags: ["base64", "encode", "decode"], new: true },
  { slug: "hash-generator", name: "Hash Generator", description: "Generate SHA-1, SHA-256, SHA-384 and SHA-512 hashes from any text.", category: "utility", icon: "Hash", color: "text-blue-500", tags: ["hash", "sha256", "checksum", "security"], new: true },
  { slug: "emrs-spr-maker", name: "EMRS SPR Maker", description: "Fill the EMRS Special Performance Report (11/22/33 months) form with handwritten-style entries, green tick marks, and your uploaded signature, name & date. Also supports bulk generation for multiple employees via Excel.", category: "utility", icon: "FileSignature", color: "text-blue-500", tags: ["emrs", "spr", "performance report", "form", "probation", "bulk"], new: true },
  // Browser-based inspection and data tools (implemented processors)
  { slug: "pdf-metadata", name: "PDF Metadata Viewer", description: "View PDF title, author, dates, page count and first-page dimensions without uploading your document.", category: "pdf", icon: "FileSearch", color: "text-red-500", tags: ["metadata", "properties", "author", "title", "inspect"], new: true },
  { slug: "csv-to-json", name: "CSV to JSON", description: "Convert CSV with quoted fields and line breaks to a downloadable array of JSON objects.", category: "utility", icon: "Table2", color: "text-blue-500", tags: ["csv", "json", "spreadsheet", "convert", "data"], new: true },
  { slug: "json-to-csv", name: "JSON to CSV", description: "Convert flat JSON objects to downloadable CSV with optional spreadsheet-formula protection.", category: "utility", icon: "Table2", color: "text-blue-500", tags: ["json", "csv", "spreadsheet", "convert", "data"], new: true },
  { slug: "image-info", name: "Image Dimensions & Info", description: "Inspect image width, height, aspect ratio, pixel count and file size locally.", category: "image", icon: "Image", color: "text-green-500", tags: ["dimensions", "image", "aspect", "resolution", "properties"], new: true },
  { slug: "file-checksum", name: "File SHA-256 Checksum", description: "Calculate a file's SHA-256 checksum locally to compare file integrity.", category: "utility", icon: "ShieldCheck", color: "text-blue-500", tags: ["hash", "checksum", "sha256", "verify", "file"], new: true },
  { slug: "file-signature", name: "File Type Inspector", description: "Inspect file header signatures and hex bytes to identify common file container formats.", category: "utility", icon: "ScanSearch", color: "text-blue-500", tags: ["file", "magic bytes", "signature", "mime", "type", "inspect"], new: true },
  { slug: "url-encoder", name: "URL Encoder & Decoder", description: "Encode or decode URL query-component text with correct percent encoding.", category: "utility", icon: "Link2", color: "text-blue-500", tags: ["url", "encode", "decode", "percent", "component"], new: true },
  { slug: "timestamp-converter", name: "Unix Timestamp Converter", description: "Convert UTC ISO 8601 dates, Unix seconds and Unix milliseconds.", category: "utility", icon: "Clock3", color: "text-blue-500", tags: ["unix", "timestamp", "date", "epoch", "time"], new: true },
  { slug: "text-diff", name: "Text Difference Checker", description: "Compare up to 300 lines per side and see exact added or removed lines.", category: "utility", icon: "GitCompareArrows", color: "text-blue-500", tags: ["diff", "text", "compare", "changes", "lines"], new: true },
  // Focused, local application document cross-checker
  { slug: "document-consistency-radar", name: "Document Consistency Radar", description: "Spot spelling, initials, name order, date of birth and parent-name discrepancies across certificates and application records before submission. All comparisons are reviewed locally.", category: "utility", icon: "FileSearch", color: "text-blue-500", tags: ["name mismatch", "document verification", "application", "identity consistency", "certificate", "date of birth", "offline", "privacy"], popular: true, new: true },
];

export const TOOL_CATEGORIES = [
  {
    id: "pdf",
    name: "PDF Tools",
    description: "Everything you need to work with PDF files",
    icon: "FileText",
    color: "text-red-500",
    bgColor: "bg-red-50 dark:bg-red-950/20",
    borderColor: "border-red-200 dark:border-red-800",
    count: ALL_TOOLS.filter((t) => t.category === "pdf").length,
  },
  {
    id: "ebook",
    name: "eBook Tools",
    description: "Convert eBook formats with ease",
    icon: "BookOpen",
    color: "text-purple-500",
    bgColor: "bg-purple-50 dark:bg-purple-950/20",
    borderColor: "border-purple-200 dark:border-purple-800",
    count: ALL_TOOLS.filter((t) => t.category === "ebook").length,
  },
  {
    id: "image",
    name: "Image Tools",
    description: "Edit, compress, and convert images",
    icon: "Image",
    color: "text-green-500",
    bgColor: "bg-green-50 dark:bg-green-950/20",
    borderColor: "border-green-200 dark:border-green-800",
    count: ALL_TOOLS.filter((t) => t.category === "image").length,
  },
  {
    id: "exam",
    name: "Exam Application Tools",
    description: "Prepare exam photo, signature, thumb and declaration uploads",
    icon: "GraduationCap",
    color: "text-amber-600",
    bgColor: "bg-amber-50 dark:bg-amber-950/20",
    borderColor: "border-amber-200 dark:border-amber-800",
    count: ALL_TOOLS.filter((t) => t.category === "exam").length,
  },
  {
    id: "utility",
    name: "Utility Tools",
    description: "Handy tools for everyday tasks",
    icon: "Wrench",
    color: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    borderColor: "border-blue-200 dark:border-blue-800",
    count: ALL_TOOLS.filter((t) => t.category === "utility").length,
  },
];

export const POPULAR_TOOLS = ALL_TOOLS.filter((t) => t.popular);

export function getToolBySlug(slug: string): Tool | undefined {
  return ALL_TOOLS.find((t) => t.slug === slug);
}

export function getToolsByCategory(category: string): Tool[] {
  return ALL_TOOLS.filter((t) => t.category === category);
}

export function getRelatedTools(tool: Tool, limit = 6): Tool[] {
  return ALL_TOOLS.filter(
    (t) => t.category === tool.category && t.slug !== tool.slug
  ).slice(0, limit);
}

export function searchTools(query: string): Tool[] {
  const q = query.toLowerCase();
  return ALL_TOOLS.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.tags.some((tag) => tag.toLowerCase().includes(q))
  );
}
