export const FIELD_KEYS = ["fullName", "dateOfBirth", "fatherName", "motherName"] as const;
export type FieldKey = (typeof FIELD_KEYS)[number];
export type RecordFields = Record<FieldKey, string>;
export interface EvidenceRecord {
  id: string;
  label: string;
  fields: RecordFields;
}
export type ComparisonKind = "exact" | "formatting" | "review" | "different" | "missing";
export interface ComparisonRow {
  documentId: string;
  documentLabel: string;
  field: FieldKey;
  reference: string;
  observed: string;
  kind: ComparisonKind;
  explanation: string;
}
export const FIELD_LABELS: Record<FieldKey, string> = {
  fullName: "Full name",
  dateOfBirth: "Date of birth",
  fatherName: "Parent / father's name",
  motherName: "Mother's name",
};
export function emptyFields(): RecordFields {
  return { fullName: "", dateOfBirth: "", fatherName: "", motherName: "" };
}
export function normalizePersonName(value: string): string {
  return value.normalize("NFKC").toLocaleUpperCase("en").replace(/[^\p{L}\p{N}]+/gu, " ").trim().replace(/\s+/g, " ");
}
function editDistanceAtMostTwo(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 2) return 3;
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      current[j] = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    previous = current;
  }
  return previous[b.length];
}
export function compareField(field: FieldKey, reference: string, observed: string): { kind: ComparisonKind; explanation: string } {
  if (!reference.trim() || !observed.trim()) {
    return { kind: "missing", explanation: "Missing confirmed value in the reference or this document; no match can be established." };
  }
  if (field === "dateOfBirth") {
    return reference === observed
      ? { kind: "exact", explanation: "Confirmed dates match exactly." }
      : { kind: "different", explanation: "Confirmed dates differ. Inspect the original records." };
  }
  if (reference.trim() === observed.trim()) return { kind: "exact", explanation: "Entered names match exactly." };
  const a = normalizePersonName(reference);
  const b = normalizePersonName(observed);
  if (!a || !b) return { kind: "missing", explanation: "A name is missing or contains no readable letters or digits." };
  if (a === b) return { kind: "formatting", explanation: "Only case, spacing or punctuation differs; confirm whether the receiving organization accepts it." };
  const wordsA = a.split(" "), wordsB = b.split(" ");
  if (wordsA.length === wordsB.length && [...wordsA].sort().join(" ") === [...wordsB].sort().join(" ")) {
    return { kind: "review", explanation: "The same name components appear in a different order. Official systems may treat that as a mismatch." };
  }
  if (wordsA.length === wordsB.length && wordsA.every((w, i) => w === wordsB[i] ||
      (w.length === 1 && wordsB[i].startsWith(w)) ||
      (wordsB[i].length === 1 && w.startsWith(wordsB[i])))) {
    return { kind: "review", explanation: "An initial may be expanded or abbreviated; this does not prove both names identify the same person." };
  }
  if (a.length >= 5 && b.length >= 5 && editDistanceAtMostTwo(a, b) <= 2) {
    return { kind: "review", explanation: "The names are similar but not identical. Check for spelling errors, not presumed equivalence." };
  }
  return { kind: "different", explanation: "Different names were entered. Manual document verification is required." };
}
export function compareDocuments(items: EvidenceRecord[], referenceId: string): ComparisonRow[] {
  const reference = items.find((item) => item.id === referenceId);
  if (!reference) throw new Error("Choose a valid reference document.");
  if (items.length < 2) throw new Error("At least two documents are required.");
  const rows: ComparisonRow[] = [];
  for (const other of items) {
    if (other.id === referenceId) continue;
    for (const field of FIELD_KEYS) {
      const checked = compareField(field, reference.fields[field], other.fields[field]);
      rows.push({
        documentId: other.id,
        documentLabel: other.label,
        field,
        reference: reference.fields[field],
        observed: other.fields[field],
        ...checked,
      });
    }
  }
  return rows;
}
export function parseSuggestedDate(input: string): string | null {
  const raw = input.trim();
  let y: number, m: number, d: number;
  let match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (match) { y = Number(match[1]); m = Number(match[2]); d = Number(match[3]); }
  else {
    match = /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/.exec(raw);
    if (!match) return null;
    d = Number(match[1]); m = Number(match[2]); y = Number(match[3]);
  }
  if (y < 1900 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return null;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  return [String(y).padStart(4, "0"), String(m).padStart(2, "0"), String(d).padStart(2, "0")].join("-");
}
export type Suggestions = Partial<Record<FieldKey, string>>;
export function suggestFieldsFromText(text: string): Suggestions {
  const candidates: Suggestions = {};
  // Only labelled lines are suggested; users must explicitly confirm each one.
  const lines = text.slice(0, 60_000).split(/\r?\n/).map((line) => line.replace(/\s+/g, " ").trim()).filter(Boolean);
  for (const line of lines) {
    if (line.length > 160) continue;
    const person = /^(?:(?:candidate|applicant|student|holder|employee|person)\s+)?(?:full\s+)?name\s*[:\-]\s*(.{2,95})$/i.exec(line);
    const father = /^(?:father(?:'s)?\s+name|name\s+of\s+father|parent\s*\/\s*guardian(?:'s)?\s+name)\s*[:\-]\s*(.{2,95})$/i.exec(line);
    const mother = /^(?:mother(?:'s)?\s+name|name\s+of\s+mother)\s*[:\-]\s*(.{2,95})$/i.exec(line);
    const dob = /^(?:date\s+of\s+birth|birth\s+date|dob|d\.o\.b\.)\s*[:\-]\s*(\d{4}-\d{2}-\d{2}|\d{1,2}[\/-]\d{1,2}[\/-]\d{4})/i.exec(line);
    if (person && !candidates.fullName) candidates.fullName = person[1].trim();
    if (father && !candidates.fatherName) candidates.fatherName = father[1].trim();
    if (mother && !candidates.motherName) candidates.motherName = mother[1].trim();
    if (dob && !candidates.dateOfBirth) {
      const parsed = parseSuggestedDate(dob[1]);
      if (parsed) candidates.dateOfBirth = parsed;
    }
  }
  return candidates;
}
export function summarizeComparisons(rows: ComparisonRow[]) {
  return {
    exact: rows.filter((r) => r.kind === "exact").length,
    formatting: rows.filter((r) => r.kind === "formatting").length,
    review: rows.filter((r) => r.kind === "review").length,
    different: rows.filter((r) => r.kind === "different").length,
    missing: rows.filter((r) => r.kind === "missing").length,
  };
}
