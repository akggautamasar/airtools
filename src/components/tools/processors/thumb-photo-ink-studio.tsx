"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Download, Fingerprint, Image as ImageIcon, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildExamDownloadFilename } from "@/lib/exam-upload-specs";
import { downloadBlob, formatFileSize } from "@/lib/utils";
import {
  stylizeVisibleThumbDetails, thumbCrop, validateThumbSize, type ThumbInk,
} from "@/lib/thumb-photo-ink";
import type { Tool } from "@/types";

type Source = { file: File; bitmap: ImageBitmap };
type Output = { blob: Blob; name: string; detailFraction: number; meetsLimit: boolean };
type Format = "jpeg" | "png";

const inputClass = "mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm";
const sliderClass = "mt-2 block w-full accent-primary";

function makeThumbImage(
  image: ImageBitmap, width: number, height: number,
  cropZoom: number, cropX: number, cropY: number,
  ink: ThumbInk, sensitivity: number, contrast: number
) {
  validateThumbSize(width, height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw Error("Your browser cannot create a 2D canvas.");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  const crop = thumbCrop(image.width, image.height, width, height, cropZoom, cropX, cropY);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, width, height);
  const pixels = ctx.getImageData(0, 0, width, height);
  const metrics = stylizeVisibleThumbDetails(pixels.data, width, height, ink, sensitivity, contrast);
  ctx.putImageData(pixels, 0, 0);
  return { canvas, ...metrics };
}

function canvasBlob(canvas: HTMLCanvasElement, format: Format, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(Error("Image encoding is unavailable in this browser.")),
      format === "png" ? "image/png" : "image/jpeg", quality);
  });
}

