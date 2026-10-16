"use client";

import { useMemo, useState } from "react";
import { Download, FileSearch, AlertTriangle, CheckCircle2, Loader2, Trash2, FlaskConical, ScanText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tool } from "@/types";
import { downloadBlob, formatFileSize } from "@/lib/utils";
import { loadPdfJs } from "@/lib/pdf-client";
import {
  FIELD_KEYS, FIELD_LABELS, emptyFields, suggestFieldsFromText,
  compareDocuments, summarizeComparisons,
  type EvidenceRecord, type FieldKey, type Suggestions, type ComparisonKind,
} from "@/lib/consistency-radar";

const MAX_FILES = 8;
const MAX_BYTES = 12 * 1024 * 1024;
const MAX_PAGES = 25;
const MAX_TEXT = 60000;

type DocumentItem = EvidenceRecord & {
  filename: string;
  file?: File;
  extracted: string;
  note: string;
  suggestions: Suggestions;
  busy: boolean;
};

const STATUS: Record<ComparisonKind, { title: string; classes: string }> = {
  exact: { title: "Exact", classes: "text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/40" },
  formatting: { title: "Formatting", classes: "text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/40" },
  review: { title: "Review", classes: "text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/40" },
  different: { title: "Different", classes: "text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-950/40" },
  missing: { title: "Not entered", classes: "text-muted-foreground bg-muted" },
};

function makeRecord(label: string, filename = ""): DocumentItem {
  return {
    id: crypto.randomUUID(),
    label,
    filename,
    fields: emptyFields(),
    extracted: "",
    suggestions: {},
    note: "",
    busy: false,
  };
}

async function extractPdfSelectableText(file: File): Promise<{ text: string; note: string }> {
  const pdfjs = await loadPdfJs();
  const task = pdfjs.getDocument({ data: await file.arrayBuffer() });
  let pdf: Awaited<typeof task.promise> | null = null;
  try {
    pdf = await task.promise;
    const count = Math.min(pdf.numPages, MAX_PAGES);
    const pageText: string[] = [];
    for (let i = 1; i <= count; i++) {
      const page = await pdf.getPage(i);
      const text = await page.getTextContent();
      let previousY: number | null = null;
      let output = "";
      for (const item of text.items) {
        if (!("str" in item)) continue;
        const y = item.transform[5];
        if (previousY !== null && Math.abs(previousY - y) > 2) output += "\n";
        else if (output && !output.endsWith("\n")) output += " ";
        output += item.str;
        previousY = y;
      }
      pageText.push(output);
      page.cleanup();
    }
    return {
      text: pageText.join("\n").slice(0, MAX_TEXT),
      note: pdf.numPages > MAX_PAGES
        ? `Read only the first ${MAX_PAGES} of ${pdf.numPages} PDF pages. Remaining pages were NOT checked.`
        : "Read selectable PDF text. Scanned text without a text layer needs manual entry.",
    };
  } finally { await task.destroy(); }
}

async function readDocument(file: File): Promise<{ text: string; note: string }> {
  if (file.size > MAX_BYTES) throw new Error("Maximum file size is 12 MiB.");
  if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) return extractPdfSelectableText(file);
  if (/\.docx$/i.test(file.name)) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return { text: result.value.slice(0, MAX_TEXT), note: "Read DOCX text without uploading the document. Check all suggestions against the original." };
  }
  if (/\.txt$/i.test(file.name)) {
    return { text: (await file.text()).slice(0, MAX_TEXT), note: "Read plain text from the file." };
  }
  if (/\.(png|jpe?g|webp)$/i.test(file.name)) {
    return { text: "", note: "Image added. Use 'Read image text' for optional local English OCR, or enter fields manually." };
  }
  throw new Error("Unsupported file. Use PDF, DOCX, TXT, JPG, PNG or WebP.");
}

function PanelStatus({ kind }: { kind: ComparisonKind }) {
  const config = STATUS[kind];
  return <span className={"inline-flex rounded-full px-2 py-1 text-xs font-semibold " + config.classes}>{config.title}</span>;
}

