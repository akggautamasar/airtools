import type { Tool } from "@/types";

/** Every catalog entry either has a real browser-side processor or links to an
 * existing AirTools processor. Do not list nonimplemented AI/video services. */
export type ImageWorkbenchMode =
  | "resize" | "compress" | "effect" | "overlay" | "layout"
  | "split" | "convert" | "pdf" | "inspect" | "dpi";

export type ImageWorkbenchGroup =
  | "Popular" | "Basic editing" | "Effects" | "DPI & quality"
  | "Resize" | "Exam & ID sizes" | "Social media"
  | "Formats" | "Image to PDF" | "Compression" | "Exact KB";

export interface ImageWorkbenchPreset {
  slug: string;
  name: string;
  mode: ImageWorkbenchMode;
  group: ImageWorkbenchGroup;
  description: string;
  width?: number;
  height?: number;
  unit?: "px" | "mm" | "cm" | "in";
  dpi?: number;
  targetKB?: number;
  output?: "jpeg" | "png" | "webp" | "bmp" | "ico" | "jfif";
  effect?: "blur"|"pixelate"|"motion-blur"|"grayscale"|"blackwhite"|"sepia"|"deepfry"|"sharpen"|"invert";
  overlay?: "text"|"date"|"logo"|"border"|"round"|"color";
  arrangement?: "horizontal"|"vertical"|"grid"|"photo-signature";
  rows?: number;
  cols?: number;
  ratio?: number;
  note?: string;
}

/** Groups follow the user-provided directory screenshot; all sizes are *editable*.
 * Named exam routes are editing shortcuts, NEVER "officially accepted" templates. */
