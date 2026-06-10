"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Loader2, FileSignature, ChevronLeft, ChevronRight, CheckCircle2, Upload, X } from "lucide-react";
import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts } from "pdf-lib";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tool } from "@/types";
import { downloadBlob } from "@/lib/utils";
import { canvasToBlob } from "@/lib/pdf-client";

const PART1_FIELDS: { key: string; label: string }[] = [
  { key: "name", label: "Name of the Probationer" },
  { key: "empId", label: "Employee ID" },
  { key: "designation", label: "Designation" },
  { key: "dob", label: "Date of Birth" },
  { key: "qualification", label: "Educational Qualification" },
  { key: "appointmentDate", label: "Date of appointment as probationer" },
  { key: "probationEndDate", label: "Date of completion of present probation period" },
  { key: "extensions", label: "Details of extensions of probation if any" },
  { key: "emrs", label: "EMRS(s) in which employed during the year" },
  { key: "leavePeriod", label: "Period of absence from duty for leave etc. during the year" },
  { key: "training", label: "Details of training course attended & examination / test passed" },
  { key: "experience", label: "Total experience prior to appointment on probation" },
];

const RATING_LABELS = [
  "Exceeds requirement of the job",
  "Fully meets the requirement of the job",
  "Just meets the requirement of the job",
  "Partially meets the requirement of the job",
  "Does not meet requirement of the job",
];
const RATING_SHORT = ["Exceeds", "Fully meets", "Just meets", "Partially meets", "Does not meet"];

const PART2_SECTIONS: { title: string; items: { key: string; label: string }[] }[] = [
  {
    title: "I. Mental capacity",
    items: [
      { key: "mc1", label: "Efforts made to acquire knowledge relevant to job" },
      { key: "mc2", label: "Analytical ability" },
      { key: "mc3", label: "Power of grasping" },
      { key: "mc4", label: "Spirit of inquiry" },
      { key: "mc5a", label: "Power of expression - (a) Oral" },
      { key: "mc5b", label: "Power of expression - (b) Written" },
      { key: "mc6", label: "Sense of responsibility" },
      { key: "mc7", label: "Ability to participate in discussions & seminars" },
    ],
  },
  {
    title: "II. Work Habits and attitudes",
    items: [
      { key: "wh1", label: "Aptitude (Natural Ability)" },
      { key: "wh2", label: "Interest in work" },
      { key: "wh3", label: "Promptness" },
      { key: "wh4", label: "Initiative" },
      { key: "wh5", label: "Originality" },
      { key: "wh6", label: "Self-reliance (Owns abilities)" },
      { key: "wh7", label: "Manner of performance (whether methodical & orderly)" },
      { key: "wh8", label: "Thoroughness" },
      { key: "wh9", label: "Punctuality" },
      { key: "wh10", label: "Resourcefulness" },
    ],
  },
  {
    title: "III. Stability",
    items: [
      { key: "st1", label: "Poise (Graceful & Balance position)" },
      { key: "st2", label: "Fairness" },
      { key: "st3", label: "Dependability" },
    ],
  },
  {
    title: "IV. Ability to get along",
    items: [
      { key: "ag1", label: "Tact" },
      { key: "ag2a", label: "Dealings with - (a) Subordinates" },
      { key: "ag2b", label: "Dealings with - (b) Fellow officials" },
      { key: "ag2c", label: "Dealings with - (c) Superiors" },
      { key: "ag2d", label: "Dealings with - (d) Public" },
      { key: "ag3", label: "Ability to inspire others" },
    ],
  },
  {
    title: "V. Ability to manage",
    items: [
      { key: "am1", label: "Quality of judgement" },
      { key: "am2", label: "Decision making" },
      { key: "am3", label: "Ability to plan and program" },
      { key: "am4", label: "Direction and control" },
      { key: "am5", label: "Ability to evaluate the work of individuals and projects or schemes" },
    ],
  },
  {
    title: "VI. Physical Fitness",
    items: [{ key: "pf1", label: "State of Health and General fitness" }],
  },
];

