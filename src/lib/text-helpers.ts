export interface DiffLine { type: "same" | "added" | "removed"; text: string; }
export function lineDiff(left: string, right: string, maxLines = 300): DiffLine[] {
  const a = left.replace(/\r\n/g, "\n").split("\n");
  const b = right.replace(/\r\n/g, "\n").split("\n");
  if (a.length > maxLines || b.length > maxLines) throw new Error("Limit: 300 lines per side.");
  // Small LCS matrix (<= 90,000 cells), bounded to keep typing responsive.
  const dp = Array.from({ length: a.length + 1 }, () => new Uint16Array(b.length + 1));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const out: DiffLine[] = [];
  let i = 0, j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) { out.push({type:"same",text:a[i]}); i++; j++; }
    else if (j < b.length && (i === a.length || dp[i][j + 1] >= dp[i + 1][j])) { out.push({type:"added",text:b[j]}); j++; }
    else { out.push({type:"removed",text:a[i]}); i++; }
  }
  return out;
}
export function parseTimeInput(value: string): Date {
  const input = value.trim();
  if (!input) throw new Error("Enter a Unix timestamp or an ISO 8601 date.");
  if (/^-?\d{1,16}$/.test(input)) {
    const num = Number(input);
    const ms = input.replace("-", "").length >= 13 ? num : num * 1000;
    const date = new Date(ms);
    if (Number.isNaN(date.getTime())) throw new Error("Timestamp outside supported date range.");
    return date;
  }
  // Require a timezone for dates to avoid ambiguity across devices.
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/i.test(input)) {
    throw new Error("Use ISO 8601 with timezone, e.g. 2026-10-16T10:00:00Z.");
  }
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) throw new Error("Invalid ISO date/time.");
  return date;
}