export default function ConsistencyRadar({ tool: _tool }: { tool: Tool }) {
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [baseline, setBaseline] = useState("");
  const [error, setError] = useState("");
  const [includeValues, setIncludeValues] = useState(false);
  const [showPreview, setShowPreview] = useState<string | null>(null);

  function updateDoc(id: string, update: Partial<DocumentItem>) {
    setDocs((current) => current.map((doc) => doc.id === id ? { ...doc, ...update } : doc));
  }
  function editField(id: string, field: FieldKey, value: string) {
    setDocs((current) => current.map((doc) => doc.id === id
      ? { ...doc, fields: { ...doc.fields, [field]: value.slice(0, 120) } }
      : doc));
  }
  function clear() {
    setDocs([]);
    setBaseline("");
    setError("");
    setShowPreview(null);
    setIncludeValues(false);
  }
  function demo() {
    const reference = makeRecord("Class 10 certificate", "demo-marksheet.pdf");
    reference.fields = { fullName: "Arun Kumar", dateOfBirth: "2000-06-11", fatherName: "Raj Kumar", motherName: "Sunita Devi" };
    const alternate = makeRecord("Application form", "demo-application.pdf");
    alternate.fields = { fullName: "Arun K", dateOfBirth: "2000-06-12", fatherName: "Raj Kumar", motherName: "" };
    const third = makeRecord("ID record", "demo-id.pdf");
    third.fields = { fullName: "Kumar Arun", dateOfBirth: "2000-06-11", fatherName: "Raj Kumar", motherName: "Sunita Devi" };
    setDocs([reference, alternate, third]);
    setBaseline(reference.id);
    setError("");
  }
  async function addFiles(fileList: FileList | null) {
    const files = Array.from(fileList ?? []);
    if (!files.length) return;
    const slots = MAX_FILES - docs.length;
    if (slots <= 0) { setError("Maximum 8 records. Remove a record before adding another."); return; }
    const selected = files.slice(0, slots).filter((file) => file.size <= MAX_BYTES && file.size > 0);
    if (selected.length !== files.length) setError("Some files were skipped: maximum 8 records and 12 MiB per file.");
    else setError("");
    const added = selected.map((file) => ({ ...makeRecord(file.name.replace(/\.[^.]+$/, ""), file.name), file, busy: true }));
    setDocs((current) => [...current, ...added]);
    if (!baseline && added.length) setBaseline(added[0].id);
    for (const record of added) {
      try {
        const result = await readDocument(record.file!);
        updateDoc(record.id, {
          extracted: result.text,
          suggestions: suggestFieldsFromText(result.text),
          note: result.note,
          busy: false,
        });
      } catch (e) {
        updateDoc(record.id, {
          busy: false,
          note: e instanceof Error ? "Could not extract text: " + e.message + " Enter values manually." : "Could not extract text; enter values manually.",
        });
      }
    }
  }
  async function readImage(id: string) {
    const record = docs.find((d) => d.id === id);
    if (!record?.file || record.busy) return;
    updateDoc(id, { busy: true });
    let worker: Awaited<ReturnType<(typeof import("tesseract.js"))["createWorker"]>> | null = null;
    try {
      const { createWorker } = await import("tesseract.js");
      worker = await createWorker("eng");
      const result = await worker.recognize(record.file);
      const text = result.data.text.slice(0, MAX_TEXT);
      updateDoc(id, {
        extracted: text,
        suggestions: suggestFieldsFromText(text),
        note: "English OCR completed locally. Language assets may be downloaded by the OCR library. OCR can be inaccurate; verify manually.",
        busy: false,
      });
    } catch {
      updateDoc(id, { busy: false, note: "OCR failed or is unavailable on this device. Enter fields manually." });
    } finally { if (worker) await worker.terminate(); }
  }
  function removeDoc(id: string) {
    const remaining = docs.filter((doc) => doc.id !== id);
    setDocs(remaining);
    if (baseline === id) setBaseline(remaining[0]?.id || "");
  }

  const comparisons = useMemo(() => {
    if (!baseline || docs.length < 2) return [];
    return compareDocuments(docs.map(({ id, label, fields }) => ({ id, label, fields })), baseline);
  }, [docs, baseline]);
  const summary = summarizeComparisons(comparisons);
  const unresolved = summary.review + summary.different + summary.missing;
  const report = {
    tool: "AirTools Document Consistency Radar",
    version: 1,
    createdAt: new Date().toISOString(),
    notice: "User-confirmed, heuristic comparisons only. Not an official identity verification, legal determination, or acceptance guarantee.",
    referenceRecord: docs.find((item) => item.id === baseline)?.label || "",
    summary,
    comparisons: comparisons.map((row) => includeValues ? row : {
      documentLabel: row.documentLabel,
      field: row.field,
      kind: row.kind,
      explanation: row.explanation,
    }),
  };
  const reportText = [
    "DOCUMENT CONSISTENCY RADAR — REVIEW REPORT",
    `Reference: ${report.referenceRecord}`,
    `Checks: ${comparisons.length} | Review: ${summary.review} | Different: ${summary.different} | Missing: ${summary.missing}`,
    "Based solely on details confirmed by the user. Check your original records and the receiving organization's rules.",
    "",
    ...comparisons.map((row) => {
      const value = includeValues ? ` | reference: ${row.reference || "(missing)"} | observed: ${row.observed || "(missing)"}` : "";
      return `${row.documentLabel} | ${FIELD_LABELS[row.field]} | ${STATUS[row.kind].title}${value} | ${row.explanation}`;
    }),
    "",
  ].join("\n");

  return (
    <div className="space-y-7">
      <section className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <FileSearch className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold">Before you submit, check your details</h2>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Compare spelling, initials, name order, date of birth and parent names across up to eight records.
          The checker works in your browser and never uploads the files. Extracted text is only a suggestion:
          <strong> you must confirm every field against the original document.</strong>
        </p>
        <p className="text-xs text-amber-700 dark:text-amber-400">
          This is not government verification or legal advice. Small differences can still matter. Scanned PDFs may require manual entry.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={demo} variant="outline" size="sm"><FlaskConical className="w-4 h-4 mr-1" />Try fictional example</Button>
          {docs.length > 0 && <Button type="button" onClick={clear} variant="ghost" size="sm">Clear session</Button>}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">1. Add records</h3>
        <label className="block rounded-2xl border-2 border-dashed border-border bg-card p-5 text-sm cursor-pointer">
          <span className="font-medium">Choose multiple PDF, DOCX, TXT or image files</span>
          <span className="block text-xs text-muted-foreground mt-1">Maximum 8 records, 12 MiB each. PDFs: first 25 pages read. All file processing stays on your device.</span>
          <input
            type="file"
            multiple
            accept=".pdf,.docx,.txt,.jpg,.jpeg,.png,.webp"
            aria-label="Choose documents to compare"
            className="mt-3 block w-full text-sm"
            onChange={(event) => { void addFiles(event.target.files); event.target.value = ""; }}
          />
        </label>
        <Button type="button" variant="outline" disabled={docs.length >= MAX_FILES} onClick={() => {
          const item = makeRecord("Manually entered record " + (docs.length + 1));
          setDocs((current) => [...current, item]);
          if (!baseline) setBaseline(item.id);
        }}>+ Add record without file</Button>
        {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
      </section>

      {docs.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-lg font-semibold">2. Review and confirm details</h3>
          <label className="block rounded-xl border border-border bg-card p-4 space-y-2 text-sm">
            <span className="font-semibold">Reference record (use the relevant official document specified by your application)</span>
            <select value={baseline} onChange={(e) => setBaseline(e.target.value)} className="w-full rounded-lg border border-border bg-background p-2">
              {docs.map((doc) => <option key={doc.id} value={doc.id}>{doc.label}</option>)}
            </select>
          </label>
          <div className="space-y-4">
            {docs.map((doc, index) => (
              <article key={doc.id} className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-4">
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <label htmlFor={"label-" + doc.id} className="block text-xs font-semibold text-muted-foreground">Record {index + 1} {baseline === doc.id ? "· Reference" : ""}</label>
                    <input id={"label-" + doc.id} value={doc.label} maxLength={70} className="w-full rounded-lg border border-border bg-background p-2 text-sm" onChange={(e) => updateDoc(doc.id, { label: e.target.value })} />
                    {doc.filename && <p className="truncate text-xs text-muted-foreground" title={doc.filename}>{doc.filename} {doc.file ? "· " + formatFileSize(doc.file.size) : ""}</p>}
                  </div>
                  <Button type="button" size="sm" variant="ghost" aria-label={"Remove " + doc.label} onClick={() => removeDoc(doc.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
                {doc.busy && <p className="flex items-center gap-2 text-xs text-primary"><Loader2 className="w-4 h-4 animate-spin" />Reading locally…</p>}
                {doc.note && <p className="text-xs text-muted-foreground">{doc.note}</p>}
                {doc.file && /\.(png|jpe?g|webp)$/i.test(doc.file.name) && (
                  <Button type="button" size="sm" variant="outline" disabled={doc.busy} onClick={() => { void readImage(doc.id); }}>
                    <ScanText className="w-4 h-4 mr-1" />Read image text (English OCR)
                  </Button>
                )}
                {doc.extracted && (
                  <div>
                    <button type="button" className="text-xs font-medium text-primary underline" onClick={() => setShowPreview(showPreview === doc.id ? null : doc.id)}>
                      {showPreview === doc.id ? "Hide extracted text" : "Preview extracted text (to locate details)"}
                    </button>
                    {showPreview === doc.id && <pre className="mt-2 max-h-44 overflow-auto rounded-lg bg-muted p-3 whitespace-pre-wrap break-words font-mono text-xs">{doc.extracted.slice(0, 1500)}{doc.extracted.length > 1500 ? "\n… preview truncated" : ""}</pre>}
                  </div>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  {FIELD_KEYS.map((field) => (
                    <div key={field} className="space-y-1">
                      <label htmlFor={doc.id + field} className="block text-sm font-medium">{FIELD_LABELS[field]}</label>
                      <input
                        id={doc.id + field}
                        type={field === "dateOfBirth" ? "date" : "text"}
                        value={doc.fields[field]}
                        placeholder={field === "dateOfBirth" ? "YYYY-MM-DD" : "As written on record"}
                        maxLength={120}
                        onChange={(e) => editField(doc.id, field, e.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      />
                      {doc.suggestions[field] && doc.suggestions[field] !== doc.fields[field] && (
                        <button type="button" className="block text-left text-xs text-primary underline break-all" onClick={() => editField(doc.id, field, doc.suggestions[field]!)}>
                          Use extracted suggestion: {doc.suggestions[field]}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <h3 className="text-lg font-semibold">3. Discrepancy radar</h3>
        {comparisons.length === 0 ? (
          <p className="text-sm text-muted-foreground">Add at least two records and confirm their details to compare them.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
              {(["exact", "formatting", "review", "different", "missing"] as ComparisonKind[]).map((kind) => (
                <div key={kind} className="rounded-xl border border-border p-3">
                  <p className="text-xl font-bold">{summary[kind]}</p>
                  <PanelStatus kind={kind} />
                </div>
              ))}
            </div>
            <div className={"flex gap-2 items-start text-sm " + (unresolved ? "text-amber-700 dark:text-amber-300" : "text-emerald-700 dark:text-emerald-300")}>
              {unresolved ? <AlertTriangle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
              <p>{unresolved ? `${unresolved} field checks need review or more information. This is not a judgement that the records refer to different people.` : "No obvious differences among the entered fields. This does not guarantee acceptance or identity matching."}</p>
            </div>
            <div className="space-y-2 max-h-[32rem] overflow-auto">
              {comparisons.map((row) => (
                <div key={row.documentId + row.field} className="rounded-xl border border-border p-3 text-sm">
                  <div className="flex flex-wrap gap-2 justify-between items-center mb-2">
                    <p className="font-semibold">{row.documentLabel} · {FIELD_LABELS[row.field]}</p>
                    <PanelStatus kind={row.kind} />
                  </div>
                  <p className="text-muted-foreground">{row.explanation}</p>
                  {row.kind !== "exact" && (
                    <div className="mt-2 grid gap-2 sm:grid-cols-2 text-xs">
                      <p className="break-words">Reference: <span className="font-medium">{row.reference || "Not entered"}</span></p>
                      <p className="break-words">Other: <span className="font-medium">{row.observed || "Not entered"}</span></p>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" checked={includeValues} onChange={(e) => setIncludeValues(e.target.checked)} className="mt-1" />
              Include names and dates in the downloaded report (off by default). Reports can contain sensitive personal information.
            </label>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="gradient" onClick={() => downloadBlob(new Blob([reportText], { type: "text/plain;charset=utf-8" }), "document-consistency-review.txt")}>
                <Download className="w-4 h-4 mr-1" />Download review TXT
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => downloadBlob(new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }), "document-consistency-review.json")}>
                <Download className="w-4 h-4 mr-1" />Download JSON
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">No raw OCR text is included in reports. No records are stored in browser local storage. Closing this tab ends the session. Verify discrepancies with the issuing organization.</p>
          </>
        )}
      </section>
    </div>
  );
}
