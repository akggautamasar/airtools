"use client";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Copy, Check, ArrowDownUp, Braces, Hash, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tool } from "@/types";

// Shared client-side text utilities: word counter, JSON formatter,
// Base64 encoder/decoder and hash generator — selected by tool.slug.

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={!value}
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? <><Check className="w-3.5 h-3.5 mr-1.5" />Copied</> : <><Copy className="w-3.5 h-3.5 mr-1.5" />Copy</>}
    </Button>
  );
}

function WordCounter() {
  const [text, setText] = useState("");
  const stats = useMemo(() => {
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const sentences = (text.match(/[.!?]+(\s|$)/g) || []).length;
    const paragraphs = text.trim() ? text.trim().split(/\n\s*\n/).length : 0;
    return {
      words,
      chars: text.length,
      charsNoSpaces: text.replace(/\s/g, "").length,
      sentences,
      paragraphs,
      readingTime: Math.max(1, Math.ceil(words / 200)),
    };
  }, [text]);

  return (
    <div className="space-y-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type or paste your text here..."
        className="w-full h-56 bg-card border border-border rounded-2xl p-4 text-sm resize-y"
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: "Words", value: stats.words },
          { label: "Characters", value: stats.chars },
          { label: "No spaces", value: stats.charsNoSpaces },
          { label: "Sentences", value: stats.sentences },
          { label: "Paragraphs", value: stats.paragraphs },
          { label: "Reading time", value: text.trim() ? `${stats.readingTime} min` : "0 min" },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function JsonFormatter() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  const process = (mode: "format" | "minify") => {
    setError("");
    setOutput("");
    try {
      const parsed = JSON.parse(input);
      setOutput(mode === "format" ? JSON.stringify(parsed, null, 2) : JSON.stringify(parsed));
    } catch (e) {
      setError(e instanceof Error ? `Invalid JSON: ${e.message}` : "Invalid JSON");
    }
  };

  return (
    <div className="space-y-4">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder='{"paste": "your JSON here"}'
        className="w-full h-44 bg-card border border-border rounded-2xl p-4 text-sm font-mono resize-y"
      />
      <div className="grid grid-cols-2 gap-2">
        <Button onClick={() => process("format")} disabled={!input.trim()} variant="gradient"><Braces className="w-4 h-4 mr-2" />Format</Button>
        <Button onClick={() => process("minify")} disabled={!input.trim()} variant="outline">Minify</Button>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      {output && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Result</Label>
            <CopyButton value={output} />
          </div>
          <pre className="bg-card border border-border rounded-2xl p-4 text-sm font-mono max-h-72 overflow-auto whitespace-pre-wrap">{output}</pre>
        </div>
      )}
    </div>
  );
}

function Base64Tool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  const run = (mode: "encode" | "decode") => {
    setError("");
    setOutput("");
    try {
      if (mode === "encode") {
        setOutput(btoa(String.fromCharCode(...new TextEncoder().encode(input))));
      } else {
        const binary = atob(input.trim());
        const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
        setOutput(new TextDecoder().decode(bytes));
      }
    } catch {
      setError("Invalid Base64 input.");
    }
  };

  return (
    <div className="space-y-4">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Text to encode, or Base64 to decode..."
        className="w-full h-44 bg-card border border-border rounded-2xl p-4 text-sm font-mono resize-y"
      />
      <div className="grid grid-cols-2 gap-2">
        <Button onClick={() => run("encode")} disabled={!input} variant="gradient"><ArrowDownUp className="w-4 h-4 mr-2" />Encode</Button>
        <Button onClick={() => run("decode")} disabled={!input} variant="outline">Decode</Button>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      {output && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Result</Label>
            <CopyButton value={output} />
          </div>
          <pre className="bg-card border border-border rounded-2xl p-4 text-sm font-mono max-h-72 overflow-auto whitespace-pre-wrap break-all">{output}</pre>
        </div>
      )}
    </div>
  );
}

function HashGenerator() {
  const [input, setInput] = useState("");
  const [hashes, setHashes] = useState<{ algo: string; hash: string }[]>([]);
  const [processing, setProcessing] = useState(false);

  const generate = async () => {
    setProcessing(true);
    const data = new TextEncoder().encode(input);
    const algos = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"];
    const results = await Promise.all(
      algos.map(async (algo) => {
        const digest = await crypto.subtle.digest(algo, data);
        const hash = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
        return { algo, hash };
      })
    );
    setHashes(results);
    setProcessing(false);
  };

  return (
    <div className="space-y-4">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Text to hash..."
        className="w-full h-36 bg-card border border-border rounded-2xl p-4 text-sm font-mono resize-y"
      />
      <Button onClick={generate} disabled={!input || processing} variant="gradient" size="lg" className="w-full">
        {processing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Hash className="w-4 h-4 mr-2" />}Generate Hashes
      </Button>
      {hashes.length > 0 && (
        <div className="space-y-2">
          {hashes.map((h) => (
            <div key={h.algo} className="bg-card border border-border rounded-2xl p-4 space-y-1">
              <div className="flex items-center justify-between">
                <Label>{h.algo}</Label>
                <CopyButton value={h.hash} />
              </div>
              <p className="text-xs font-mono break-all text-muted-foreground">{h.hash}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TextTools({ tool }: { tool: Tool }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      {tool.slug === "word-counter" && <WordCounter />}
      {tool.slug === "json-formatter" && <JsonFormatter />}
      {tool.slug === "base64-encoder" && <Base64Tool />}
      {tool.slug === "hash-generator" && <HashGenerator />}
    </motion.div>
  );
}
