"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Loader2, Table } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UploadZone } from "@/components/tools/upload-zone";
import { UploadedFile, Tool } from "@/types";
import { downloadBlob, formatFileSize } from "@/lib/utils";

const PAGE_W = 841.89; // A4 landscape for tables
const PAGE_H = 595.28;
const MARGIN = 40;
const FONT_SIZE = 8;
const ROW_H = 14;

export default function ExcelToPDF({ tool }: { tool: Tool }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ blob: Blob; name: string } | null>(null);

  const handleConvert = async () => {
    if (!files.length) return;
    setProcessing(true);
    setResult(null);
    setError("");
    try {
      const f = files[0];
      const XLSX = await import("xlsx");
      const wb = XLSX.read(await f.file.arrayBuffer(), { type: "array" });

      const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
      const pdf = await PDFDocument.create();
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
      const sanitize = (s: string) => s.replace(/[^\x20-\x7E -ÿ]/g, "");

      for (const sheetName of wb.SheetNames) {
        const rows: unknown[][] = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, defval: "" });
        if (!rows.length) continue;

        const colCount = Math.max(...rows.map((r) => r.length));
        const usableW = PAGE_W - MARGIN * 2;
        const colW = Math.max(40, usableW / Math.min(colCount, 20));

        let page = pdf.addPage([PAGE_W, PAGE_H]);
        let y = PAGE_H - MARGIN;
        page.drawText(sanitize(sheetName), { x: MARGIN, y, size: 12, font: bold });
        y -= 22;

        for (let r = 0; r < rows.length; r++) {
          if (y < MARGIN + ROW_H) {
            page = pdf.addPage([PAGE_W, PAGE_H]);
            y = PAGE_H - MARGIN;
          }
          const row = rows[r];
          for (let c = 0; c < Math.min(row.length, 20); c++) {
            let cell = sanitize(String(row[c] ?? ""));
            // truncate to fit the column
            while (cell && font.widthOfTextAtSize(cell, FONT_SIZE) > colW - 6) {
              cell = cell.slice(0, -1);
            }
            if (cell) {
              page.drawText(cell, {
                x: MARGIN + c * colW + 2,
                y: y - FONT_SIZE,
                size: FONT_SIZE,
                font: r === 0 ? bold : font,
                color: rgb(0, 0, 0),
              });
            }
          }
          // light row separator
          page.drawLine({
            start: { x: MARGIN, y: y - ROW_H + 3 },
            end: { x: PAGE_W - MARGIN, y: y - ROW_H + 3 },
            thickness: 0.4,
            color: rgb(0.85, 0.85, 0.85),
          });
          y -= ROW_H;
        }
      }

      if (!pdf.getPageCount()) {
        setError("No data found in this spreadsheet.");
        setProcessing(false);
        return;
      }

      const out = await pdf.save();
      setResult({
        blob: new Blob([out.buffer as ArrayBuffer], { type: "application/pdf" }),
        name: f.name.replace(/\.(xlsx?|csv)$/i, "") + ".pdf",
      });
    } catch (e) {
      console.error(e);
      setError("Failed to convert this spreadsheet.");
    }
    setProcessing(false);
  };

  return (
    <div className="space-y-6">
      <UploadZone
        accept={{
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
          "application/vnd.ms-excel": [".xls"],
          "text/csv": [".csv"],
        }}
        multiple={false}
        onFilesChange={(f) => { setFiles(f); setResult(null); setError(""); }}
        title="Upload Excel spreadsheet"
        description="XLSX, XLS and CSV supported — each sheet becomes a table in the PDF"
      />

      {files.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button onClick={handleConvert} disabled={processing} size="lg" className="w-full" variant="gradient">
            {processing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Converting...</> : <><Table className="w-4 h-4 mr-2" />Convert to PDF</>}
          </Button>
        </motion.div>
      )}

      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-2xl p-6">
          <p className="font-semibold text-green-700 dark:text-green-400 mb-3">Conversion Complete! ({formatFileSize(result.blob.size)})</p>
          <Button onClick={() => downloadBlob(result.blob, result.name)} variant="gradient" size="lg" className="w-full">
            <Download className="w-4 h-4 mr-2" />Download PDF
          </Button>
        </motion.div>
      )}
    </div>
  );
}
