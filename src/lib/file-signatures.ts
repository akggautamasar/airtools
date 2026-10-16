/** Signature checks intentionally report unknown when no reliable magic bytes exist. */
export function sniffFileSignature(input: Uint8Array): string {
  if (input.length < 4) return "Unknown / too short";
  const is = (...bytes: number[]) => bytes.every((b, i) => input[i] === b);
  const ascii = (offset: number, text: string) => Array.from(text).every((char, i) => input[offset + i] === char.charCodeAt(0));
  if (ascii(0, "%PDF-")) return "PDF document";
  if (is(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "PNG image";
  if (is(0xff, 0xd8, 0xff)) return "JPEG image";
  if (ascii(0, "GIF87a") || ascii(0, "GIF89a")) return "GIF image";
  if (ascii(0, "RIFF") && ascii(8, "WEBP")) return "WebP image";
  if (ascii(0, "RIFF") && ascii(8, "WAVE")) return "WAV audio";
  if (is(0x50, 0x4b, 0x03, 0x04) || is(0x50, 0x4b, 0x05, 0x06) || is(0x50, 0x4b, 0x07, 0x08)) return "ZIP archive / ZIP-based Office document";
  if (is(0x1f, 0x8b)) return "GZIP archive";
  if (ascii(0, "ID3")) return "MP3 audio (ID3-tagged)";
  if (ascii(4, "ftyp")) return "ISO base media (MP4/HEIF family)";
  if (is(0x42, 0x4d)) return "BMP image";
  if (is(0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c)) return "7z archive";
  return "Unknown (no matching signature)";
}
export function formatHex(input: Uint8Array): string {
  return Array.from(input).map((b) => b.toString(16).padStart(2, "0")).join(" ").toUpperCase();
}