export const IMAGE_WORKBENCH_PRESETS: ImageWorkbenchPreset[] = [
  {slug:"image-toolbox-resizer",name:"Advanced Image Resizer",mode:"resize",group:"Popular",description:"Pixel, inch, cm, mm or percentage resize with live preview, crop/fit and output controls."},
  {slug:"image-kb-reducer",name:"Reduce Image Size in KB",mode:"compress",group:"Popular",description:"Set an optional KB maximum, preview actual output and download locally."},
  {slug:"image-kb-increaser",name:"Increase Image File Size (KB)",mode:"compress",group:"Popular",description:"Increase JPEG file bytes with harmless metadata padding; this does not add image detail.",output:"jpeg",note:"Increasing file bytes does not improve resolution or quality."},
  {slug:"photo-collage-maker",name:"Photo Collage Maker",mode:"layout",group:"Popular",description:"Arrange multiple photos on a customizable grid.",arrangement:"grid"},
  {slug:"resize-signature-online",name:"Resize Signature",mode:"resize",group:"Popular",description:"Keep the complete handwritten signature visible while resizing."},
  {slug:"resize-image-centimeters",name:"Resize Image in Centimeters",mode:"resize",group:"Popular",description:"Enter physical dimensions and conversion DPI.",unit:"cm",width:3.5,height:4.5},
  {slug:"resize-image-35x45",name:"Resize Image 3.5 × 4.5 cm",mode:"resize",group:"Popular",description:"Editable 35 × 45 mm photographic canvas.",unit:"cm",width:3.5,height:4.5,dpi:300},
  {slug:"resize-image-pixels",name:"Resize Image by Pixels",mode:"resize",group:"Resize",description:"Set exact output pixel width and height."},
  {slug:"resize-image-millimeters",name:"Resize Image in Millimeters",mode:"resize",group:"Resize",description:"Resize with mm and custom DPI.",unit:"mm",width:35,height:45},
  {slug:"resize-image-inches",name:"Resize Image in Inches",mode:"resize",group:"Resize",description:"Resize by inches with adjustable DPI.",unit:"in",width:2,height:2},
  {slug:"bulk-image-resizer",name:"Bulk Image Resizer",mode:"resize",group:"Resize",description:"Resize up to 12 images, then export a ZIP."},
  {slug:"image-resize-percentage",name:"Resize Image by Percentage",mode:"resize",group:"Resize",description:"Scale images by a percentage."},
  {slug:"change-image-aspect-ratio",name:"Change Image Aspect Ratio",mode:"resize",group:"Basic editing",description:"Fit, crop or stretch images to a new aspect ratio."},
  {slug:"zoom-out-image",name:"Zoom Out Image",mode:"resize",group:"Basic editing",description:"Reduce subject size and add white or colored margins.",ratio:1},
  {slug:"image-square-crop",name:"Square Crop",mode:"resize",group:"Basic editing",description:"Crop to an editable square canvas.",ratio:1},
  {slug:"free-image-crop",name:"Image Crop and Fit",mode:"resize",group:"Basic editing",description:"Crop or pad to exact pixels, with pan and zoom."},
  {slug:"add-border-to-image",name:"Add Border to Image",mode:"overlay",group:"Basic editing",description:"Add an adjustable color border around a photograph.",overlay:"border"},
  {slug:"white-border-image",name:"Add White Border to Image",mode:"overlay",group:"Basic editing",description:"Add white padding or a border.",overlay:"border"},
  {slug:"round-corners-image",name:"Round Corners of Image",mode:"overlay",group:"Basic editing",description:"Round image corners and export PNG transparency.",overlay:"round",output:"png"},
  {slug:"add-text-to-image",name:"Add Text to Image",mode:"overlay",group:"Basic editing",description:"Draw editable text on the image locally.",overlay:"text"},
  {slug:"add-name-dob-photo",name:"Add Name & DOB on Photo",mode:"overlay",group:"Basic editing",description:"Overlay user-entered name and date at the bottom of a photo.",overlay:"date"},
  {slug:"add-logo-to-image",name:"Add Logo to Image",mode:"overlay",group:"Basic editing",description:"Overlay an uploaded logo with opacity and scale controls.",overlay:"logo"},
  {slug:"image-grayscale",name:"Grayscale Image",mode:"effect",group:"Effects",description:"Convert image pixels to grayscale.",effect:"grayscale"},
  {slug:"image-black-white",name:"Black and White Image",mode:"effect",group:"Effects",description:"Apply high-contrast monochrome.",effect:"blackwhite"},
  {slug:"blur-photo",name:"Blur Image",mode:"effect",group:"Effects",description:"Apply an adjustable Gaussian-style canvas blur.",effect:"blur"},
  {slug:"motion-blur-photo",name:"Motion Blur Image",mode:"effect",group:"Effects",description:"Create a horizontal motion-trail effect.",effect:"motion-blur"},
  {slug:"pixelate-photo",name:"Pixelate Image",mode:"effect",group:"Effects",description:"Create blocky pixels with editable block size.",effect:"pixelate"},
  {slug:"image-deep-fry",name:"Deep Fry Photo Effect",mode:"effect",group:"Effects",description:"Apply exaggerated contrast and saturation.",effect:"deepfry"},
  {slug:"photo-sepia",name:"Sepia Photo",mode:"effect",group:"Effects",description:"Apply a sepia filter.",effect:"sepia"},
  {slug:"photo-invert",name:"Invert Image Colors",mode:"effect",group:"Effects",description:"Invert RGB colors while preserving transparency.",effect:"invert"},
  {slug:"sharpen-image",name:"Sharpen Image",mode:"effect",group:"Effects",description:"Apply a modest local sharpening kernel; cannot restore missing detail.",effect:"sharpen"},
  {slug:"image-censor-region",name:"Censor Part of Image",mode:"effect",group:"Effects",description:"Manually pixelate a selected rectangular region.",effect:"pixelate",note:"Region is positioned manually; no AI face identification."},
  {slug:"image-blur-region",name:"Blur Part of Image",mode:"effect",group:"Effects",description:"Manually blur a selected rectangular region.",effect:"blur",note:"Region is positioned manually; no automatic face identification."},
  {slug:"image-dpi-checker",name:"Check Image DPI",mode:"inspect",group:"DPI & quality",description:"Inspect JPEG JFIF or PNG pHYs density metadata when present."},
  {slug:"image-dpi-editor",name:"Set Image DPI",mode:"dpi",group:"DPI & quality",description:"Write JPEG JFIF or PNG pHYs density metadata, without inventing visual detail.",dpi:300},
  {slug:"image-dpi-200",name:"Set Image to 200 DPI",mode:"dpi",group:"DPI & quality",description:"Embed 200 DPI metadata in JPEG or PNG.",dpi:200},
  {slug:"image-dpi-300",name:"Set Image to 300 DPI",mode:"dpi",group:"DPI & quality",description:"Embed 300 DPI metadata in JPEG or PNG.",dpi:300},
  {slug:"image-dpi-600",name:"Set Image to 600 DPI",mode:"dpi",group:"DPI & quality",description:"Embed 600 DPI metadata in JPEG or PNG.",dpi:600},
  {slug:"image-metadata-remover",name:"Remove Image Metadata",mode:"convert",group:"DPI & quality",description:"Re-encode image pixels to strip most source EXIF metadata; transparency preserved in PNG.",output:"png"},
  {slug:"image-quality-enhancer",name:"Adjust Image Quality",mode:"effect",group:"DPI & quality",description:"Improve perceived contrast and sharpness without claiming AI super-resolution.",effect:"sharpen"},
  {slug:"a4-image-resizer",name:"A4 Size Image",mode:"resize",group:"Exam & ID sizes",description:"Resize to 210 × 297 mm at editable DPI.",unit:"mm",width:210,height:297,dpi:300},
  {slug:"ssc-photo-size",name:"SSC Photo Size Editor",mode:"resize",group:"Exam & ID sizes",description:"Manually enter current SSC portal image requirements; no fixed official preset.",note:"Refer to your current application notice for the actual dimensions and live-photo rules."},
  {slug:"upsc-photo-size",name:"UPSC Photo Size Editor",mode:"resize",group:"Exam & ID sizes",description:"Edit image dimensions according to your current UPSC notice; no universal preset."},
  {slug:"pan-card-photo-size",name:"PAN Card Photo Editor",mode:"resize",group:"Exam & ID sizes",description:"Manually size a real photo against the instructions of your chosen PAN process."},
  {slug:"psc-photo-size",name:"PSC Photo Size Editor",mode:"resize",group:"Exam & ID sizes",description:"Enter the requirements for your individual PSC application."},
  {slug:"photo-35x45mm",name:"35 × 45 mm Photo",mode:"resize",group:"Exam & ID sizes",description:"35 × 45 mm canvas with adjustable DPI and cropping.",unit:"mm",width:35,height:45,dpi:300},
  {slug:"photo-2x2-inch",name:"2 × 2 Inch Photo",mode:"resize",group:"Exam & ID sizes",description:"2 × 2-inch editable print-size image.",unit:"in",width:2,height:2,dpi:300},
  {slug:"photo-3x4-inch",name:"3 × 4 Inch Photo",mode:"resize",group:"Exam & ID sizes",description:"3 × 4-inch photo canvas.",unit:"in",width:3,height:4,dpi:300},
  {slug:"photo-4x6-inch",name:"4 × 6 Inch Photo",mode:"resize",group:"Exam & ID sizes",description:"4 × 6-inch photo canvas.",unit:"in",width:4,height:6,dpi:300},
  {slug:"photo-600x600",name:"600 × 600 Pixels",mode:"resize",group:"Exam & ID sizes",description:"Editable square 600 × 600 pixel output.",width:600,height:600},
  {slug:"signature-6x2cm",name:"Signature 6 × 2 cm",mode:"resize",group:"Exam & ID sizes",description:"6 × 2 cm with adjustable DPI; keeps whole signature.",unit:"cm",width:6,height:2,dpi:300},
  {slug:"signature-50x20mm",name:"Signature 50 × 20 mm",mode:"resize",group:"Exam & ID sizes",description:"50 × 20 mm signature canvas.",unit:"mm",width:50,height:20,dpi:300},
  {slug:"instagram-no-crop",name:"Instagram Photo Without Crop",mode:"resize",group:"Social media",description:"Fit whole photo into a square with margins.",width:1080,height:1080,ratio:1},
  {slug:"instagram-grid-maker",name:"Instagram Grid Maker",mode:"split",group:"Social media",description:"Split one image into nine square grid tiles.",rows:3,cols:3},
  {slug:"whatsapp-profile-photo",name:"WhatsApp Display Picture",mode:"resize",group:"Social media",description:"Fit image in square 1080 × 1080 pixels.",width:1080,height:1080,ratio:1},
  {slug:"youtube-banner-maker",name:"YouTube Banner Resizer",mode:"resize",group:"Social media",description:"Use the 2560 × 1440 pixel channel art canvas; verify platform safe areas.",width:2560,height:1440},
  {slug:"split-image",name:"Split Image into Tiles",mode:"split",group:"Basic editing",description:"Choose the number of rows and columns and download ZIP.",rows:2,cols:2},
  {slug:"join-multiple-images",name:"Join Multiple Images",mode:"layout",group:"Basic editing",description:"Join multiple images horizontally or vertically.",arrangement:"horizontal"},
  {slug:"image-collage-grid",name:"Image Collage Grid",mode:"layout",group:"Basic editing",description:"Make a configurable tiled collage.",arrangement:"grid"},
  {slug:"merge-photo-signature",name:"Merge Photo and Signature",mode:"layout",group:"Basic editing",description:"Place photo above handwritten signature in one image.",arrangement:"photo-signature"},
  {slug:"image-format-converter",name:"Image Format Converter",mode:"convert",group:"Formats",description:"Convert to JPG, PNG, WebP, BMP, ICO or JFIF in your browser."},
  {slug:"png-to-jpeg",name:"PNG to JPEG",mode:"convert",group:"Formats",description:"Convert PNG to JPEG on a solid backdrop.",output:"jpeg"},
  {slug:"jpeg-to-png",name:"JPEG to PNG",mode:"convert",group:"Formats",description:"Convert JPEG to lossless PNG.",output:"png"},
  {slug:"webp-to-jpg",name:"WEBP to JPG",mode:"convert",group:"Formats",description:"Convert WebP to JPEG.",output:"jpeg"},
  {slug:"webp-to-png",name:"WEBP to PNG",mode:"convert",group:"Formats",description:"Convert WebP to PNG.",output:"png"},
  {slug:"png-to-ico",name:"PNG to ICO",mode:"convert",group:"Formats",description:"Create Windows ICO with embedded 256-pixel PNG.",output:"ico"},
  {slug:"favicon-maker",name:"Favicon Maker",mode:"convert",group:"Formats",description:"Create a valid 256-pixel favicon .ico file.",output:"ico"},
  {slug:"jfif-to-jpg",name:"JFIF to JPG",mode:"convert",group:"Formats",description:"Convert JPEG/JFIF to a standardized .jpg file.",output:"jpeg"},
  {slug:"jpeg-to-jfif",name:"JPEG to JFIF",mode:"convert",group:"Formats",description:"Write a valid JPEG with .jfif extension.",output:"jfif"},
  {slug:"avif-to-jpg",name:"AVIF to JPG (browser supported)",mode:"convert",group:"Formats",description:"Decode AVIF if your browser supports it, then export JPG.",output:"jpeg",note:"Some browsers cannot decode AVIF."},
  {slug:"image-to-a4-pdf",name:"Image to A4 PDF",mode:"pdf",group:"Image to PDF",description:"Export images as PDF pages sized for A4 printing."},
  {slug:"image-pdf-50kb",name:"Image to PDF Under 50 KB",mode:"pdf",group:"Image to PDF",description:"Try to create a single-page PDF below 50 KB.",targetKB:50},
  {slug:"image-pdf-100kb",name:"Image to PDF Under 100 KB",mode:"pdf",group:"Image to PDF",description:"Try to create a single-page PDF below 100 KB.",targetKB:100},
  {slug:"image-pdf-150kb",name:"Image to PDF Under 150 KB",mode:"pdf",group:"Image to PDF",description:"Try to create a single-page PDF below 150 KB.",targetKB:150},
  {slug:"image-pdf-200kb",name:"Image to PDF Under 200 KB",mode:"pdf",group:"Image to PDF",description:"Try to create a single-page PDF below 200 KB.",targetKB:200},
  {slug:"image-pdf-250kb",name:"Image to PDF Under 250 KB",mode:"pdf",group:"Image to PDF",description:"Try to create a single-page PDF below 250 KB.",targetKB:250},
  {slug:"image-pdf-300kb",name:"Image to PDF Under 300 KB",mode:"pdf",group:"Image to PDF",description:"Try to create a single-page PDF below 300 KB.",targetKB:300},
  {slug:"image-pdf-400kb",name:"Image to PDF Under 400 KB",mode:"pdf",group:"Image to PDF",description:"Try to create a single-page PDF below 400 KB.",targetKB:400},
  {slug:"image-pdf-500kb",name:"Image to PDF Under 500 KB",mode:"pdf",group:"Image to PDF",description:"Try to create a single-page PDF below 500 KB.",targetKB:500},
  {slug:"image-pdf-1mb",name:"Image to PDF Under 1 MB",mode:"pdf",group:"Image to PDF",description:"Try to create a single-page PDF below 1 MiB.",targetKB:1024},
  {slug:"image-pdf-2mb",name:"Image to PDF Under 2 MB",mode:"pdf",group:"Image to PDF",description:"Try to create a single-page PDF below 2 MiB.",targetKB:2048},
  {slug:"compress-image-kb",name:"Compress Image in KB",mode:"compress",group:"Compression",description:"Choose a custom maximum size in KiB."},
  {slug:"compress-image-mb",name:"Compress Image in MB",mode:"compress",group:"Compression",description:"Choose a custom maximum size in MiB."},
  {slug:"jpg-to-kb",name:"JPG to Target KB",mode:"compress",group:"Compression",description:"Compress JPG to an editable KiB maximum.",output:"jpeg"},
  {slug:"compress-image-20-50kb",name:"Compress to 20–50 KB",mode:"compress",group:"Compression",description:"Default 50 KiB maximum; can be changed.",targetKB:50},
  {slug:"compress-image-1mb",name:"Compress Image to 1 MB",mode:"compress",group:"Compression",description:"Default 1 MiB maximum; can be changed.",targetKB:1024},
  {slug:"compress-image-2mb",name:"Compress Image to 2 MB",mode:"compress",group:"Compression",description:"Default 2 MiB maximum; can be changed.",targetKB:2048},
  {slug:"image-inspect-quality",name:"Inspect Image Dimensions",mode:"inspect",group:"DPI & quality",description:"Inspect source dimensions, bytes, MIME type and available DPI metadata."}
];