const PART3_ROWS = [
  "If firm retention / confirmation",
  "Should be watched for a further period [here list out what improvements are required in the probationer and specify the period for which he is to be watched further]",
  "Would be discharged / terminated from Government service [here give reasons for recommending this course of action].",
];

type ImageKey = "signature" | "name" | "date";
interface ImageField {
  blob: Blob | null;
  preview: string;
  processing: boolean;
}

const IMAGE_FIELD_LABELS: Record<ImageKey, string> = {
  signature: "Signature image",
  name: "Name (handwritten) image",
  date: "Date image",
};

async function fileToPng(file: File, removeBg: boolean): Promise<Blob> {
  if (removeBg) {
    const { removeBackground } = await import("@imgly/background-removal");
    return removeBackground(file);
  }
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0);
  return canvasToBlob(canvas, "image/png");
}

// Word-wraps text to fit within maxWidth, respecting explicit line breaks.
function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  if (!text) return [""];
  const lines: string[] = [];
  for (const para of text.split(/\r?\n/)) {
    if (!para.trim()) {
      lines.push("");
      continue;
    }
    let current = "";
    for (const word of para.split(/\s+/)) {
      const candidate = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth || !current) {
        current = candidate;
      } else {
        lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
  }
  return lines.length ? lines : [""];
}