export default function ThumbPhotoInkStudio({ tool }: { tool: Tool }) {
  const [source, setSource] = useState<Source | null>(null);
  const [ink, setInk] = useState<ThumbInk>("black");
  const [width, setWidth] = useState(300);
  const [height, setHeight] = useState(300);
  const [cropZoom, setCropZoom] = useState(1.6);
  const [cropX, setCropX] = useState(50);
  const [cropY, setCropY] = useState(50);
  const [sensitivity, setSensitivity] = useState(7);
  const [contrast, setContrast] = useState(4);
  const [format, setFormat] = useState<Format>("jpeg");
  const [maxKB, setMaxKB] = useState("");
  const [rename, setRename] = useState("");
  const [output, setOutput] = useState<Output | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const previewRef = useRef<HTMLCanvasElement>(null);
  const uploadId = useRef(0);

  useEffect(() => () => { source?.bitmap.close(); }, [source]);
  useEffect(() => {
    if (!source || !previewRef.current) return;
    const scale = Math.min(1, 580 / Math.max(width, height));
    const previewW = Math.max(50, Math.round(width * scale));
    const previewH = Math.max(50, Math.round(height * scale));
    try {
      const rendered = makeThumbImage(
        source.bitmap, previewW, previewH, cropZoom, cropX, cropY, ink, sensitivity, contrast
      );
      const target = previewRef.current;
      if (!target) return;
      target.width = rendered.canvas.width;
      target.height = rendered.canvas.height;
      target.getContext("2d")?.drawImage(rendered.canvas, 0, 0);
    } catch {
      // Invalid in-progress dimensions are reported on export instead.
    }
  }, [source, width, height, cropZoom, cropX, cropY, ink, sensitivity, contrast]);

  const resetOutput = () => {
    setOutput(null);
    setError("");
  };
  async function upload(file: File) {
    const request = ++uploadId.current;
    resetOutput();
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
        file.size > 15 * 1024 * 1024) {
      setError("Choose a JPG, PNG or WebP image no larger than 15 MiB.");
      return;
    }
    try {
      const bitmap = await createImageBitmap(file);
      if (request !== uploadId.current) { bitmap.close(); return; }
      if (bitmap.width * bitmap.height > 30_000_000) {
        bitmap.close();
        throw Error("Choose an image with fewer than 30 megapixels.");
      }
      setSource({ file, bitmap });
      setRename("");
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read this image.");
    }
  }
  async function exportImage() {
    if (!source || busy) return;
    resetOutput();
    setBusy(true);
    try {
      validateThumbSize(width, height);
      const numericKB = maxKB.trim() ? Number(maxKB) : 0;
      if (!Number.isFinite(numericKB) || numericKB < 0 || numericKB > 5000) {
        throw Error("Maximum file size must be empty or between 1 and 5000 KB.");
      }
      if (maxKB.trim() && numericKB < 1) throw Error("Enter a positive KB limit.");
      const rendered = makeThumbImage(
        source.bitmap, width, height, cropZoom, cropX, cropY, ink, sensitivity, contrast
      );
      let blob = await canvasBlob(rendered.canvas, format, .96);
      if (format === "jpeg" && numericKB > 0 && blob.size > numericKB * 1024) {
        for (let quality = .90; quality >= .30 && blob.size > numericKB * 1024; quality -= .06) {
          blob = await canvasBlob(rendered.canvas, format, quality);
        }
      }
      const extension = format === "jpeg" ? "jpg" : "png";
      setOutput({
        blob,
        name: buildExamDownloadFilename(source.file.name, rename, extension),
        detailFraction: rendered.detailFraction,
        meetsLimit: !numericKB || blob.size <= numericKB * 1024,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to process image.");
    } finally {
      setBusy(false);
    }
  }
  const extension = format === "jpeg" ? "jpg" : "png";
  const filename = source ? buildExamDownloadFilename(source.file.name, rename, extension) : "";
  return (
    <div className="space-y-5">
      <section className="space-y-3 rounded-2xl border border-border bg-card p-4 sm:p-6">
        <div className="flex items-center gap-2">
          <Fingerprint className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-bold">{tool.name}</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Upload a photo of your bare thumb and try an experimental ink-style rendering of details
          actually visible in the photograph. Choose black or blue ink. Processing stays on this device.
        </p>
        <div className="flex items-start gap-2 rounded-xl border border-amber-400/50 bg-amber-500/5 p-3 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p>
            This is not a genuine ink impression, biometric scan, or verified fingerprint.
            Phone photos often lack sufficient ridge detail. The filter can also emphasize skin
            creases and camera noise; it never reconstructs missing ridges. For applications
            requiring a real thumb impression, use an actual ink impression photographed or scanned
            as instructed by the application portal.
          </p>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium hover:bg-muted">
          <UploadCloud className="h-4 w-4" />
          {source ? "Replace thumb photo" : "Upload bare thumb photo"}
          <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only"
            onChange={e => { const file = e.target.files?.[0]; if (file) void upload(file); e.target.value = ""; }} />
        </label>
        {source && <p className="break-all text-xs text-muted-foreground">
          <ImageIcon className="mr-1 inline h-3.5 w-3.5" />{source.file.name} ·
          {" " + source.bitmap.width + " × " + source.bitmap.height + " px · "}
          {formatFileSize(source.file.size)}
        </p>}
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(290px,360px)_minmax(0,1fr)]">
        <div className="space-y-5 rounded-2xl border border-border bg-card p-4 sm:p-5">
          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold">Ink appearance</legend>
            <div className="grid grid-cols-3 gap-2">
              {(["black", "blue", "grayscale"] as const).map(choice => (
                <button key={choice} type="button" aria-pressed={ink === choice}
                  onClick={() => { setInk(choice); resetOutput(); }}
                  className={"rounded-lg border px-2 py-3 text-xs font-semibold " +
                    (ink === choice ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted")}>
                  <span aria-hidden="true" className="mx-auto mb-2 block h-5 w-5 rounded-full border border-border"
                    style={{ background: choice === "blue" ? "#1643a4" : choice === "black" ? "#000" : "#777" }} />
                  {choice === "grayscale" ? "Gray" : choice === "black" ? "Black ink" : "Blue ink"}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold">Crop and framing</legend>
            <p className="text-xs text-muted-foreground">The crop starts centered. Adjust to keep the fingertip visible;
              automatic thumb or ridge detection is not claimed.</p>
            <label className="block text-xs">Zoom: {cropZoom.toFixed(1)}×
              <input type="range" min="1" max="4" step=".1" value={cropZoom}
                className={sliderClass} onChange={e => { setCropZoom(Number(e.target.value)); resetOutput(); }} />
            </label>
            <label className="block text-xs">Horizontal position: {cropX}%
              <input type="range" min="0" max="100" step="1" value={cropX}
                className={sliderClass} onChange={e => { setCropX(Number(e.target.value)); resetOutput(); }} />
            </label>
            <label className="block text-xs">Vertical position: {cropY}%
              <input type="range" min="0" max="100" step="1" value={cropY}
                className={sliderClass} onChange={e => { setCropY(Number(e.target.value)); resetOutput(); }} />
            </label>
          </fieldset>
          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold">Visible detail enhancement</legend>
            <label className="block text-xs">Threshold: {sensitivity} (lower reveals more image texture)
              <input type="range" min="1" max="30" step="1" value={sensitivity}
                className={sliderClass} onChange={e => { setSensitivity(Number(e.target.value)); resetOutput(); }} />
            </label>
            <label className="block text-xs">Contrast strength: {contrast}×
              <input type="range" min="1" max="8" step=".5" value={contrast}
                className={sliderClass} onChange={e => { setContrast(Number(e.target.value)); resetOutput(); }} />
            </label>
          </fieldset>
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold">Size and download</legend>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs">Width (px)
                <input type="number" min="50" max="2000" value={width} className={inputClass}
                  onChange={e => { setWidth(Number(e.target.value)); resetOutput(); }} />
              </label>
              <label className="text-xs">Height (px)
                <input type="number" min="50" max="2000" value={height} className={inputClass}
                  onChange={e => { setHeight(Number(e.target.value)); resetOutput(); }} />
              </label>
            </div>
            <label className="block text-xs">Save format
              <select className={inputClass} value={format}
                onChange={e => { setFormat(e.target.value as Format); resetOutput(); }}>
                <option value="jpeg">JPG (adjustable compression)</option>
                <option value="png">PNG (lossless)</option>
              </select>
            </label>
            <label className="block text-xs">Maximum size in KB (optional)
              <input type="number" min="1" max="5000" value={maxKB} placeholder="No limit"
                className={inputClass} onChange={e => { setMaxKB(e.target.value); resetOutput(); }} />
            </label>
            <label className="block text-xs">Rename file (optional)
              <input type="text" maxLength={120} value={rename}
                placeholder={source ? buildExamDownloadFilename(source.file.name, "", extension).replace(/\.[^.]+$/, "") : "Original name + -AirTools"}
                className={inputClass} onChange={e => { setRename(e.target.value); resetOutput(); }} />
            </label>
            {source && <p className="break-all text-xs text-muted-foreground">Download as: {filename}</p>}
          </fieldset>
          {error && <p role="alert" className="rounded-lg border border-red-400/50 p-3 text-sm text-red-600">{error}</p>}
          <Button className="w-full" disabled={!source || busy} onClick={() => { void exportImage(); }}>
            <Download className="mr-2 h-4 w-4" />{busy ? "Processing…" : "Prepare image"}
          </Button>
        </div>
        <section className="min-w-0 space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-6">
          <h3 className="font-semibold">Live ink-style preview</h3>
          {source ? <>
            <div className="flex min-h-72 items-center justify-center rounded-xl bg-white p-4">
              <canvas ref={previewRef} className="max-h-[480px] max-w-full object-contain"
                aria-label="Stylized thumb photo preview on white background" />
            </div>
            <p className="text-xs text-muted-foreground">
              Preview is an image effect, not evidence of a real fingerprint. Actual export uses
              your selected pixel dimensions.
            </p>
          </> : <div className="flex min-h-72 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border text-center text-muted-foreground">
            <Fingerprint className="h-10 w-10" />
            <p className="text-sm">Upload a clear, close-up bare thumb photo to preview black or blue styling.</p>
          </div>}
          {output && <div className="space-y-3 rounded-xl border border-border p-4">
            <p className="font-semibold">Prepared file</p>
            <p className="break-all text-xs text-muted-foreground">{output.name} · {formatFileSize(output.blob.size)}</p>
            {!output.meetsLimit && <p role="alert" className="text-sm text-amber-700 dark:text-amber-400">
              Could not reach the requested KB limit without changing your dimensions. The actual file size is shown above.
            </p>}
            {output.detailFraction < .005 && <p role="alert" className="text-sm text-amber-700 dark:text-amber-400">
              Very little dark local detail was captured. Try a sharper, evenly lit photo or use a genuine ink impression.
            </p>}
            <Button className="w-full" onClick={() => downloadBlob(output.blob, output.name)}>
              <Download className="mr-2 h-4 w-4" />Download {format === "png" ? "PNG" : "JPG"}
            </Button>
          </div>}
          <p className="text-xs text-muted-foreground">
            Need to resize an actual stamped fingerprint? Use the{" "}
            <Link href="/tools/exam-thumb-impression" className="font-semibold text-primary underline">
              Thumb Impression Resizer
            </Link>. This experimental tool should not be used to manufacture or certify biometric evidence.
          </p>
        </section>
      </div>
    </div>
  );
}