export const EXACT_KB_PRESETS: number[] = [5,10,15,20,25,30,40,50,60,70,80,90,100,150,200,300,500,1024,2048];
export const EXACT_KB_TOOLS: ImageWorkbenchPreset[] = EXACT_KB_PRESETS.map(kb=>({
  slug:`compress-to-${kb}kb`,
  name:kb>=1024?`Compress to ${kb/1024} MiB`:`Compress to ${kb} KB`,
  description:`Attempt a maximum ${kb} KiB output while retaining the selected image dimensions. Actual size is checked.`,
  mode:"compress",group:"Exact KB",targetKB:kb
}));
export const IMAGE_WORKBENCH_TOOLS: ImageWorkbenchPreset[] = [...IMAGE_WORKBENCH_PRESETS,...EXACT_KB_TOOLS];
export const IMAGE_WORKBENCH_BY_SLUG: Record<string,ImageWorkbenchPreset>=Object.fromEntries(
  IMAGE_WORKBENCH_TOOLS.map(item=>[item.slug,item])
);
export const IMAGE_TOOLBOX_GROUPS: ImageWorkbenchGroup[]=[
 "Popular","Basic editing","Effects","DPI & quality","Resize","Exam & ID sizes","Social media","Formats","Image to PDF","Compression","Exact KB"
];

