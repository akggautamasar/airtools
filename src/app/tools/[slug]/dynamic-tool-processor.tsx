"use client";

import dynamic from "next/dynamic";
import { Tool } from "@/types";
import { Loader2 } from "lucide-react";

const processors: Record<string, React.ComponentType<{ tool: Tool }>> = {};

// Lazy load all tool processors
const CompressPDF = dynamic(() => import("@/components/tools/processors/compress-pdf"), { loading: () => <ToolLoader /> });
const MergePDF = dynamic(() => import("@/components/tools/processors/merge-pdf"), { loading: () => <ToolLoader /> });
const SplitPDF = dynamic(() => import("@/components/tools/processors/split-pdf"), { loading: () => <ToolLoader /> });
const RotatePDF = dynamic(() => import("@/components/tools/processors/rotate-pdf"), { loading: () => <ToolLoader /> });
const ProtectPDF = dynamic(() => import("@/components/tools/processors/protect-pdf"), { loading: () => <ToolLoader /> });
const UnlockPDF = dynamic(() => import("@/components/tools/processors/unlock-pdf"), { loading: () => <ToolLoader /> });
const AddWatermark = dynamic(() => import("@/components/tools/processors/add-watermark"), { loading: () => <ToolLoader /> });
const AddPageNumbers = dynamic(() => import("@/components/tools/processors/add-page-numbers"), { loading: () => <ToolLoader /> });
const ResizePDF = dynamic(() => import("@/components/tools/processors/resize-pdf"), { loading: () => <ToolLoader /> });
const RepairPDF = dynamic(() => import("@/components/tools/processors/repair-pdf"), { loading: () => <ToolLoader /> });
const RemoveAnnotations = dynamic(() => import("@/components/tools/processors/remove-annotations"), { loading: () => <ToolLoader /> });
const RenamePDF = dynamic(() => import("@/components/tools/processors/rename-pdf"), { loading: () => <ToolLoader /> });
const ImageToPDF = dynamic(() => import("@/components/tools/processors/image-to-pdf"), { loading: () => <ToolLoader /> });
const UpscaleImage = dynamic(() => import("@/components/tools/processors/upscale-image"), { loading: () => <ToolLoader /> });
const RemoveBackground = dynamic(() => import("@/components/tools/processors/remove-background"), { loading: () => <ToolLoader /> });
const CompressImage = dynamic(() => import("@/components/tools/processors/compress-image"), { loading: () => <ToolLoader /> });
const ResizeImage = dynamic(() => import("@/components/tools/processors/resize-image"), { loading: () => <ToolLoader /> });
const RotateImage = dynamic(() => import("@/components/tools/processors/rotate-image"), { loading: () => <ToolLoader /> });
const ConvertImage = dynamic(() => import("@/components/tools/processors/convert-image"), { loading: () => <ToolLoader /> });
const ZipMaker = dynamic(() => import("@/components/tools/processors/zip-maker"), { loading: () => <ToolLoader /> });
const ZipExtractor = dynamic(() => import("@/components/tools/processors/zip-extractor"), { loading: () => <ToolLoader /> });
const PasswordGenerator = dynamic(() => import("@/components/tools/processors/password-generator"), { loading: () => <ToolLoader /> });
const BarcodeGenerator = dynamic(() => import("@/components/tools/processors/barcode-generator"), { loading: () => <ToolLoader /> });
const ColorExtractor = dynamic(() => import("@/components/tools/processors/color-extractor"), { loading: () => <ToolLoader /> });
const GenericPDFTool = dynamic(() => import("@/components/tools/processors/generic-pdf-tool"), { loading: () => <ToolLoader /> });
const EditPDF = dynamic(() => import("@/components/tools/processors/edit-pdf"), { ssr: false, loading: () => <ToolLoader /> });
const OCRPDF = dynamic(() => import("@/components/tools/processors/ocr-pdf"), { loading: () => <ToolLoader /> });
const GenericImageTool = dynamic(() => import("@/components/tools/processors/generic-image-tool"), { loading: () => <ToolLoader /> });
const PDFToImage = dynamic(() => import("@/components/tools/processors/pdf-to-image"), { loading: () => <ToolLoader /> });
const SelectPagesPDF = dynamic(() => import("@/components/tools/processors/select-pages-pdf"), { loading: () => <ToolLoader /> });
const CropPDF = dynamic(() => import("@/components/tools/processors/crop-pdf"), { loading: () => <ToolLoader /> });
const OrganizePDF = dynamic(() => import("@/components/tools/processors/organize-pdf"), { loading: () => <ToolLoader /> });
const ExtractImagesPDF = dynamic(() => import("@/components/tools/processors/extract-images-pdf"), { loading: () => <ToolLoader /> });
const PDFToTxt = dynamic(() => import("@/components/tools/processors/pdf-to-txt"), { loading: () => <ToolLoader /> });
const TxtToPDF = dynamic(() => import("@/components/tools/processors/txt-to-pdf"), { loading: () => <ToolLoader /> });
const PDFToWord = dynamic(() => import("@/components/tools/processors/pdf-to-word"), { loading: () => <ToolLoader /> });
const WordToPDF = dynamic(() => import("@/components/tools/processors/word-to-pdf"), { loading: () => <ToolLoader /> });
const ExcelToPDF = dynamic(() => import("@/components/tools/processors/excel-to-pdf"), { loading: () => <ToolLoader /> });
const PDFToExcel = dynamic(() => import("@/components/tools/processors/pdf-to-excel"), { loading: () => <ToolLoader /> });
const PDFToPPT = dynamic(() => import("@/components/tools/processors/pdf-to-ppt"), { loading: () => <ToolLoader /> });
const PPTToPDF = dynamic(() => import("@/components/tools/processors/ppt-to-pdf"), { loading: () => <ToolLoader /> });
const EpubToPDF = dynamic(() => import("@/components/tools/processors/epub-to-pdf"), { loading: () => <ToolLoader /> });
const PDFToEpub = dynamic(() => import("@/components/tools/processors/pdf-to-epub"), { loading: () => <ToolLoader /> });
const MobiToPDF = dynamic(() => import("@/components/tools/processors/mobi-to-pdf"), { loading: () => <ToolLoader /> });
const CropImage = dynamic(() => import("@/components/tools/processors/crop-image"), { loading: () => <ToolLoader /> });
const CropCircleImage = dynamic(() => import("@/components/tools/processors/crop-circle-image"), { loading: () => <ToolLoader /> });
const ImageMerge = dynamic(() => import("@/components/tools/processors/image-merge"), { loading: () => <ToolLoader /> });
const PhotoSignatureResize = dynamic(() => import("@/components/tools/processors/photo-signature-resize"), { loading: () => <ToolLoader /> });
const GifMaker = dynamic(() => import("@/components/tools/processors/gif-maker"), { loading: () => <ToolLoader /> });
const GifToImages = dynamic(() => import("@/components/tools/processors/gif-to-images"), { loading: () => <ToolLoader /> });
const FlipImage = dynamic(() => import("@/components/tools/processors/flip-image"), { loading: () => <ToolLoader /> });
const WatermarkImage = dynamic(() => import("@/components/tools/processors/watermark-image"), { loading: () => <ToolLoader /> });
const OCRImage = dynamic(() => import("@/components/tools/processors/ocr-image"), { loading: () => <ToolLoader /> });
const TextTools = dynamic(() => import("@/components/tools/processors/text-tools"), { loading: () => <ToolLoader /> });
const EMRSSprMaker = dynamic(() => import("@/components/tools/processors/emrs-spr-maker"), { loading: () => <ToolLoader /> });

function ToolLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}

const toolMap: Record<string, React.ComponentType<{ tool: Tool }>> = {
  "compress-pdf": CompressPDF,
  "merge-pdf": MergePDF,
  "merge-pdf-image": MergePDF,
  "split-pdf": SplitPDF,
  "rotate-pdf": RotatePDF,
  "protect-pdf": ProtectPDF,
  "unlock-pdf": UnlockPDF,
  "add-watermark": AddWatermark,
  "add-page-numbers": AddPageNumbers,
  "resize-pdf": ResizePDF,
  "repair-pdf": RepairPDF,
  "remove-annotations": RemoveAnnotations,
  "rename-pdf": RenamePDF,
  "edit-pdf": EditPDF,
  "ocr-pdf": OCRPDF,
  "pdf-to-image": PDFToImage,
  "pdf-to-jpg": PDFToImage,
  "remove-pages": SelectPagesPDF,
  "extract-pdf": SelectPagesPDF,
  "crop-pdf": CropPDF,
  "organize-pdf": OrganizePDF,
  "extract-images": ExtractImagesPDF,
  "pdf-to-txt": PDFToTxt,
  "txt-to-pdf": TxtToPDF,
  "pdf-to-word": PDFToWord,
  "word-to-pdf": WordToPDF,
  "excel-to-pdf": ExcelToPDF,
  "pdf-to-excel": PDFToExcel,
  "pdf-to-ppt": PDFToPPT,
  "ppt-to-pdf": PPTToPDF,
  "ebook-to-pdf": EpubToPDF,
  "epub-to-pdf": EpubToPDF,
  "pdf-to-epub": PDFToEpub,
  "pdf-to-mobi": PDFToEpub,
  "pdf-to-azw3": PDFToEpub,
  "mobi-to-pdf": MobiToPDF,
  "azw-to-pdf": MobiToPDF,
  "image-to-pdf": ImageToPDF,
  "jpg-to-pdf": ImageToPDF,
  "upscale-image": UpscaleImage,
  "remove-background": RemoveBackground,
  "compress-image": CompressImage,
  "compress-jpg": CompressImage,
  "compress-jpeg": CompressImage,
  "compress-png": CompressImage,
  "compress-bmp": CompressImage,
  "compress-webp": CompressImage,
  "resize-image": ResizeImage,
  "rotate-image": RotateImage,
  "crop-image": CropImage,
  "crop-circle-image": CropCircleImage,
  "image-merge": ImageMerge,
  "photo-signature-resize": PhotoSignatureResize,
  "gif-maker": GifMaker,
  "gif-to-images": GifToImages,
  "flip-image": FlipImage,
  "watermark-image": WatermarkImage,
  "ocr-image": OCRImage,
  "image-to-jpg": ConvertImage,
  "image-to-png": ConvertImage,
  "image-to-jpeg": ConvertImage,
  "image-to-webp": ConvertImage,
  "image-to-bmp": ConvertImage,
  "zip-maker": ZipMaker,
  "zip-extractor": ZipExtractor,
  "password-generator": PasswordGenerator,
  "barcode-generator": BarcodeGenerator,
  "image-to-color": ColorExtractor,
  "color-extractor": ColorExtractor,
  "word-counter": TextTools,
  "json-formatter": TextTools,
  "base64-encoder": TextTools,
  "hash-generator": TextTools,
  "emrs-spr-maker": EMRSSprMaker,
};

interface Props {
  tool: Tool;
}

export function DynamicToolProcessor({ tool }: Props) {
  const Processor = toolMap[tool.slug] ||
    (tool.category === "pdf" || tool.category === "ebook" ? GenericPDFTool : GenericImageTool);

  return <Processor tool={tool} />;
}
