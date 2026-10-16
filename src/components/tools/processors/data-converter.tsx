"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Copy, ArrowLeftRight } from "lucide-react";
import { Tool } from "@/types";
import { downloadBlob, formatFileSize } from "@/lib/utils";
import { csvToJson, jsonToCsv, DATA_LIMITS } from "@/lib/data-conversion";

export default function DataConverter({ tool }: { tool: Tool }) {
  const toJson = tool.slug === "csv-to-json";
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<{ rows: number; columns: number } | null>(null);
  const [protectFormulas, setProtectFormulas] = useState(true);
  const [filename, setFilename] = useState("converted");

  const clearResult = () => { setOutput(""); setStats(null); setError(""); };

  async function readFile(file?: File) {
    if (!file) return;
    clearResult();
    if (file.size > DATA_LIMITS.chars * 4) {
      setError("Input file is too large. Maximum text input is 2 million characters.");
      return;
    }
    try {
      const text = await file.text();
      if (text.length > DATA_LIMITS.chars) throw new Error("Input exceeds 2 million characters.");
      setInput(text);
      setFilename((file.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]+/g, "_") || "converted"));
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to read file."); }
  }

  function convert() {
    setLoading(true);
    clearResult();
    try {
      if (!input.trim()) throw new Error("Paste text or choose a file first.");
      const result = toJson ? csvToJson(input) : jsonToCsv(input, protectFormulas);
      setOutput(toJson ? "json" in result ? result.json : "" : "csv" in result ? result.csv : "");
      setStats({ rows: result.rows, columns: result.columns });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Conversion failed.");
    } finally { setLoading(false); }
  }

  const ext = toJson ? "json" : "csv";
  const mime = toJson ? "application/json;charset=utf-8" : "text/csv;charset=utf-8";

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Processes text locally in your browser. Maximum 2 million characters, 20,000 rows and 200 columns.
        {toJson ? " CSV columns become JSON string properties; all values remain text." : " Accepts an array of flat JSON objects. Nested arrays/objects are not supported."}
      </p>
      <label className="block rounded-xl border border-dashed border-border bg-card p-5 text-sm">
        <span className="font-medium">Choose {toJson ? "CSV" : "JSON"} file (or paste below)</span>
        <input
          type="file"
          accept={toJson ? ".csv,text/csv" : ".json,application/json"}
          aria-label={toJson ? "Upload CSV file" : "Upload JSON file"}
          className="mt-3 block w-full text-sm"
          onChange={(e) => { void readFile(e.target.files?.[0]); e.target.value = ""; }}
        />
      </label>
      <label className="block text-sm font-semibold" htmlFor="airtools-data-input">Input {toJson ? "CSV" : "JSON"}</label>
      <textarea
        id="airtools-data-input"
        className="w-full rounded-xl border border-border bg-card p-4 font-mono text-sm min-h-48"
        placeholder={toJson ? 'name,city\n"Anne, B.",Delhi' : '[{"name":"Anne","city":"Delhi"}]'}
        value={input}
        maxLength={DATA_LIMITS.chars}
        onChange={(e) => { setInput(e.target.value); clearResult(); }}
      />
      {!toJson && (
        <label className="flex items-start gap-2 text-sm text-muted-foreground">
          <input type="checkbox" checked={protectFormulas} onChange={(e) => { setProtectFormulas(e.target.checked); clearResult(); }} className="mt-1" />
          Prefix possible spreadsheet formulas with an apostrophe for safer CSV opening in Excel. This changes affected cell values.
        </label>
      )}
      <Button size="lg" variant="gradient" disabled={!input.trim() || loading} className="w-full" onClick={convert}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ArrowLeftRight className="w-4 h-4 mr-2" />}
        Convert to {ext.toUpperCase()}
      </Button>
      {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
      {output && (
        <section className="space-y-3 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold">Converted {stats?.rows} rows · {stats?.columns} columns</p>
              <p className="text-xs text-muted-foreground">{formatFileSize(new Blob([output]).size)}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant="outline" onClick={async () => {
                try { await navigator.clipboard.writeText(output); } catch { setError("Clipboard access denied. Use Download instead."); }
              }}><Copy className="w-4 h-4 mr-1" />Copy</Button>
              <Button size="sm" onClick={() => downloadBlob(new Blob([output], { type: mime }), filename + "." + ext)}>
                <Download className="w-4 h-4 mr-1" />Download {ext.toUpperCase()}
              </Button>
            </div>
          </div>
          <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words font-mono text-xs" aria-label="Converted output">{output.slice(0, 12000)}{output.length > 12000 ? "\n… Preview truncated; download contains the full result." : ""}</pre>
        </section>
      )}
    </div>
  );
}
