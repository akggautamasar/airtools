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
  "image-to-pdf": ImageToPDF,
  "jpg-to-pdf": ImageToPDF,
  "upscale-image": UpscaleImage,
  "compress-image": CompressImage,
  "compress-jpg": CompressImage,
  "compress-jpeg": CompressImage,
  "compress-png": CompressImage,
  "compress-bmp": CompressImage,
  "compress-webp": CompressImage,
  "resize-image": ResizeImage,
  "rotate-image": RotateImage,
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
};

interface Props {
  tool: Tool;
}

export function DynamicToolProcessor({ tool }: Props) {
  const Processor = toolMap[tool.slug] ||
    (tool.category === "pdf" || tool.category === "ebook" ? GenericPDFTool : GenericImageTool);

  return <Processor tool={tool} />;
}
