/** Pixel-only stylization of details actually present in a supplied photograph.
 * No synthetic ridge generation or biometric matching. */
export type ThumbInk = "black" | "blue" | "grayscale";
export const THUMB_INK_RGB: Record<ThumbInk, readonly [number, number, number]> = {
  black: [0, 0, 0],
  blue: [22, 67, 164],
  grayscale: [55, 55, 55],
};

export function validateThumbSize(width: number, height: number): void {
  if (!Number.isInteger(width) || !Number.isInteger(height) ||
      width < 50 || height < 50 || width > 2000 || height > 2000 ||
      width * height > 4_000_000) {
    throw Error("Enter dimensions from 50 to 2000 px, up to 4 megapixels.");
  }
}

export function thumbCrop(
  originalWidth: number, originalHeight: number,
  outWidth: number, outHeight: number,
  zoom: number, horizontal: number, vertical: number
) {
  if ([originalWidth, originalHeight, outWidth, outHeight, zoom, horizontal, vertical].some(n => !Number.isFinite(n)) ||
      Math.min(originalWidth, originalHeight, outWidth, outHeight) <= 0 ||
      zoom < 1 || zoom > 4 || horizontal < 0 || horizontal > 100 ||
      vertical < 0 || vertical > 100) throw Error("Invalid crop settings.");
  const aspect = outWidth / outHeight;
  const baseWidth = Math.min(originalWidth, originalHeight * aspect);
  const cropWidth = baseWidth / zoom;
  const cropHeight = baseWidth / aspect / zoom;
  return {
    sx: (originalWidth - cropWidth) * horizontal / 100,
    sy: (originalHeight - cropHeight) * vertical / 100,
    sw: cropWidth,
    sh: cropHeight,
  };
}

export function stylizeVisibleThumbDetails(
  rgba: Uint8ClampedArray, width: number, height: number,
  ink: ThumbInk, sensitivity: number, contrast: number
): { detailFraction: number } {
  if (rgba.length !== width * height * 4) throw Error("Invalid image pixel buffer.");
  validateThumbSize(width, height);
  if (!THUMB_INK_RGB[ink] || !Number.isFinite(sensitivity) || sensitivity < 1 || sensitivity > 30 ||
      !Number.isFinite(contrast) || contrast < 1 || contrast > 8) {
    throw Error("Invalid ink or enhancement settings.");
  }
  const count = width * height;
  const gray = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const j = i * 4;
    // The crop is placed on white before reading pixels; account for alpha too.
    const a = rgba[j + 3] / 255;
    const r = rgba[j] * a + 255 * (1 - a);
    const g = rgba[j + 1] * a + 255 * (1 - a);
    const b = rgba[j + 2] * a + 255 * (1 - a);
    gray[i] = .2126 * r + .7152 * g + .0722 * b;
  }
  // Adaptive local comparison removes broad lighting gradients. It does not
  // infer or create detail that the camera failed to capture.
  const stride = width + 1;
  const sums = new Float64Array((height + 1) * stride);
  for (let y = 0; y < height; y++) {
    let row = 0;
    for (let x = 0; x < width; x++) {
      row += gray[y * width + x];
      sums[(y + 1) * stride + x + 1] = sums[y * stride + x + 1] + row;
    }
  }
  const radius = Math.max(3, Math.min(12, Math.round(Math.min(width, height) / 100)));
  const rgb = THUMB_INK_RGB[ink];
  let detected = 0;
  for (let y = 0; y < height; y++) {
    const top = Math.max(0, y - radius), bottom = Math.min(height, y + radius + 1);
    for (let x = 0; x < width; x++) {
      const left = Math.max(0, x - radius), right = Math.min(width, x + radius + 1);
      const average = (sums[bottom * stride + right] - sums[top * stride + right] -
        sums[bottom * stride + left] + sums[top * stride + left]) /
        ((bottom - top) * (right - left));
      const delta = average - gray[y * width + x];
      const amount = Math.max(0, Math.min(1, (delta - sensitivity) * contrast / 16));
      if (amount > .2) detected++;
      const i = (y * width + x) * 4;
      rgba[i] = Math.round(255 + (rgb[0] - 255) * amount);
      rgba[i + 1] = Math.round(255 + (rgb[1] - 255) * amount);
      rgba[i + 2] = Math.round(255 + (rgb[2] - 255) * amount);
      rgba[i + 3] = 255;
    }
  }
  // This measures dark local edges/noise, NOT fingerprint authenticity.
  return { detailFraction: detected / count };
}
