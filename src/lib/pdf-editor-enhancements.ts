/** Pure page-order and editor-size guards; no PDF data leaves the browser. */
export const PDF_STUDIO_LIMITS = {
  fileBytes: 20 * 1024 * 1024,
  pages: 30,
  renderedPixels: 24_000_000,
  imageBytes: 5 * 1024 * 1024,
} as const;

export function shiftPage(order: readonly number[], from: number, direction: -1 | 1): number[] {
  if (!Number.isInteger(from) || from < 0 || from >= order.length) return [...order];
  const to = from + direction;
  if (to < 0 || to >= order.length) return [...order];
  const result = [...order];
  [result[from], result[to]] = [result[to], result[from]];
  return result;
}
export function dropPage(order: readonly number[], index: number): number[] {
  if (order.length <= 1) throw new Error("PDF must retain at least one page.");
  if (!Number.isInteger(index) || index < 0 || index >= order.length) throw new Error("Invalid page index.");
  return order.filter((_, i) => i !== index);
}
export function isOriginalPageOrder(order: readonly number[], originalPageCount: number): boolean {
  return order.length === originalPageCount && order.every((originalIndex, index) => index === originalIndex);
}
/** Word wrapping for flatten-to-image canvas export, keeping user-specified hard line breaks. */
export function wrapCanvasText(text: string, maxWidth: number, measure: (str: string) => number): string[] {
  if (!Number.isFinite(maxWidth) || maxWidth < 1) return text.split(/\r?\n/);
  const result: string[] = [];
  for (const paragraph of text.split(/\r?\n/)) {
    if (!paragraph) { result.push(""); continue; }
    const words = paragraph.split(/\s+/);
    let line = "";
    for (const word of words) {
      if (!word) continue;
      const test = line ? line + " " + word : word;
      if (line && measure(test) > maxWidth) { result.push(line); line = word; }
      else line = test;
    }
    result.push(line);
  }
  return result;
}
