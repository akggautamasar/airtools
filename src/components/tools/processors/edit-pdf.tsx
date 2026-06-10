"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import Konva from "konva";
import { Stage, Layer, Image as KonvaImage, Rect, Ellipse, Line, Text as KonvaText, Transformer } from "react-konva";
import { motion } from "framer-motion";
import {
  Download, Loader2, MousePointer2, Type, Square, Circle as CircleIcon,
  Minus, Pencil, Image as ImageIcon, Trash2, Highlighter, Eraser,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { UploadZone } from "@/components/tools/upload-zone";
import { UploadedFile, Tool } from "@/types";
import { downloadBlob, ACCEPTED_PDF_TYPES, generateId } from "@/lib/utils";
import { PDFDocument, rgb, degrees, StandardFonts } from "pdf-lib";

const RENDER_SCALE = 1.5;

type ToolMode = "select" | "text" | "rect" | "circle" | "line" | "draw" | "whiteout" | "highlight" | "image";

interface EditElement {
  id: string;
  type: "text" | "rect" | "circle" | "line" | "draw" | "image";
  x: number;
  y: number;
  width?: number;
  height?: number;
  points?: number[];
  text?: string;
  fontSize?: number;
  color: string;
  strokeWidth?: number;
  opacity?: number;
  rotation?: number;
  src?: string;
  origin?: { x: number; y: number };
}

interface PageData {
  dataUrl: string;
  width: number;
  height: number;
  pdfWidth: number;
  pdfHeight: number;
}

function hexToRgb(hex: string) {
  const m = hex.replace("#", "");
  const bigint = parseInt(m, 16);
  return { r: ((bigint >> 16) & 255) / 255, g: ((bigint >> 8) & 255) / 255, b: (bigint & 255) / 255 };
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(",")[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function useHtmlImage(src?: string): HTMLImageElement | null {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    if (!src) {
      setImg(null);
      return;
    }
    const image = new window.Image();
    image.onload = () => setImg(image);
    image.src = src;
  }, [src]);
  return img;
}

function URLImage(props: Omit<Konva.ImageConfig, "image"> & { src: string }) {
  const { src, ...rest } = props;
  const img = useHtmlImage(src);
  if (!img) return null;
  return <KonvaImage image={img} {...rest} />;
}

const TOOLS: { id: ToolMode; label: string; icon: React.ElementType }[] = [
  { id: "select", label: "Select", icon: MousePointer2 },
  { id: "text", label: "Text", icon: Type },
  { id: "rect", label: "Rectangle", icon: Square },
  { id: "circle", label: "Ellipse", icon: CircleIcon },
  { id: "line", label: "Line", icon: Minus },
  { id: "draw", label: "Draw", icon: Pencil },
  { id: "highlight", label: "Highlight", icon: Highlighter },
  { id: "whiteout", label: "Whiteout", icon: Eraser },
  { id: "image", label: "Image", icon: ImageIcon },
];

export default function EditPDF({ tool }: { tool: Tool }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [pages, setPages] = useState<PageData[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [elementsByPage, setElementsByPage] = useState<Record<number, EditElement[]>>({});
  const [activeTool, setActiveTool] = useState<ToolMode>("select");
  const [color, setColor] = useState("#ef4444");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [fontSize, setFontSize] = useState(20);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<EditElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const stageRef = useRef<Konva.Stage>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const isDrawing = useRef(false);
  const drawingId = useRef<string | null>(null);

  const page = pages[pageIndex];
  const elements = elementsByPage[pageIndex] || [];
  const bgImage = useHtmlImage(page?.dataUrl);

  const addElement = useCallback((el: EditElement) => {
    setElementsByPage((prev) => ({ ...prev, [pageIndex]: [...(prev[pageIndex] || []), el] }));
  }, [pageIndex]);

  const updateElement = useCallback((id: string, patch: Partial<EditElement>) => {
    setElementsByPage((prev) => ({
      ...prev,
      [pageIndex]: (prev[pageIndex] || []).map((el) => (el.id === id ? { ...el, ...patch } : el)),
    }));
  }, [pageIndex]);

  const deleteElement = useCallback((id: string) => {
    setElementsByPage((prev) => ({ ...prev, [pageIndex]: (prev[pageIndex] || []).filter((el) => el.id !== id) }));
    setSelectedId(null);
  }, [pageIndex]);

  const handleFilesChange = async (f: UploadedFile[]) => {
    setFiles(f);
    setPages([]);
    setElementsByPage({});
    setSelectedId(null);
    setPageIndex(0);
    if (!f.length) return;
    setLoading(true);
    try {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
      const bytes = await f[0].file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
      const newPages: PageData[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const pdfPage = await pdf.getPage(i);
        const viewport = pdfPage.getViewport({ scale: RENDER_SCALE });
        const pdfViewport = pdfPage.getViewport({ scale: 1 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;
        await pdfPage.render({ canvas, canvasContext: ctx, viewport }).promise;
        newPages.push({
          dataUrl: canvas.toDataURL(),
          width: viewport.width,
          height: viewport.height,
          pdfWidth: pdfViewport.width,
          pdfHeight: pdfViewport.height,
        });
      }
      setPages(newPages);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (activeTool === "select" || activeTool === "image") {
      if (e.target === e.target.getStage()) setSelectedId(null);
      return;
    }
    const stage = e.target.getStage();
    const pos = stage?.getPointerPosition();
    if (!pos) return;

    const id = generateId();
    let el: EditElement;
    if (activeTool === "text") {
      el = { id, type: "text", x: pos.x, y: pos.y, text: "Double-click to edit", fontSize, color, width: 220 };
      addElement(el);
      setActiveTool("select");
      setSelectedId(id);
      return;
    } else if (activeTool === "draw") {
      el = { id, type: "draw", x: 0, y: 0, points: [pos.x, pos.y], color, strokeWidth };
    } else if (activeTool === "line") {
      el = { id, type: "line", x: 0, y: 0, points: [pos.x, pos.y, pos.x, pos.y], color, strokeWidth };
    } else if (activeTool === "circle") {
      el = { id, type: "circle", x: pos.x, y: pos.y, width: 0, height: 0, color };
    } else {
      const fillColor = activeTool === "whiteout" ? "#ffffff" : activeTool === "highlight" ? "#fde047" : color;
      const opacity = activeTool === "highlight" ? 0.4 : 1;
      el = { id, type: "rect", x: pos.x, y: pos.y, width: 0, height: 0, color: fillColor, opacity };
    }
    isDrawing.current = true;
    drawingId.current = id;
    addElement(el);
  };

  const handleStageMouseMove = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (!isDrawing.current || !drawingId.current) return;
    const stage = e.target.getStage();
    const pos = stage?.getPointerPosition();
    if (!pos) return;
    const id = drawingId.current;
    const current = (elementsByPage[pageIndex] || []).find((el) => el.id === id);
    if (!current) return;

    if (current.type === "draw") {
      updateElement(id, { points: [...(current.points || []), pos.x, pos.y] });
    } else if (current.type === "line") {
      const pts = current.points || [0, 0, 0, 0];
      updateElement(id, { points: [pts[0], pts[1], pos.x, pos.y] });
    } else if (current.type === "circle") {
      const origin = current.origin || { x: current.x, y: current.y };
      updateElement(id, {
        x: (origin.x + pos.x) / 2,
        y: (origin.y + pos.y) / 2,
        width: Math.abs(pos.x - origin.x),
        height: Math.abs(pos.y - origin.y),
        origin,
      });
    } else {
      updateElement(id, { width: pos.x - current.x, height: pos.y - current.y });
    }
  };

  const handleStageMouseUp = () => {
    if (!isDrawing.current || !drawingId.current) return;
    const id = drawingId.current;
    isDrawing.current = false;
    drawingId.current = null;
    const current = (elementsByPage[pageIndex] || []).find((el) => el.id === id);
    if (current?.type === "rect" && ((current.width || 0) < 0 || (current.height || 0) < 0)) {
      const x = (current.width || 0) < 0 ? current.x + (current.width || 0) : current.x;
      const y = (current.height || 0) < 0 ? current.y + (current.height || 0) : current.y;
      updateElement(id, { x, y, width: Math.abs(current.width || 0), height: Math.abs(current.height || 0) });
    }
    setActiveTool("select");
    setSelectedId(id);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      const img = new window.Image();
      img.onload = () => {
        const maxW = 220;
        const ratio = img.width / img.height || 1;
        const w = Math.min(maxW, img.width);
        const h = w / ratio;
        const id = generateId();
        addElement({ id, type: "image", x: 60, y: 60, width: w, height: h, color: "#000000", src });
        setSelectedId(id);
        setActiveTool("select");
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Attach transformer to selected node
  useEffect(() => {
    const tr = trRef.current;
    const stage = stageRef.current;
    if (!tr || !stage) return;
    if (!selectedId) {
      tr.nodes([]);
      tr.getLayer()?.batchDraw();
      return;
    }
    const el = elements.find((e) => e.id === selectedId);
    if (!el || el.type === "draw" || el.type === "line") {
      tr.nodes([]);
      tr.getLayer()?.batchDraw();
      return;
    }
    const node = stage.findOne(`#${selectedId}`);
    if (node) tr.nodes([node]);
    tr.getLayer()?.batchDraw();
  });

  // Keyboard delete
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        deleteElement(selectedId);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedId, deleteElement]);

  const handleTransformEnd = (el: EditElement, node: Konva.Node) => {
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);
    const patch: Partial<EditElement> = { x: node.x(), y: node.y(), rotation: node.rotation() };
    if (el.width !== undefined) patch.width = Math.max(5, el.width * scaleX);
    if (el.height !== undefined) patch.height = Math.max(5, el.height * scaleY);
    if (el.type === "text") patch.fontSize = Math.max(8, (el.fontSize || 16) * scaleY);
    updateElement(el.id, patch);
  };

  const handleExport = async () => {
    if (!files.length || !pages.length) return;
    setExporting(true);
    try {
      const bytes = await files[0].file.arrayBuffer();
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const pdfPages = doc.getPages();
      const font = await doc.embedFont(StandardFonts.Helvetica);

      for (let i = 0; i < pdfPages.length; i++) {
        const pdfPage = pdfPages[i];
        const pData = pages[i];
        if (!pData) continue;
        const scale = pData.width / pData.pdfWidth;
        const els = elementsByPage[i] || [];

        for (const el of els) {
          const c = hexToRgb(el.color);
          const opacity = el.opacity ?? 1;

          if (el.type === "rect") {
            const w = (el.width || 0) / scale;
            const h = (el.height || 0) / scale;
            pdfPage.drawRectangle({
              x: el.x / scale,
              y: pData.pdfHeight - el.y / scale - h,
              width: w,
              height: h,
              color: rgb(c.r, c.g, c.b),
              opacity,
              rotate: degrees(el.rotation || 0),
            });
          } else if (el.type === "circle") {
            pdfPage.drawEllipse({
              x: el.x / scale,
              y: pData.pdfHeight - el.y / scale,
              xScale: (el.width || 0) / 2 / scale,
              yScale: (el.height || 0) / 2 / scale,
              color: rgb(c.r, c.g, c.b),
              opacity,
            });
          } else if (el.type === "line" || el.type === "draw") {
            const pts = el.points || [];
            for (let p = 0; p < pts.length - 2; p += 2) {
              pdfPage.drawLine({
                start: { x: pts[p] / scale, y: pData.pdfHeight - pts[p + 1] / scale },
                end: { x: pts[p + 2] / scale, y: pData.pdfHeight - pts[p + 3] / scale },
                thickness: (el.strokeWidth || 2) / scale,
                color: rgb(c.r, c.g, c.b),
                opacity,
              });
            }
          } else if (el.type === "text") {
            const size = (el.fontSize || 16) / scale;
            pdfPage.drawText(el.text || "", {
              x: el.x / scale,
              y: pData.pdfHeight - el.y / scale - size,
              size,
              font,
              color: rgb(c.r, c.g, c.b),
              rotate: degrees(el.rotation || 0),
              opacity,
            });
          } else if (el.type === "image" && el.src) {
            const imgBytes = dataUrlToBytes(el.src);
            const embedded = el.src.startsWith("data:image/png") ? await doc.embedPng(imgBytes) : await doc.embedJpg(imgBytes);
            const w = (el.width || 0) / scale;
            const h = (el.height || 0) / scale;
            pdfPage.drawImage(embedded, {
              x: el.x / scale,
              y: pData.pdfHeight - el.y / scale - h,
              width: w,
              height: h,
              rotate: degrees(el.rotation || 0),
              opacity,
            });
          }
        }
      }

      const out = await doc.save();
      downloadBlob(new Blob([out.buffer as ArrayBuffer], { type: "application/pdf" }), `edited-${files[0].name}`);
    } catch (e) {
      console.error(e);
    }
    setExporting(false);
  };

  const startTextEdit = (el: EditElement) => setEditingText(el);

  const finishTextEdit = (text: string) => {
    if (editingText) updateElement(editingText.id, { text });
    setEditingText(null);
  };

  return (
    <div className="space-y-6">
      {pages.length === 0 && (
        <UploadZone accept={ACCEPTED_PDF_TYPES} multiple={false} onFilesChange={handleFilesChange} title="Upload PDF to edit" description="Add text, images, shapes, highlights, whiteout and drawings" />
      )}

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {pages.length > 0 && page && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Toolbar */}
          <div className="bg-card border border-border rounded-2xl p-3 flex flex-wrap items-center gap-2">
            {TOOLS.map(({ id, label, icon: Icon }) => (
              id === "image" ? (
                <button
                  key={id}
                  title={label}
                  onClick={() => imageInputRef.current?.click()}
                  className="p-2.5 rounded-xl border-2 border-border text-muted-foreground hover:border-primary/40 transition-all"
                >
                  <Icon className="w-4 h-4" />
                </button>
              ) : (
                <button
                  key={id}
                  title={label}
                  onClick={() => setActiveTool(id)}
                  className={`p-2.5 rounded-xl border-2 transition-all ${activeTool === id ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
                >
                  <Icon className="w-4 h-4" />
                </button>
              )
            ))}
            <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

            <div className="h-6 w-px bg-border mx-1" />

            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-9 h-9 rounded-lg border border-border cursor-pointer bg-transparent" title="Color" />

            {(activeTool === "draw" || activeTool === "line") && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Width</span>
                <input type="range" min={1} max={20} value={strokeWidth} onChange={(e) => setStrokeWidth(Number(e.target.value))} className="w-20 accent-primary" />
              </div>
            )}
            {activeTool === "text" && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Size</span>
                <input type="range" min={8} max={72} value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-20 accent-primary" />
              </div>
            )}

            <div className="h-6 w-px bg-border mx-1" />

            <button
              title="Delete selected"
              disabled={!selectedId}
              onClick={() => selectedId && deleteElement(selectedId)}
              className="p-2.5 rounded-xl border-2 border-border text-muted-foreground hover:border-red-400 hover:text-red-500 disabled:opacity-40 transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <div className="ml-auto flex items-center gap-2">
              <button onClick={() => { setPageIndex((p) => Math.max(0, p - 1)); setSelectedId(null); }} disabled={pageIndex === 0} className="p-2 rounded-lg border border-border disabled:opacity-40">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-muted-foreground">Page {pageIndex + 1} / {pages.length}</span>
              <button onClick={() => { setPageIndex((p) => Math.min(pages.length - 1, p + 1)); setSelectedId(null); }} disabled={pageIndex === pages.length - 1} className="p-2 rounded-lg border border-border disabled:opacity-40">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Canvas */}
          <div className="bg-muted/40 border border-border rounded-2xl p-4 overflow-auto flex justify-center">
            <div className="relative" style={{ width: page.width, height: page.height }}>
              <Stage
                ref={stageRef}
                width={page.width}
                height={page.height}
                onMouseDown={handleStageMouseDown}
                onMouseMove={handleStageMouseMove}
                onMouseUp={handleStageMouseUp}
                onTouchStart={handleStageMouseDown}
                onTouchMove={handleStageMouseMove}
                onTouchEnd={handleStageMouseUp}
                className="bg-white shadow-md rounded-lg overflow-hidden"
              >
                <Layer>
                  {bgImage && <KonvaImage image={bgImage} width={page.width} height={page.height} listening={false} />}
                </Layer>
                <Layer>
                  {elements.map((el) => {
                    const common = {
                      key: el.id,
                      id: el.id,
                      x: el.x,
                      y: el.y,
                      rotation: el.rotation || 0,
                      draggable: activeTool === "select",
                      onClick: () => setSelectedId(el.id),
                      onTap: () => setSelectedId(el.id),
                      onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => updateElement(el.id, { x: e.target.x(), y: e.target.y() }),
                      onTransformEnd: (e: Konva.KonvaEventObject<Event>) => handleTransformEnd(el, e.target),
                    };

                    switch (el.type) {
                      case "rect":
                        return <Rect {...common} width={el.width} height={el.height} fill={el.color} opacity={el.opacity ?? 1} />;
                      case "circle":
                        return <Ellipse {...common} radiusX={(el.width || 0) / 2} radiusY={(el.height || 0) / 2} fill={el.color} opacity={el.opacity ?? 1} />;
                      case "line":
                      case "draw":
                        return <Line {...common} draggable={false} points={el.points} stroke={el.color} strokeWidth={el.strokeWidth} lineCap="round" lineJoin="round" tension={el.type === "draw" ? 0.4 : 0} hitStrokeWidth={Math.max(10, el.strokeWidth || 2)} />;
                      case "text":
                        return <KonvaText {...common} text={el.text} fontSize={el.fontSize} fill={el.color} width={el.width} onDblClick={() => startTextEdit(el)} onDblTap={() => startTextEdit(el)} />;
                      case "image":
                        return <URLImage {...common} src={el.src || ""} width={el.width} height={el.height} />;
                      default:
                        return null;
                    }
                  })}
                  <Transformer ref={trRef} rotateEnabled flipEnabled={false} boundBoxFunc={(oldBox, newBox) => (newBox.width < 5 || newBox.height < 5 ? oldBox : newBox)} />
                </Layer>
              </Stage>

              {editingText && (
                <textarea
                  autoFocus
                  defaultValue={editingText.text}
                  className="absolute bg-white border border-primary rounded px-1 outline-none resize-none"
                  style={{
                    left: editingText.x,
                    top: editingText.y,
                    width: editingText.width || 200,
                    fontSize: editingText.fontSize,
                    color: editingText.color,
                    lineHeight: 1.2,
                  }}
                  onBlur={(e) => finishTextEdit(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      finishTextEdit((e.target as HTMLTextAreaElement).value);
                    }
                  }}
                />
              )}
            </div>
          </div>

          <Button onClick={handleExport} disabled={exporting} size="lg" className="w-full" variant="gradient">
            {exporting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Exporting...</> : <><Download className="w-4 h-4 mr-2" />Download Edited PDF</>}
          </Button>
        </motion.div>
      )}
    </div>
  );
}
