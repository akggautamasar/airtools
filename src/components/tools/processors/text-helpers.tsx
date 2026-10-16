"use client";

import { useState } from "react";
import { ArrowLeftRight, Download, Copy } from "lucide-react";
import { Tool } from "@/types";
import { Button } from "@/components/ui/button";
import { downloadBlob } from "@/lib/utils";
import { lineDiff, parseTimeInput, DiffLine } from "@/lib/text-helpers";

function OutputActions({ content, basename }: { content: string; basename: string }) {
  const [copyError, setCopyError] = useState("");
  return (
    <div className="space-y-2">
      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant="outline" onClick={async () => {
          try { await navigator.clipboard.writeText(content); setCopyError(""); }
          catch { setCopyError("Clipboard unavailable. Use Download."); }
        }}><Copy className="w-4 h-4 mr-1" />Copy</Button>
        <Button size="sm" onClick={() => downloadBlob(new Blob([content], {type:"text/plain;charset=utf-8"}), basename + ".txt")}>
          <Download className="w-4 h-4 mr-1" />Download TXT
        </Button>
      </div>
      {copyError && <p role="alert" className="text-sm text-red-500">{copyError}</p>}
    </div>
  );
}

function UrlEncoding() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState("");
  const process = (encode: boolean) => {
    setError(""); setOutput(null);
    try { setOutput(encode ? encodeURIComponent(input) : decodeURIComponent(input)); }
    catch { setError("Invalid percent-encoded input or UTF-8 sequence."); }
  };
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Encode or decode URL query-component text locally. This is not a whole-URL parser or a validator.</p>
      <label className="block text-sm font-semibold" htmlFor="url-input">Text or encoded component</label>
      <textarea id="url-input" value={input} onChange={(e) => {setInput(e.target.value);setOutput(null);setError("");}} maxLength={100000} className="min-h-36 w-full rounded-xl border border-border bg-card p-4 font-mono text-sm" placeholder="hello world & more" />
      <div className="flex gap-2">
        <Button variant="gradient" disabled={!input} onClick={() => process(true)} className="flex-1">Encode component</Button>
        <Button variant="outline" disabled={!input} onClick={() => process(false)} className="flex-1">Decode component</Button>
      </div>
      {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
      {output !== null && (
        <div className="space-y-3 rounded-xl border border-border bg-card p-4">
          <h3 className="font-semibold">Result</h3>
          <pre className="max-h-60 overflow-auto whitespace-pre-wrap break-all text-sm font-mono">{output || "(empty)"}</pre>
          <OutputActions content={output} basename="url-component" />
        </div>
      )}
    </div>
  );
}

function TimestampConverter() {
  const [input, setInput] = useState("");
  const [info, setInfo] = useState<{iso: string; secs: string; ms: string; local: string} | null>(null);
  const [error, setError] = useState("");
  const run = () => {
    setError(""); setInfo(null);
    try {
      const date = parseTimeInput(input);
      setInfo({iso:date.toISOString(), secs:String(Math.floor(date.getTime()/1000)),ms:String(date.getTime()),local:date.toString()});
    } catch (e) { setError(e instanceof Error ? e.message : "Invalid time."); }
  };
  const summary = info ? "ISO (UTC): " + info.iso + "\nUnix seconds: " + info.secs + "\nUnix milliseconds: " + info.ms + "\nBrowser local: " + info.local + "\n" : "";
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Convert Unix seconds, Unix milliseconds (13+ digits), or an ISO 8601 datetime with an explicit timezone. Browser local time is shown alongside UTC.</p>
      <label className="block text-sm font-semibold" htmlFor="timestamp-input">Timestamp or ISO 8601 value</label>
      <input id="timestamp-input" type="text" value={input} onChange={(e)=>{setInput(e.target.value);setInfo(null);setError("");}} placeholder="2026-10-16T10:00:00Z" className="w-full rounded-xl border border-border bg-card p-3 font-mono text-sm" />
      <Button size="lg" variant="gradient" disabled={!input.trim()} onClick={run} className="w-full">Convert timestamp</Button>
      {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
      {info && (
        <div className="space-y-3 rounded-xl border border-border bg-card p-4">
          {[
            ["ISO 8601 (UTC)", info.iso],
            ["Unix seconds", info.secs],
            ["Unix milliseconds", info.ms],
            ["Local date and time", info.local],
          ].map(([key, value]) => (
            <div key={key} className="border-b border-border pb-2 last:border-0">
              <p className="text-xs text-muted-foreground">{key}</p>
              <p className="break-all font-mono text-sm">{value}</p>
            </div>
          ))}
          <OutputActions content={summary} basename="timestamp" />
        </div>
      )}
    </div>
  );
}

function TextDiffTool() {
  const [before, setBefore] = useState("");
  const [after, setAfter] = useState("");
  const [lines, setLines] = useState<DiffLine[] | null>(null);
  const [error, setError] = useState("");
  const compare = () => {
    setError("");setLines(null);
    try {
      if (before.length > 100000 || after.length > 100000) throw new Error("Each input must be under 100,000 characters.");
      setLines(lineDiff(before,after));
    } catch (e) { setError(e instanceof Error ? e.message : "Comparison failed."); }
  };
  const report = lines?.map((line) => (line.type === "added" ? "+ " : line.type === "removed" ? "- " : "  ") + line.text).join("\n") || "";
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Compare up to 300 lines per side locally using a line-based difference algorithm. Green lines were added; red lines were removed.</p>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-semibold">Original
          <textarea value={before} onChange={(e)=>{setBefore(e.target.value);setLines(null);}} className="mt-2 min-h-60 w-full rounded-xl border border-border bg-card p-3 font-mono text-sm" placeholder="Original text" />
        </label>
        <label className="text-sm font-semibold">Revised
          <textarea value={after} onChange={(e)=>{setAfter(e.target.value);setLines(null);}} className="mt-2 min-h-60 w-full rounded-xl border border-border bg-card p-3 font-mono text-sm" placeholder="Revised text" />
        </label>
      </div>
      <Button variant="gradient" size="lg" className="w-full" disabled={!before && !after} onClick={compare}>
        <ArrowLeftRight className="w-4 h-4 mr-2" />Compare texts
      </Button>
      {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
      {lines && (
        <section className="space-y-3 rounded-xl border border-border bg-card p-4">
          <p className="font-semibold">Differences · {lines.filter((line)=>line.type==="added").length} additions, {lines.filter((line)=>line.type==="removed").length} removals</p>
          <div className="max-h-96 overflow-auto rounded-lg border border-border" aria-label="Text differences">
            {lines.map((line,i)=>(
              <div key={i} className={"whitespace-pre-wrap break-words px-3 py-1 font-mono text-xs " + (line.type==="added" ? "bg-green-100 text-green-900 dark:bg-green-950/40 dark:text-green-200" : line.type==="removed" ? "bg-red-100 text-red-900 dark:bg-red-950/40 dark:text-red-200" : "")}>
                {line.type==="added" ? "+ " : line.type==="removed" ? "- " : "  "}{line.text || " "}
              </div>
            ))}
          </div>
          <OutputActions content={report} basename="text-diff" />
        </section>
      )}
    </div>
  );
}

export default function TextHelpers({tool}: {tool:Tool}) {
  if (tool.slug==="url-encoder") return <UrlEncoding />;
  if (tool.slug==="timestamp-converter") return <TimestampConverter />;
  if (tool.slug==="text-diff") return <TextDiffTool />;
  return <p role="alert">Unsupported text utility.</p>;
}
