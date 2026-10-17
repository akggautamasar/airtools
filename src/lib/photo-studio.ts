export type PassportPreset = {
  id: string; label: string; widthMm: number; heightMm: number;
  headMinMm?: number; headMaxMm?: number; note: string; source?: string;
};
export const PASSPORT_PRESETS: PassportPreset[] = [
  { id: "us-passport", label: "United States — printed passport (2 × 2 in)", widthMm: 50.8, heightMm: 50.8,
    headMinMm: 25.4, headMaxMm: 34.9, note: "Original unaltered photo only. Plain white/off-white background; no software-added background or AI edits.",
    source: "https://travel.state.gov/en/passports/apply/help/photos.html" },
  { id: "uk-printed", label: "United Kingdom — printed passport (35 × 45 mm)", widthMm: 35, heightMm: 45,
    headMinMm: 29, headMaxMm: 34, note: "Use an authentic, unaltered photograph. Check current printed-photo rules.",
    source: "https://www.gov.uk/photos-for-passports/photo-requirements" },
  { id: "35x45", label: "General ID / application — 35 × 45 mm", widthMm: 35, heightMm: 45,
    note: "Generic size only; NOT a certified India/Schengen/visa specification. Follow your form's latest instructions." },
  { id: "25x35", label: "General ID / application — 25 × 35 mm", widthMm: 25, heightMm: 35,
    note: "Generic size only. Check the issuing body's rules before use." },
  { id: "50x50", label: "General ID / application — 50 × 50 mm", widthMm: 50, heightMm: 50,
    note: "Generic square size; check specific requirements." },
  { id: "custom", label: "Custom photo dimensions", widthMm: 35, heightMm: 45,
    note: "User-defined crop dimensions, not an official government standard." },
];
export function mmToPixels(mm: number, dpi = 300): number {
  if (!Number.isFinite(mm) || mm <= 0 || !Number.isFinite(dpi) || dpi <= 0) throw Error("Invalid physical dimensions");
  return Math.max(1, Math.round((mm / 25.4) * dpi));
}
export function calculateCoverCrop(imageWidth: number, imageHeight: number, ratio: number, zoom = 1, horizontal = 0.5, vertical = 0.5) {
  if (![imageWidth,imageHeight,ratio,zoom,horizontal,vertical].every(Number.isFinite) ||
      imageWidth <= 0 || imageHeight <= 0 || ratio <= 0 || zoom < 1 ||
      horizontal < 0 || horizontal > 1 || vertical < 0 || vertical > 1) throw Error("Invalid crop parameters");
  const baseW = Math.min(imageWidth, imageHeight * ratio);
  const baseH = baseW / ratio;
  const width = baseW / zoom, height = baseH / zoom;
  const sx = (imageWidth - width) * horizontal;
  const sy = (imageHeight - height) * vertical;
  return { sx, sy, sw: width, sh: height };
}
export function sheetLayout(photoWidthMm: number, photoHeightMm: number, sheetWidthMm: number, sheetHeightMm: number, marginMm=5, gapMm=2) {
  if ([photoWidthMm,photoHeightMm,sheetWidthMm,sheetHeightMm].some(x=>!Number.isFinite(x)||x<=0) ||
      marginMm < 0 || gapMm < 0) throw Error("Invalid sheet settings");
  const cols = Math.max(0, Math.floor((sheetWidthMm - 2*marginMm + gapMm) / (photoWidthMm + gapMm)));
  const rows = Math.max(0, Math.floor((sheetHeightMm - 2*marginMm + gapMm) / (photoHeightMm + gapMm)));
  return { cols, rows, count: cols*rows };
}
