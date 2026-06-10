import { Tool } from "@/types";

export const ALL_TOOLS: Tool[] = [
  // PDF Tools
  { slug: "compress-pdf", name: "Compress PDF", description: "Reduce PDF file size while maintaining quality. Perfect for email attachments and web uploads.", category: "pdf", icon: "FileDown", color: "text-red-500", tags: ["compress", "reduce", "optimize"], popular: true },
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
  { slug: "word-to-pdf", name: "Word to PDF", description: "Convert Word documents (DOC, DOCX) to PDF format preserving formatting.", category: "pdf", icon: "FileText", color: "text-red-500", tags: ["word", "docx", "convert"], popular: true },
  { slug: "pdf-to-word", name: "PDF to Word", description: "Convert PDF files to editable Word documents (DOCX) with high accuracy.", category: "pdf", icon: "FileText", color: "text-red-500", tags: ["word", "docx", "convert"], popular: true },
  { slug: "ppt-to-pdf", name: "PPT to PDF", description: "Convert PowerPoint presentations to PDF format maintaining all slides.", category: "pdf", icon: "Presentation", color: "text-red-500", tags: ["powerpoint", "pptx", "convert"] },
  { slug: "pdf-to-ppt", name: "PDF to PPT", description: "Convert PDF files to PowerPoint presentations for easy editing.", category: "pdf", icon: "Presentation", color: "text-red-500", tags: ["powerpoint", "pptx", "convert"] },
  { slug: "excel-to-pdf", name: "Excel to PDF", description: "Convert Excel spreadsheets to PDF format with all formatting intact.", category: "pdf", icon: "Table", color: "text-red-500", tags: ["excel", "xlsx", "convert"] },
  { slug: "pdf-to-excel", name: "PDF to Excel", description: "Convert PDF tables and data to editable Excel spreadsheets.", category: "pdf", icon: "Table", color: "text-red-500", tags: ["excel", "xlsx", "convert"] },
  { slug: "txt-to-pdf", name: "TXT to PDF", description: "Convert plain text files to professionally formatted PDF documents.", category: "pdf", icon: "FileText", color: "text-red-500", tags: ["text", "txt", "convert"] },
  { slug: "pdf-to-txt", name: "PDF to Text", description: "Extract text content from PDF files and save as plain text files.", category: "pdf", icon: "AlignLeft", color: "text-red-500", tags: ["text", "extract", "convert"] },
  { slug: "unlock-pdf", name: "Unlock PDF", description: "Remove password protection from PDF files for unrestricted access.", category: "pdf", icon: "LockOpen", color: "text-red-500", tags: ["unlock", "password", "security"] },
  { slug: "protect-pdf", name: "Protect PDF", description: "Add password protection and encryption to secure your PDF documents.", category: "pdf", icon: "Lock", color: "text-red-500", tags: ["protect", "password", "encrypt"] },

  // eBook Tools
  { slug: "ebook-to-pdf", name: "eBook to PDF", description: "Convert various eBook formats to PDF for universal compatibility.", category: "ebook", icon: "BookOpen", color: "text-purple-500", tags: ["ebook", "convert", "pdf"] },
  { slug: "epub-to-pdf", name: "EPUB to PDF", description: "Convert EPUB eBooks to PDF format while preserving formatting.", category: "ebook", icon: "BookOpen", color: "text-purple-500", tags: ["epub", "convert", "pdf"] },
  { slug: "mobi-to-pdf", name: "MOBI to PDF", description: "Convert MOBI Kindle files to PDF format for any device.", category: "ebook", icon: "BookOpen", color: "text-purple-500", tags: ["mobi", "kindle", "convert"] },
  { slug: "azw-to-pdf", name: "AZW to PDF", description: "Convert Amazon Kindle AZW files to PDF documents.", category: "ebook", icon: "BookOpen", color: "text-purple-500", tags: ["azw", "kindle", "convert"] },
  { slug: "pdf-to-epub", name: "PDF to EPUB", description: "Convert PDF files to EPUB format for eReaders and mobile devices.", category: "ebook", icon: "BookOpen", color: "text-purple-500", tags: ["epub", "ebook", "convert"] },
  { slug: "pdf-to-mobi", name: "PDF to MOBI", description: "Convert PDF files to MOBI format compatible with Kindle devices.", category: "ebook", icon: "BookOpen", color: "text-purple-500", tags: ["mobi", "kindle", "convert"] },
  { slug: "pdf-to-azw3", name: "PDF to AZW3", description: "Convert PDF files to AZW3 format for modern Kindle devices.", category: "ebook", icon: "BookOpen", color: "text-purple-500", tags: ["azw3", "kindle", "convert"] },

  // Image Tools
  { slug: "upscale-image", name: "Image Upscaler", description: "Enhance and upscale images using AI for sharper, higher-resolution results.", category: "image", icon: "Sparkles", color: "text-green-500", tags: ["upscale", "enhance", "ai", "resolution"], popular: true },
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