/** Existing working tools are linked rather than duplicated. */
export const EXISTING_IMAGE_TOOLBOX_LINKS: {slug:string;name:string;group:ImageWorkbenchGroup}[] = [
  {slug:"passport-photo-maker",name:"Passport & ID Photo Maker",group:"Popular"},
  {slug:"exam-application-studio",name:"Exam Photo & Signature Resizer",group:"Popular"},
  {slug:"thumb-photo-to-ink",name:"Thumb Photo to Black / Blue Ink (Experimental)",group:"Popular"},
  {slug:"remove-background",name:"AI Background Remover",group:"Popular"},
  {slug:"background-studio",name:"Studio Backdrops",group:"Basic editing"},
  {slug:"crop-image",name:"Crop Image",group:"Basic editing"},
  {slug:"rotate-image",name:"Rotate Image",group:"Basic editing"},
  {slug:"flip-image",name:"Flip Image",group:"Basic editing"},
  {slug:"crop-circle-image",name:"Circle Crop",group:"Basic editing"},
  {slug:"watermark-image",name:"Watermark Image",group:"Basic editing"},
  {slug:"image-merge",name:"Merge Images",group:"Basic editing"},
  {slug:"ocr-image",name:"Image to Text (OCR)",group:"Formats"},
  {slug:"color-extractor",name:"Color Picker",group:"Basic editing"},
  {slug:"image-info",name:"Image Metadata & Info",group:"DPI & quality"},
  {slug:"upscale-image",name:"AI Image Upscaler",group:"DPI & quality"},
  {slug:"passport-photo-maker",name:"Passport Photo Maker",group:"Exam & ID sizes"},
  {slug:"photo-print-sheet",name:"Passport Photo Print Sheets",group:"Exam & ID sizes"},
  {slug:"exam-thumb-photo-ink",name:"Bare Thumb Photo Ink Tool for Exams",group:"Exam & ID sizes"},
  {slug:"gif-maker",name:"GIF Maker",group:"Popular"},
  {slug:"gif-to-images",name:"GIF to Images",group:"Formats"},
  {slug:"image-to-pdf",name:"Images to PDF",group:"Image to PDF"},
  {slug:"compress-image",name:"Compress Image",group:"Compression"}
];
export function asImageTool(item:ImageWorkbenchPreset):Tool {
 return {
  slug:item.slug,name:item.name,description:item.description,
  category:"image",icon:item.mode==="compress"?"ImageDown":item.mode==="pdf"?"FileImage":
    item.mode==="convert"?"ArrowLeftRight":item.mode==="split"?"Grid3X3":
    item.mode==="overlay"?"PenLine":item.mode==="effect"?"Wand2":
    item.mode==="inspect"?"Info":item.mode==="dpi"?"Scan":"Image",
  color:"text-green-500",tags:[item.mode,item.group.toLowerCase(),...item.name.toLowerCase().split(/\s+/)],
  new:true
 };
}
