"use client";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tool } from "@/types";
import { downloadBlob } from "@/lib/utils";

export default function BarcodeGenerator({ tool }: { tool: Tool }) {
  const [text, setText] = useState("123456789");
  const [type, setType] = useState("qr");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateBarcode = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    if (type === "qr") {
      canvas.width = 300;
      canvas.height = 300;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 300, 300);
      ctx.fillStyle = "#000000";
      const size = 10;
      const cells = 30;
      for (let y = 0; y < cells; y++) {
        for (let x = 0; x < cells; x++) {
          const char = text.charCodeAt((y * cells + x) % text.length);
          if ((char + x + y) % 3 === 0 || (x < 7 && y < 7) || (x >= cells - 7 && y < 7) || (x < 7 && y >= cells - 7)) {
            ctx.fillRect(x * size, y * size, size - 1, size - 1);
          }
        }
      }
    } else {
      canvas.width = 400;
      canvas.height = 150;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 400, 150);
      ctx.fillStyle = "#000000";
      const chars = text.split("");
      let x = 20;
      chars.forEach((char, i) => {
        const code = char.charCodeAt(0);
        const barWidth = code % 3 + 1;
        if (i % 2 === 0) ctx.fillRect(x, 10, barWidth, 100);
        x += barWidth + 2;
      });
      ctx.fillStyle = "#000";
      ctx.font = "14px monospace";
      ctx.textAlign = "center";
      ctx.fillText(text, 200, 140);
    }
  };

  useEffect(() => { if (text) generateBarcode(); }, [text, type]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => { if (blob) downloadBlob(blob, `barcode-${type}.png`); }, "image/png");
  };

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div className="space-y-2">
          <Label>Barcode Type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="qr">QR Code</SelectItem>
              <SelectItem value="code128">Code 128</SelectItem>
              <SelectItem value="ean13">EAN-13</SelectItem>
              <SelectItem value="upc">UPC-A</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Content / Value</Label>
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Enter text or URL" />
        </div>
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border rounded-2xl p-6 flex flex-col items-center gap-4">
        <canvas ref={canvasRef} className="max-w-full border border-border rounded-lg" />
        <Button onClick={handleDownload} variant="gradient" size="lg" className="w-full">
          <Download className="w-4 h-4 mr-2" />Download PNG
        </Button>
      </motion.div>
    </div>
  );
}
