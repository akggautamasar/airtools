"use client";
import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Copy, RefreshCw, Check, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tool } from "@/types";

const CHARS = {
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lower: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?",
};

function generatePassword(length: number, opts: Record<string, boolean>): string {
  let chars = "";
  if (opts.upper) chars += CHARS.upper;
  if (opts.lower) chars += CHARS.lower;
  if (opts.numbers) chars += CHARS.numbers;
  if (opts.symbols) chars += CHARS.symbols;
  if (!chars) chars = CHARS.lower;
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  return password;
}

function getStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 2) return { score, label: "Weak", color: "bg-red-500" };
  if (score <= 4) return { score, label: "Fair", color: "bg-amber-500" };
  if (score <= 5) return { score, label: "Good", color: "bg-blue-500" };
  return { score, label: "Strong", color: "bg-green-500" };
}

export default function PasswordGenerator({ tool }: { tool: Tool }) {
  const [length, setLength] = useState(16);
  const [options, setOptions] = useState({ upper: true, lower: true, numbers: true, symbols: true });
  const [password, setPassword] = useState(() => generatePassword(16, { upper: true, lower: true, numbers: true, symbols: true }));
  const [copied, setCopied] = useState(false);
  const [passwords, setPasswords] = useState<string[]>([]);

  const generate = useCallback(() => {
    const pw = generatePassword(length, options);
    setPassword(pw);
  }, [length, options]);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateBatch = () => {
    const batch = Array.from({ length: 10 }, () => generatePassword(length, options));
    setPasswords(batch);
  };

  const strength = getStrength(password);

  return (
    <div className="space-y-6">
      {/* Password Display */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3 p-4 bg-muted rounded-xl font-mono text-lg break-all">
          <span className="flex-1 select-all">{password}</span>
        </div>

        {/* Strength Meter */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Strength</span>
            <span className={`font-medium ${strength.label === "Weak" ? "text-red-500" : strength.label === "Fair" ? "text-amber-500" : strength.label === "Good" ? "text-blue-500" : "text-green-500"}`}>
              {strength.label}
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className={`h-full ${strength.color} rounded-full transition-all`}
              initial={{ width: 0 }}
              animate={{ width: `${(strength.score / 7) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={copyToClipboard} variant="outline" className="flex-1">
            {copied ? <><Check className="w-4 h-4 mr-2 text-green-500" />Copied!</> : <><Copy className="w-4 h-4 mr-2" />Copy</>}
          </Button>
          <Button onClick={generate} variant="gradient" className="flex-1">
            <RefreshCw className="w-4 h-4 mr-2" />Regenerate
          </Button>
        </div>
      </div>

      {/* Options */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <h3 className="font-semibold">Options</h3>
        <div className="space-y-2">
          <Label>Length: {length} characters</Label>
          <Slider value={[length]} onValueChange={([v]) => { setLength(v); setPassword(generatePassword(v, options)); }} min={4} max={64} step={1} />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>4</span><span>64</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { key: "upper", label: "Uppercase (A-Z)" },
            { key: "lower", label: "Lowercase (a-z)" },
            { key: "numbers", label: "Numbers (0-9)" },
            { key: "symbols", label: "Symbols (!@#$)" },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center gap-3">
              <Switch
                checked={options[key as keyof typeof options]}
                onCheckedChange={(v) => {
                  const newOpts = { ...options, [key]: v };
                  setOptions(newOpts);
                  setPassword(generatePassword(length, newOpts));
                }}
              />
              <Label className="cursor-pointer">{label}</Label>
            </div>
          ))}
        </div>
      </div>

      {/* Batch */}
      <div className="space-y-3">
        <Button onClick={generateBatch} variant="outline" size="lg" className="w-full">
          <Key className="w-4 h-4 mr-2" />Generate 10 Passwords
        </Button>
        {passwords.length > 0 && (
          <div className="space-y-2">
            {passwords.map((pw, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl font-mono text-sm">
                <span className="flex-1 truncate">{pw}</span>
                <button onClick={() => navigator.clipboard.writeText(pw)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
