export const ZIP_LIMITS = Object.freeze({
  archiveBytes: 25 * 1024 * 1024,
  files: 100,
  itemBytes: 20 * 1024 * 1024,
  totalBytes: 80 * 1024 * 1024,
  maxRatio: 200,
});
export interface ZipItemSize { name: string; compressedSize: number; uncompressedSize: number; }
export function safeZipName(name: string): string | null {
  if (!name || name.startsWith("/") || name.startsWith("\\") || /^[a-zA-Z]:/.test(name) || /[\u0000-\u001f\u007f]/.test(name)) return null;
  const parts = name.replace(/\\/g, "/").split("/");
  return parts.some((segment) => !segment || segment === "." || segment === "..") ? null : parts.join("/");
}
export function validateZipEntries(entries: ZipItemSize[], zipBytes: number): void {
  if (!Number.isSafeInteger(zipBytes) || zipBytes < 1 || zipBytes > ZIP_LIMITS.archiveBytes) throw new Error("ZIP must be 25 MiB or smaller.");
  if (entries.length > ZIP_LIMITS.files) throw new Error("ZIP has over 100 files.");
  let total = 0;
  for (const e of entries) {
    if (!safeZipName(e.name)) throw new Error("ZIP contains an unsafe path.");
    if (![e.compressedSize, e.uncompressedSize].every((n) => Number.isSafeInteger(n) && n >= 0)) throw new Error("Invalid ZIP size metadata.");
    if (e.uncompressedSize > ZIP_LIMITS.itemBytes) throw new Error("ZIP entry exceeds 20 MiB.");
    if (e.uncompressedSize > 1024 * 1024 && e.uncompressedSize > Math.max(1, e.compressedSize) * ZIP_LIMITS.maxRatio) throw new Error("Suspicious compression ratio in ZIP.");
    total += e.uncompressedSize;
    if (total > ZIP_LIMITS.totalBytes) throw new Error("ZIP expands beyond 80 MiB.");
  }
}
