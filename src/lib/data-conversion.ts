/** Local, bounded CSV/JSON conversion. All CSV values are intentionally strings. */
export const DATA_LIMITS = { chars: 2_000_000, rows: 20_000, columns: 200 } as const;

function checkLength(text: string): void {
  if (text.length > DATA_LIMITS.chars) throw new Error("Input exceeds 2 million characters.");
}

export function parseCsv(input: string): { headers: string[]; records: Record<string, string>[] } {
  checkLength(input);
  const source = input.replace(/^\uFEFF/, "");
  if (!source.trim()) throw new Error("CSV is empty.");
  const rows: string[][] = [];
  let row: string[] = [], cell = "", quoted = false, afterQuote = false;
  const finishCell = () => { row.push(cell); cell = ""; afterQuote = false; if (row.length > DATA_LIMITS.columns) throw new Error("CSV has more than 200 columns."); };
  const finishRow = () => { finishCell(); rows.push(row); row = []; if (rows.length > DATA_LIMITS.rows + 1) throw new Error("CSV has more than 20,000 data rows."); };
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (quoted) {
      if (char === '"') {
        if (source[i + 1] === '"') { cell += '"'; i++; }
        else { quoted = false; afterQuote = true; }
      } else cell += char;
    } else if (afterQuote) {
      if (char === ",") finishCell();
      else if (char === "\r" || char === "\n") { finishRow(); if (char === "\r" && source[i + 1] === "\n") i++; }
      else throw new Error("Unexpected character after a closing quote in CSV.");
    } else if (char === '"') {
      if (cell !== "") throw new Error("Unexpected quote inside an unquoted CSV value.");
      quoted = true;
    } else if (char === ",") finishCell();
    else if (char === "\r" || char === "\n") { finishRow(); if (char === "\r" && source[i + 1] === "\n") i++; }
    else cell += char;
  }
  if (quoted) throw new Error("Unclosed quoted CSV value.");
  // The last separator represents a record only if data remains after it.
  if (row.length > 0 || cell !== "" || afterQuote) finishRow();
  if (rows.length === 0) throw new Error("CSV has no header row.");
  const headers = rows[0].map((h) => h.trim());
  if (headers.some((h) => !h)) throw new Error("Every CSV header must have a name.");
  if (new Set(headers).size !== headers.length) throw new Error("Duplicate CSV column names are unsupported.");
  const records = rows.slice(1).map((values, i) => {
    if (values.length !== headers.length) throw new Error(`CSV row ${i + 2} has ${values.length} cells; expected ${headers.length}.`);
    const obj: Record<string, string> = Object.create(null) as Record<string, string>;
    headers.forEach((key, index) => { obj[key] = values[index]; });
    return obj;
  });
  return { headers, records };
}

function csvCell(value: string): string {
  return /[",\r\n]/.test(value) ? '"' + value.replace(/"/g, '""') + '"' : value;
}

export function jsonToCsv(input: string, protectFormulas = true): { csv: string; rows: number; columns: number } {
  checkLength(input);
  const parsed: unknown = JSON.parse(input.replace(/^\uFEFF/, ""));
  if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("JSON must be a nonempty array of flat objects.");
  if (parsed.length > DATA_LIMITS.rows) throw new Error("JSON exceeds 20,000 rows.");
  const keys: string[] = [];
  const seen = new Set<string>();
  for (const [index, row] of parsed.entries()) {
    if (row === null || typeof row !== "object" || Array.isArray(row)) throw new Error(`Row ${index + 1} is not an object.`);
    for (const [key, value] of Object.entries(row as Record<string, unknown>)) {
      if (value !== null && typeof value === "object") throw new Error("Nested objects and arrays cannot be represented as flat CSV.");
      if (!seen.has(key)) { seen.add(key); keys.push(key); }
      if (keys.length > DATA_LIMITS.columns) throw new Error("JSON exceeds 200 columns.");
    }
  }
  if (keys.length === 0 || keys.some((key) => !key)) throw new Error("JSON objects require named properties.");
  const escape = (str: string): string => {
    const safe = protectFormulas && /^[\s\u0000-\u001F]*[=+@-]/.test(str) ? "'" + str : str;
    return csvCell(safe);
  };
  const lines = [keys.map(csvCell).join(",")];
  for (const item of parsed as Record<string, unknown>[]) {
    lines.push(keys.map((key) => {
      const value = item[key];
      return escape(value === null || value === undefined ? "" : String(value));
    }).join(","));
  }
  const csv = lines.join("\r\n") + "\r\n";
  if (csv.length > DATA_LIMITS.chars * 4) throw new Error("Result is too large.");
  return { csv, rows: parsed.length, columns: keys.length };
}

export function csvToJson(input: string): { json: string; rows: number; columns: number } {
  const { headers, records } = parseCsv(input);
  return { json: JSON.stringify(records, null, 2), rows: records.length, columns: headers.length };
}