export default function EMRSSprMaker({ tool }: { tool: Tool }) {
  const [step, setStep] = useState(1);
  const [part1, setPart1] = useState<Record<string, string>>({});
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comments, setComments] = useState("");
  const [removeBg, setRemoveBg] = useState(true);
  const [images, setImages] = useState<Record<ImageKey, ImageField>>({
    signature: { blob: null, preview: "", processing: false },
    name: { blob: null, preview: "", processing: false },
    date: { blob: null, preview: "", processing: false },
  });
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Blob | null>(null);

  const setField = (key: string, value: string) => setPart1((p) => ({ ...p, [key]: value }));
  const setRating = (key: string, idx: number) =>
    setRatings((r) => ({ ...r, [key]: r[key] === idx ? -1 : idx }));

  const handleImageUpload = async (key: ImageKey, file: File | null) => {
    if (!file) return;
    setImages((p) => ({ ...p, [key]: { ...p[key], processing: true } }));
    try {
      const blob = await fileToPng(file, removeBg);
      setImages((p) => ({ ...p, [key]: { blob, preview: URL.createObjectURL(blob), processing: false } }));
    } catch (e) {
      console.error(e);
      setError(`Failed to process the ${IMAGE_FIELD_LABELS[key].toLowerCase()}.`);
      setImages((p) => ({ ...p, [key]: { ...p[key], processing: false } }));
    }
  };

  const removeImage = (key: ImageKey) => {
    setImages((p) => ({ ...p, [key]: { blob: null, preview: "", processing: false } }));
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError("");
    setResult(null);
    try {
      const doc = await PDFDocument.create();
      const helv = await doc.embedFont(StandardFonts.Helvetica);
      const helvBold = await doc.embedFont(StandardFonts.HelveticaBold);
      const helvOblique = await doc.embedFont(StandardFonts.HelveticaOblique);
      const helvBoldOblique = await doc.embedFont(StandardFonts.HelveticaBoldOblique);

      const PAGE_W = 595.28;
      const PAGE_H = 841.89;
      const MARGIN = 36;
      const CONTENT_W = PAGE_W - MARGIN * 2;
      const INK = rgb(0.07, 0.13, 0.6); // blue pen for typed-in entries
      const TICK = rgb(0.05, 0.45, 0.1); // green pen for tick marks
      const BORDER = rgb(0.15, 0.15, 0.15);

      let page: PDFPage = doc.addPage([PAGE_W, PAGE_H]);
      let y = PAGE_H - MARGIN;

      const newPage = () => {
        page = doc.addPage([PAGE_W, PAGE_H]);
        y = PAGE_H - MARGIN;
      };
      const ensure = (h: number) => {
        if (y - h < MARGIN) newPage();
      };
      const centerText = (text: string, font: PDFFont, size: number) => {
        const w = font.widthOfTextAtSize(text, size);
        page.drawText(text, { x: (PAGE_W - w) / 2, y: y - size, size, font });
        y -= size + 6;
      };
      const drawLines = (lines: string[], x: number, topY: number, font: PDFFont, size: number, color: ReturnType<typeof rgb>, lh: number) => {
        lines.forEach((line, i) => {
          if (line) page.drawText(line, { x, y: topY - (i + 1) * lh + (lh - size) * 0.3, size, font, color });
        });
      };
      const drawCheck = (cx: number, cy: number, size: number) => {
        page.drawLine({ start: { x: cx - size * 0.45, y: cy + size * 0.05 }, end: { x: cx - size * 0.08, y: cy - size * 0.4 }, thickness: 1.5, color: TICK });
        page.drawLine({ start: { x: cx - size * 0.08, y: cy - size * 0.4 }, end: { x: cx + size * 0.55, y: cy + size * 0.5 }, thickness: 1.5, color: TICK });
      };

      // ---------- Header ----------
      page.drawText("Enclosure-B", { x: PAGE_W - MARGIN - helvBold.widthOfTextAtSize("Enclosure-B", 10), y: y - 10, size: 10, font: helvBold });
      y -= 26;
      centerText("NATIONAL EDUCATION SOCIETY FOR TRIBAL STUDENTS", helvBold, 12);
      centerText("SPECIAL PERFORMANCE REPORT FOR 11/22/33 MONTHS", helvBold, 11);
      centerText("(To be filled by Office)", helvOblique, 9);
      y -= 4;
      centerText("PART-I", helvBold, 11);
      y -= 2;

      // ---------- PART-I table ----------
      const NO_W = 24;
      const LABEL_W = 250;
      const VAL_W = CONTENT_W - NO_W - LABEL_W;
      const labelSize = 8.5;
      const valueSize = 10;
      const lh1 = 11;
      const pad = 4;

      PART1_FIELDS.forEach((f, i) => {
        const labelLines = wrapText(f.label, helv, labelSize, LABEL_W - pad * 2);
        const valueLines = wrapText(part1[f.key] || "", helvOblique, valueSize, VAL_W - pad * 2 - 10);
        const rowH = Math.max(labelLines.length, valueLines.length) * lh1 + pad * 2;
        ensure(rowH);
        page.drawRectangle({ x: MARGIN, y: y - rowH, width: NO_W, height: rowH, borderColor: BORDER, borderWidth: 0.75 });
        page.drawRectangle({ x: MARGIN + NO_W, y: y - rowH, width: LABEL_W, height: rowH, borderColor: BORDER, borderWidth: 0.75 });
        page.drawRectangle({ x: MARGIN + NO_W + LABEL_W, y: y - rowH, width: VAL_W, height: rowH, borderColor: BORDER, borderWidth: 0.75 });
        page.drawText(`${i + 1}.`, { x: MARGIN + 5, y: y - lh1 + 1, size: labelSize, font: helv });
        drawLines(labelLines, MARGIN + NO_W + pad, y, helv, labelSize, rgb(0, 0, 0), lh1);
        page.drawText(":", { x: MARGIN + NO_W + LABEL_W + pad, y: y - lh1 + 1, size: 10, font: helv });
        drawLines(valueLines, MARGIN + NO_W + LABEL_W + pad + 10, y, helvOblique, valueSize, INK, lh1);
        y -= rowH;
      });

      // ---------- PART-II table ----------
      newPage();
      centerText("PART-II", helvBold, 11);
      centerText("Performance Grade", helvBold, 11);
      y -= 2;

      const LABEL_W2 = 248;
      const RATE_W = (CONTENT_W - LABEL_W2) / 5;
      const headerSize = 6;
      const headerLh = 7.5;

      const drawPart2Header = () => {
        const headerLines = RATING_LABELS.map((l) => wrapText(l, helvBold, headerSize, RATE_W - 4));
        const headerRowH = Math.max(...headerLines.map((l) => l.length)) * headerLh + 14;
        ensure(headerRowH);
        page.drawRectangle({ x: MARGIN, y: y - headerRowH, width: LABEL_W2, height: headerRowH, borderColor: BORDER, borderWidth: 0.75 });
        page.drawText("(1)", { x: MARGIN + 4, y: y - 12, size: 8, font: helvBold });
        for (let c = 0; c < 5; c++) {
          const cx = MARGIN + LABEL_W2 + c * RATE_W;
          page.drawRectangle({ x: cx, y: y - headerRowH, width: RATE_W, height: headerRowH, borderColor: BORDER, borderWidth: 0.75 });
          page.drawText(`(${c + 2})`, { x: cx + RATE_W / 2 - helvBold.widthOfTextAtSize(`(${c + 2})`, 7) / 2, y: y - 10, size: 7, font: helvBold });
          drawLines(headerLines[c], cx + 2, y - 11, helv, headerSize, rgb(0, 0, 0), headerLh);
        }
        y -= headerRowH;
      };

      drawPart2Header();

      const itemSize = 7.5;
      const itemLh = 9;

      PART2_SECTIONS.forEach((section) => {
        const sectionRowH = 14;
        ensure(sectionRowH);
        page.drawRectangle({ x: MARGIN, y: y - sectionRowH, width: CONTENT_W, height: sectionRowH, borderColor: BORDER, borderWidth: 0.75, color: rgb(0.92, 0.92, 0.94) });
        page.drawText(section.title, { x: MARGIN + 4, y: y - 10, size: 8.5, font: helvBoldOblique });
        y -= sectionRowH;

        section.items.forEach((item) => {
          const labelLines = wrapText(item.label, helv, itemSize, LABEL_W2 - 8);
          const rowH = Math.max(labelLines.length * itemLh + 6, 14);
          if (y - rowH < MARGIN) {
            newPage();
            centerText("PART-II (contd.)", helvBold, 10);
            drawPart2Header();
          }
          page.drawRectangle({ x: MARGIN, y: y - rowH, width: LABEL_W2, height: rowH, borderColor: BORDER, borderWidth: 0.75 });
          drawLines(labelLines, MARGIN + 4, y, helv, itemSize, rgb(0, 0, 0), itemLh);
          const selected = ratings[item.key] ?? -1;
          for (let c = 0; c < 5; c++) {
            const cx = MARGIN + LABEL_W2 + c * RATE_W;
            page.drawRectangle({ x: cx, y: y - rowH, width: RATE_W, height: rowH, borderColor: BORDER, borderWidth: 0.75 });
            if (selected === c) drawCheck(cx + RATE_W / 2, y - rowH / 2, 11);
          }
          y -= rowH;
        });
      });

      // ---------- Comments & signature ----------
      y -= 14;
      ensure(120);
      centerText("COMMENTS", helvBold, 10);
      const commentIntro =
        "General appraisal of the Officer's good and bad qualities in narrative form particularly those related to his integrity and ability to correct himself if his faults are pointed out to him / her.";
      const introLines = wrapText(commentIntro, helvOblique, 8.5, CONTENT_W);
      drawLines(introLines, MARGIN, y, helvOblique, 8.5, rgb(0.25, 0.25, 0.25), 11);
      y -= introLines.length * 11 + 4;

      const commentLines = wrapText(comments, helvOblique, 10, CONTENT_W - 8);
      const commentBoxH = Math.max(commentLines.length * 13 + 10, 50);
      ensure(commentBoxH);
      page.drawRectangle({ x: MARGIN, y: y - commentBoxH, width: CONTENT_W, height: commentBoxH, borderColor: BORDER, borderWidth: 0.75 });
      drawLines(commentLines, MARGIN + 4, y - 4, helvOblique, 10, INK, 13);
      y -= commentBoxH + 16;

      // Signature / Name / Date block (right-aligned)
      ensure(110);
      const blockX = PAGE_W - MARGIN - 200;
      const sigField = images.signature;
      let sigH = 0;
      if (sigField.blob) {
        const bytes = new Uint8Array(await sigField.blob.arrayBuffer());
        const img = await doc.embedPng(bytes);
        const scale = Math.min(150 / img.width, 50 / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        sigH = h;
        page.drawImage(img, { x: blockX + (200 - w) / 2, y: y - h, width: w, height: h });
      }
      y -= Math.max(sigH, 30) + 4;
      page.drawLine({ start: { x: blockX, y }, end: { x: blockX + 200, y }, thickness: 0.75, color: BORDER });
      y -= 12;
      const sigLabel = "Signature of Principal";
      page.drawText(sigLabel, { x: blockX + (200 - helv.widthOfTextAtSize(sigLabel, 9)) / 2, y, size: 9, font: helv });
      y -= 18;

      const drawNamedLine = async (label: string, key: ImageKey) => {
        page.drawText(label, { x: blockX, y, size: 9, font: helv });
        const field = images[key];
        const labelW = helv.widthOfTextAtSize(label, 9);
        if (field.blob) {
          const bytes = new Uint8Array(await field.blob.arrayBuffer());
          const img = await doc.embedPng(bytes);
          const scale = Math.min((200 - labelW - 4) / img.width, 18 / img.height);
          const w = img.width * scale;
          const h = img.height * scale;
          page.drawImage(img, { x: blockX + labelW + 4, y: y - h + 6, width: w, height: h });
        }
        page.drawLine({ start: { x: blockX + labelW + 2, y: y - 2 }, end: { x: blockX + 200, y: y - 2 }, thickness: 0.5, color: BORDER });
        y -= 18;
      };
      await drawNamedLine("Name:", "name");
      await drawNamedLine("Date:", "date");

      // ---------- PART-III ----------
      y -= 10;
      ensure(140);
      centerText("PART-III", helvBold, 11);
      centerText("REMARKS OF THE DEPARTMENTAL CONFIRMATION COMMITTEE", helvBold, 10);
      centerText("(To be filled up by the Committee, when case is referred to it)", helvOblique, 8.5);
      y -= 2;

      const REMARKS_W = 150;
      const DESC_W = CONTENT_W - REMARKS_W;
      PART3_ROWS.forEach((text, i) => {
        const lines = wrapText(text, helv, 8.5, DESC_W - 8);
        const rowH = Math.max(lines.length * 11 + 6, 24);
        ensure(rowH);
        page.drawRectangle({ x: MARGIN, y: y - rowH, width: DESC_W, height: rowH, borderColor: BORDER, borderWidth: 0.75 });
        page.drawRectangle({ x: MARGIN + DESC_W, y: y - rowH, width: REMARKS_W, height: rowH, borderColor: BORDER, borderWidth: 0.75 });
        drawLines(lines, MARGIN + 4, y, helv, 8.5, rgb(0, 0, 0), 11);
        y -= rowH;

        if (i < PART3_ROWS.length - 1) {
          const orH = 18;
          ensure(orH);
          page.drawRectangle({ x: MARGIN, y: y - orH, width: CONTENT_W, height: orH, borderColor: BORDER, borderWidth: 0.75 });
          page.drawText("OR", { x: (PAGE_W - helvBold.widthOfTextAtSize("OR", 9)) / 2, y: y - 13, size: 9, font: helvBold });
          y -= orH;
        }
      });

      const bytes = await doc.save();
      setResult(new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" }));
    } catch (e) {
      console.error(e);
      setError("Failed to generate the SPR PDF. Please check your entries and try again.");
    }
    setGenerating(false);
  };

  const steps = [
    { n: 1, label: "Probationer Details" },
    { n: 2, label: "Performance Grade" },
    { n: 3, label: "Comments & Signature" },
    { n: 4, label: "Generate" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
        {steps.map((s, i) => (
          <div key={s.n} className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setStep(s.n)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all ${
                step === s.n ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-current/10 flex items-center justify-center text-[10px]">{s.n}</span>
              {s.label}
            </button>
            {i < steps.length - 1 && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <p className="text-sm text-muted-foreground">PART-I — Probationer details, exactly as they appear on the EMRS Special Performance Report (11/22/33 months) form.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PART1_FIELDS.map((f) => (
              <div key={f.key} className={f.key === "training" || f.key === "extensions" ? "sm:col-span-2" : ""}>
                <Label className="text-xs">{f.label}</Label>
                <Input value={part1[f.key] || ""} onChange={(e) => setField(f.key, e.target.value)} className="mt-1" />
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {step === 2 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-6 space-y-5">
          <p className="text-sm text-muted-foreground">PART-II — Tap the rating that applies to each factor. The chosen rating is marked with a green tick on the form, just like a pen check.</p>
          {PART2_SECTIONS.map((section) => (
            <div key={section.title} className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">{section.title}</h3>
              <div className="space-y-2">
                {section.items.map((item) => (
                  <div key={item.key} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 border-b border-border/60 pb-2">
                    <span className="text-sm flex-1">{item.label}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {RATING_SHORT.map((label, idx) => (
                        <button
                          key={idx}
                          title={RATING_LABELS[idx]}
                          onClick={() => setRating(item.key, idx)}
                          className={`px-2 py-1 rounded-lg border text-[11px] font-medium transition-all flex items-center gap-1 ${
                            ratings[item.key] === idx
                              ? "border-green-600 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400"
                              : "border-border text-muted-foreground hover:border-primary/40"
                          }`}
                        >
                          {ratings[item.key] === idx && <CheckCircle2 className="w-3 h-3" />}
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {step === 3 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
            <Label>Comments (general appraisal of the officer)</Label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={5}
              placeholder="Write the narrative appraisal here — it will be added in a handwritten-style blue ink font."
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
            />
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <div>
              <p className="font-medium text-sm">Signature, name &amp; date images</p>
              <p className="text-xs text-muted-foreground mt-1">
                Upload a photo of your signature and your handwritten name &amp; date. We&apos;ll remove the background and place them onto the &quot;Signature of Principal / Name / Date&quot; line of the form.
              </p>
            </div>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input type="checkbox" checked={removeBg} onChange={(e) => setRemoveBg(e.target.checked)} className="rounded" />
              Automatically remove background from these images (on-device AI)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(Object.keys(IMAGE_FIELD_LABELS) as ImageKey[]).map((key) => (
                <div key={key} className="space-y-2">
                  <Label className="text-xs">{IMAGE_FIELD_LABELS[key]}</Label>
                  <div
                    className="relative rounded-xl border border-dashed border-border h-24 flex items-center justify-center overflow-hidden"
                    style={{
                      backgroundImage: images[key].preview ? "repeating-conic-gradient(#e5e7eb 0% 25%, #ffffff 0% 50%)" : undefined,
                      backgroundSize: "16px 16px",
                    }}
                  >
                    {images[key].processing ? (
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    ) : images[key].preview ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={images[key].preview} alt={IMAGE_FIELD_LABELS[key]} className="max-h-full max-w-full object-contain p-1" />
                        <button onClick={() => removeImage(key)} className="absolute top-1 right-1 bg-background/80 rounded-full p-1 border border-border">
                          <X className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <label className="flex flex-col items-center gap-1 text-xs text-muted-foreground cursor-pointer">
                        <Upload className="w-4 h-4" />
                        Upload
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(key, e.target.files?.[0] || null)} />
                      </label>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {step === 4 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 text-xs text-blue-700 dark:text-blue-400">
            ℹ️ This generates a 3-page PDF with your PART-I details, PART-II ratings (green tick marks) and PART-III left blank for the confirmation committee. Print it, sign and submit.
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button onClick={handleGenerate} disabled={generating} size="lg" className="w-full" variant="gradient">
            {generating ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Generating...</> : <><FileSignature className="w-4 h-4 mr-2" />Generate SPR PDF</>}
          </Button>

          {result && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-2xl p-6">
              <p className="font-semibold text-green-700 dark:text-green-400 mb-3">SPR Generated!</p>
              <Button onClick={() => downloadBlob(result, `${(part1.name || "EMRS-SPR").replace(/[^\w-]+/g, "_")}-SPR.pdf`)} variant="gradient" size="lg" className="w-full">
                <Download className="w-4 h-4 mr-2" />Download PDF
              </Button>
            </motion.div>
          )}
        </motion.div>
      )}

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1}>
          <ChevronLeft className="w-4 h-4 mr-1" />Back
        </Button>
        {step < 4 && (
          <Button variant="gradient" onClick={() => setStep((s) => Math.min(4, s + 1))}>
            Next<ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}
