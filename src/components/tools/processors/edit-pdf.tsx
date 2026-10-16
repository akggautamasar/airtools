"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import Konva from "konva";
import { Stage, Layer, Image as KonvaImage, Rect, Ellipse, Line, Text as KonvaText, Transformer } from "react-konva";
import { motion } from "framer-motion";
import {
  Download, Loader2, MousePointer2, Type, Square, Circle as CircleIcon,
  Minus, Pencil, Image as ImageIcon, Trash2, Highlighter, Eraser,
  ChevronLeft, ChevronRight, TextCursorInput, Undo2, Redo2, ZoomIn, ZoomOut, Search, Layers2, MoveLeft, MoveRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { UploadZone } from "@/components/tools/upload-zone";
import { UploadedFile, Tool } from "@/types";
import { downloadBlob, ACCEPTED_PDF_TYPES, generateId } from "@/lib/utils";
import { PDFDocument, rgb, degrees, StandardFonts } from "pdf-lib";
import { PDF_STUDIO_LIMITS, shiftPage, dropPage, isOriginalPageOrder, wrapCanvasText } from "@/lib/pdf-editor-enhancements";

const RENDER_SCALE = 1.25;

type ToolMode = "select" | "text" | "edittext" | "rect" | "circle" | "line" | "draw" | "whiteout" | "highlight" | "image";

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

interface TextRegion {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PageData {
  dataUrl: string;
  width: number;
  height: number;
  pdfWidth: number;
  pdfHeight: number;
  textItems: TextRegion[];
}

function hexToRgb(hex: string) {
  const m = hex.replace("#", "");
  const bigint = parseInt(m, 16);
  return { r: ((bigint >> 16) & 255) / 255, g: ((bigint >> 8) & 255) / 255, b: (bigint & 255) / 255 };
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("")}`;
}

function getPixel(imageData: ImageData, x: number, y: number) {
  const px = Math.max(0, Math.min(imageData.width - 1, Math.round(x)));
  const py = Math.max(0, Math.min(imageData.height - 1, Math.round(y)));
  const idx = (py * imageData.width + px) * 4;
  return { r: imageData.data[idx], g: imageData.data[idx + 1], b: imageData.data[idx + 2] };
}

// Sample the background color just outside a text region, and the darkest
// (ink) color inside it, so a replacement can blend in and match.
function sampleRegionColors(imageData: ImageData, box: TextRegion) {
  const bg = getPixel(imageData, box.x - 2, box.y - 2);
  let darkest = { r: 0, g: 0, b: 0 };
  let minLum = Infinity;
  const stepX = Math.max(1, Math.floor(box.width / 12));
  const stepY = Math.max(1, Math.floor(box.height / 6));
  for (let yy = box.y; yy < box.y + box.height; yy += stepY) {
    for (let xx = box.x; xx < box.x + box.width; xx += stepX) {
      const px = getPixel(imageData, xx, yy);
      const lum = px.r + px.g + px.b;
      if (lum < minLum) {
        minLum = lum;
        darkest = px;
      }
    }
  }
  if (!Number.isFinite(minLum)) darkest = { r: 0, g: 0, b: 0 };
  return { bg: rgbToHex(bg.r, bg.g, bg.b), text: rgbToHex(darkest.r, darkest.g, darkest.b) };
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(",")[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function useHtmlImage(src?: string): HTMLImageElement | null {
  const [loaded, setLoaded] = useState<{ src: string; image: HTMLImageElement } | null>(null);
  useEffect(() => {
    if (!src) return;
    let active = true;
    const image = new window.Image();
    image.onload = () => {
      if (active) setLoaded({ src, image });
    };
    image.src = src;
    return () => {
      active = false;
      image.onload = null;
    };
  }, [src]);
  return loaded && loaded.src === src ? loaded.image : null;
}

function URLImage(props: Omit<Konva.ImageConfig, "image"> & { src: string }) {
  const { src, ...rest } = props;
  const img = useHtmlImage(src);
  if (!img) return null;
  return <KonvaImage image={img} {...rest} />;
}

const TOOLS: { id: ToolMode; label: string; icon: React.ElementType }[] = [
  { id: "select", label: "Select", icon: MousePointer2 },
  { id: "edittext", label: "Edit Text", icon: TextCursorInput },
  { id: "text", label: "Add Text", icon: Type },
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
  const [pageOrder, setPageOrder] = useState<number[]>([]);
  const [zoom, setZoom] = useState(0.8);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [exportMode, setExportMode] = useState<"layered" | "flattened">("layered");
  const [undoStack, setUndoStack] = useState<Record<number, EditElement[]>[]>([]);
  const [redoStack, setRedoStack] = useState<Record<number, EditElement[]>[]>([]);
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
  const imageDataCache = useRef<Record<number, ImageData>>({});

  const pageKey = pageOrder[pageIndex] ?? 0;
  const page = pages[pageKey];
  const elements = elementsByPage[pageKey] || [];
  const selectedElement = elements.find((el) => el.id === selectedId);
  const containsVisualCorrections = Object.values(elementsByPage).some((items) => items.some((el) => el.type === "rect" && el.color.toLowerCase() === "#ffffff"));
  const matches = searchQuery.trim().length > 1
    ? pageOrder.flatMap((sourceIndex, displayIndex) => pages[sourceIndex]?.textItems
        .filter((region) => region.text.toLocaleLowerCase().includes(searchQuery.toLocaleLowerCase()))
        .slice(0, 6).map((region) => ({ page: displayIndex, text: region.text })) || []).slice(0, 18)
    : [];
  const saveUndo = useCallback(() => {
    setUndoStack((prev) => [...prev.slice(-29), elementsByPage]);
    setRedoStack([]);
  }, [elementsByPage]);
  const undo = () => {
    const previous = undoStack.at(-1);
    if (!previous) return;
    setRedoStack((prev) => [...prev.slice(-29), elementsByPage]);
    setUndoStack((prev) => prev.slice(0, -1));
    setElementsByPage(previous);
    setSelectedId(null);
  };
  const redo = () => {
    const next = redoStack.at(-1);
    if (!next) return;
    setUndoStack((prev) => [...prev.slice(-29), elementsByPage]);
    setRedoStack((prev) => prev.slice(0, -1));
    setElementsByPage(next);
    setSelectedId(null);
  };
  const bgImage = useHtmlImage(page?.dataUrl);

  const addElement = useCallback((el: EditElement) => {
    setElementsByPage((prev) => ({ ...prev, [pageKey]: [...(prev[pageKey] || []), el] }));
  }, [pageKey]);

  const updateElement = useCallback((id: string, patch: Partial<EditElement>) => {
    setElementsByPage((prev) => ({
      ...prev,
      [pageKey]: (prev[pageKey] || []).map((el) => (el.id === id ? { ...el, ...patch } : el)),
    }));
  }, [pageKey]);

  const deleteElement = useCallback((id: string) => {
    saveUndo();
    setElementsByPage((prev) => ({ ...prev, [pageKey]: (prev[pageKey] || []).filter((el) => el.id !== id) }));
    setSelectedId(null);
  }, [pageKey, saveUndo]);

  const getPageImageData = useCallback(async (idx: number): Promise<ImageData | null> => {
    if (imageDataCache.current[idx]) return imageDataCache.current[idx];
    const pData = pages[idx];
    if (!pData) return null;
    const img = new window.Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Failed to load page image"));
      img.src = pData.dataUrl;
    });
    const canvas = document.createElement("canvas");
    canvas.width = pData.width;
    canvas.height = pData.height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, pData.width, pData.height);
    imageDataCache.current[idx] = data;
    return data;
  }, [pages]);

  // Replace existing PDF text: cover it with a sampled background patch
  // and drop in an editable text element matching its size/color.
  const handleEditTextClick = useCallback(async (pos: { x: number; y: number }) => {
    if (!page) return;
    const region = page.textItems.find(
      (t) => pos.x >= t.x && pos.x <= t.x + t.width && pos.y >= t.y && pos.y <= t.y + t.height
    );
    if (!region) return;

    const imageData = await getPageImageData(pageKey);
    const { bg, text } = imageData
      ? sampleRegionColors(imageData, region)
      : { bg: "#ffffff", text: "#000000" };

    saveUndo();
    const padding = 1;
    const coverId = generateId();
    addElement({
      id: coverId,
      type: "rect",
      x: region.x - padding,
      y: region.y - padding,
      width: region.width + padding * 2,
      height: region.height + padding * 2,
      color: bg,
    });

    const textId = generateId();
    const fontSize = Math.max(6, region.height * 0.85);
    const newEl: EditElement = {
      id: textId,
      type: "text",
      x: region.x,
      y: region.y,
      width: Math.max(region.width, 60),
      fontSize,
      color: text,
      text: region.text,
    };
    addElement(newEl);
    setActiveTool("select");
    setSelectedId(textId);
    setEditingText(newEl);
  }, [page, pageKey, getPageImageData, addElement, saveUndo]);

  const handleFilesChange = async (f: UploadedFile[]) => {
    setFiles(f);
    setPages([]);
    setElementsByPage({});
    setPageOrder([]);
    setUndoStack([]);
    setRedoStack([]);
    setSelectedId(null);
    setPageIndex(0);
    setError("");
    if (!f.length) return;
    setLoading(true);
    try {
      if (f[0].size > PDF_STUDIO_LIMITS.fileBytes) throw new Error("PDF exceeds the 20 MiB editor limit.");
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
      const bytes = await f[0].file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
      const newPages: PageData[] = [];
      if (pdf.numPages > PDF_STUDIO_LIMITS.pages) throw new Error("This editor supports up to 30 pages per file.");
      let totalPixels = 0;
      for (let i = 1; i <= pdf.numPages; i++) {
        const pdfPage = await pdf.getPage(i);
        const viewport = pdfPage.getViewport({ scale: RENDER_SCALE });
        const pdfViewport = pdfPage.getViewport({ scale: 1 });
        totalPixels += Math.ceil(viewport.width) * Math.ceil(viewport.height);
        if (totalPixels > PDF_STUDIO_LIMITS.renderedPixels) throw new Error("PDF pages exceed the 24-million-pixel browser preview safety limit.");
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;
        await pdfPage.render({ canvas, canvasContext: ctx, viewport }).promise;

        const textContent = await pdfPage.getTextContent();
        const textItems: TextRegion[] = [];
        for (const item of textContent.items) {
          if (!("str" in item) || !item.str.trim()) continue;
          const tx = item.transform;
          const p1 = viewport.convertToViewportPoint(tx[4], tx[5]);
          const p2 = viewport.convertToViewportPoint(tx[4] + item.width, tx[5] + item.height);
          const x = Math.min(p1[0], p2[0]);
          const y = Math.min(p1[1], p2[1]);
          const width = Math.abs(p2[0] - p1[0]);
          const height = Math.abs(p2[1] - p1[1]);
          if (width <= 0 || height <= 0) continue;
          textItems.push({ text: item.str, x, y, width, height });
        }

        newPages.push({
          dataUrl: canvas.toDataURL(),
          width: viewport.width,
          height: viewport.height,
          pdfWidth: pdfViewport.width,
          pdfHeight: pdfViewport.height,
          textItems,
        });
      }
      setPages(newPages);
      setPageOrder(newPages.map((_, i) => i));
      setZoom(Math.max(0.35, Math.min(1, (window.innerWidth - 90) / (newPages[0]?.width || 1))));
      await pdf.destroy();
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Could not load PDF.");
    }
    setLoading(false);
  };

  const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (activeTool === "select" || activeTool === "image") {
      if (e.target === e.target.getStage()) setSelectedId(null);
      return;
    }
    const stage = e.target.getStage();
    const pointer = stage?.getPointerPosition();
    if (!pointer) return;
    const pos = { x: pointer.x / zoom, y: pointer.y / zoom };

    if (activeTool === "edittext") {
      void handleEditTextClick(pos);
      return;
    }

    saveUndo();
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
    const pointer = stage?.getPointerPosition();
    if (!pointer) return;
    const pos = { x: pointer.x / zoom, y: pointer.y / zoom };
    const id = drawingId.current;
    const current = (elementsByPage[pageKey] || []).find((el) => el.id === id);
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
    const current = (elementsByPage[pageKey] || []).find((el) => el.id === id);
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
    if (!["image/png", "image/jpeg"].includes(file.type) || file.size > PDF_STUDIO_LIMITS.imageBytes) {
      setError("Insert a PNG or JPEG image no larger than 5 MiB.");
      e.target.value = "";
      return;
    }
    setError("");
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
        saveUndo();
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
      if ((e.ctrlKey || e.metaKey) && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) {
        if (e.key.toLowerCase() === "z") { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
        if (e.key.toLowerCase() === "y") { e.preventDefault(); redo(); return; }
      }
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        deleteElement(selectedId);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedId, deleteElement, undoStack, redoStack, elementsByPage]);

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

  const rasterizePage = async (data: PageData, edits: EditElement[]): Promise<Blob> => {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.ceil(data.width));
    canvas.height = Math.max(1, Math.ceil(data.height));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is not available on this device.");
    const load = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Cannot draw an inserted image."));
      img.src = src;
    });
    const background = await load(data.dataUrl);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(background, 0, 0, data.width, data.height);

    for (const el of edits) {
      ctx.save();
      ctx.globalAlpha = el.opacity ?? 1;
      ctx.translate(el.x, el.y);
      ctx.rotate((el.rotation || 0) * Math.PI / 180);
      if (el.type === "rect") {
        ctx.fillStyle = el.color;
        ctx.fillRect(0, 0, el.width || 0, el.height || 0);
      } else if (el.type === "circle") {
        ctx.fillStyle = el.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, Math.abs(el.width || 0) / 2, Math.abs(el.height || 0) / 2, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (el.type === "draw" || el.type === "line") {
        const pts = el.points || [];
        if (pts.length >= 4) {
          ctx.beginPath();
          ctx.lineWidth = el.strokeWidth || 2;
          ctx.strokeStyle = el.color;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.moveTo(pts[0], pts[1]);
          for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
          ctx.stroke();
        }
      } else if (el.type === "image" && el.src) {
        const image = await load(el.src);
        ctx.drawImage(image, 0, 0, el.width || 0, el.height || 0);
      } else if (el.type === "text") {
        const size = el.fontSize || 16;
        ctx.font = size + 'px Arial, "Noto Sans", sans-serif';
        ctx.textBaseline = "top";
        ctx.fillStyle = el.color;
        const lines = wrapCanvasText(el.text || "", el.width || 250, (value) => ctx.measureText(value).width);
        for (let i = 0; i < lines.length; i++) ctx.fillText(lines[i], 0, i * size * 1.2);
      }
      ctx.restore();
    }
    const result = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Cannot export page image.")), "image/jpeg", 0.93)
    );
    canvas.width = 0;
    canvas.height = 0;
    return result;
  };

  const handleExport = async () => {
    if (!files.length || !pageOrder.length || exporting) return;
    setExporting(true);
    setError("");
    try {
      const input = await files[0].file.arrayBuffer();
      const source = await PDFDocument.load(input);
      const flattened = exportMode === "flattened";
      const originalOrder = isOriginalPageOrder(pageOrder, pages.length);
      let target: PDFDocument;
      if (flattened) {
        // A new document containing ONLY rasterized page pixels removes the source
        // page text/annotations, unlike putting a visual white rectangle over them.
        target = await PDFDocument.create();
        for (const originalIndex of pageOrder) {
          const data = pages[originalIndex];
          const image = await rasterizePage(data, elementsByPage[originalIndex] || []);
          const embedded = await target.embedJpg(await image.arrayBuffer());
          const page = target.addPage([data.pdfWidth, data.pdfHeight]);
          page.drawImage(embedded, { x: 0, y: 0, width: data.pdfWidth, height: data.pdfHeight });
        }
      } else {
        target = originalOrder ? source : await PDFDocument.create();
        if (!originalOrder) {
          const copied = await target.copyPages(source, pageOrder);
          copied.forEach((pdfPage) => target.addPage(pdfPage));
        }
        const font = await target.embedFont(StandardFonts.Helvetica);
        const outputPages = target.getPages();
        for (let i = 0; i < pageOrder.length; i++) {
          const originalIndex = pageOrder[i];
          const pdfPage = outputPages[i];
          const data = pages[originalIndex];
          const edits = elementsByPage[originalIndex] || [];
          if (!edits.length) continue;
          if (pdfPage.getRotation().angle % 360 !== 0) {
            throw new Error("This PDF has rotated source pages. Use Flattened export to keep markup aligned.");
          }
          const scale = data.width / data.pdfWidth;
          for (const el of edits) {
            const c = hexToRgb(el.color), opacity = el.opacity ?? 1;
            if (el.type === "rect") {
              const w = (el.width || 0) / scale, h = (el.height || 0) / scale;
              pdfPage.drawRectangle({
                x: el.x / scale,
                y: data.pdfHeight - el.y / scale - h,
                width: w, height: h,
                color: rgb(c.r, c.g, c.b), opacity,
                rotate: degrees(el.rotation || 0),
              });
            } else if (el.type === "circle") {
              pdfPage.drawEllipse({
                x: el.x / scale, y: data.pdfHeight - el.y / scale,
                xScale: (el.width || 0) / 2 / scale,
                yScale: (el.height || 0) / 2 / scale,
                color: rgb(c.r, c.g, c.b), opacity,
              });
            } else if (el.type === "line" || el.type === "draw") {
              const pts = el.points || [];
              for (let p = 0; p < pts.length - 2; p += 2) {
                pdfPage.drawLine({
                  start: { x: pts[p] / scale, y: data.pdfHeight - pts[p + 1] / scale },
                  end: { x: pts[p + 2] / scale, y: data.pdfHeight - pts[p + 3] / scale },
                  thickness: (el.strokeWidth || 2) / scale,
                  color: rgb(c.r, c.g, c.b), opacity,
                });
              }
            } else if (el.type === "text") {
              const size = (el.fontSize || 16) / scale;
              pdfPage.drawText(el.text || "", {
                x: el.x / scale, y: data.pdfHeight - el.y / scale - size,
                size, font, color: rgb(c.r, c.g, c.b),
                rotate: degrees(el.rotation || 0), opacity,
                lineHeight: size * 1.2,
                maxWidth: (el.width || 240) / scale,
              });
            } else if (el.type === "image" && el.src) {
              const imgBytes = dataUrlToBytes(el.src);
              const embedded = el.src.startsWith("data:image/png") ? await target.embedPng(imgBytes) : await target.embedJpg(imgBytes);
              const w = (el.width || 0) / scale, h = (el.height || 0) / scale;
              pdfPage.drawImage(embedded, {
                x: el.x / scale, y: data.pdfHeight - el.y / scale - h,
                width: w, height: h, rotate: degrees(el.rotation || 0), opacity,
              });
            }
          }
        }
      }
      const output = await target.save();
      const validation = await PDFDocument.load(output);
      if (validation.getPageCount() !== pageOrder.length) throw new Error("Export page count failed validation.");
      downloadBlob(new Blob([new Uint8Array(output)], { type: "application/pdf" }), (flattened ? "flattened-" : "edited-") + files[0].name);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to export PDF.");
    } finally {
      setExporting(false);
    }
  };

  const startTextEdit = (el: EditElement) => setEditingText(el);

  const finishTextEdit = (text: string) => {
    if (editingText && text !== editingText.text) {
      saveUndo();
      updateElement(editingText.id, { text });
    }
    setEditingText(null);
  };

  return (
    <div className="space-y-6">
      {pages.length === 0 && (
        <UploadZone accept={ACCEPTED_PDF_TYPES} multiple={false} maxSize={PDF_STUDIO_LIMITS.fileBytes} onFilesChange={handleFilesChange}
          title="Choose a PDF for Studio" description="Up to 20 MiB, 30 pages; add, move, visually revise text, annotate or flatten." />
      )}
      {error && <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">{error}</div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {pages.length > 0 && page && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-semibold">PDF Studio · {pageOrder.length} pages</p>
              <Button variant="outline" size="sm" onClick={() => { setPages([]); setFiles([]); setPageOrder([]); setElementsByPage({}); setUndoStack([]); setRedoStack([]); setError(""); }}>
                Open another PDF
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">Your PDF is edited locally. Select markup to move it, or double-click added text to edit. Undo applies to markups; page order has its own reset.</p>
            {activeTool === "edittext" && <p className="text-sm text-amber-700 dark:text-amber-300">
              Visual correction: clicking source text creates a background cover and replacement text. Normal PDF export retains original underlying text. Choose Flattened export if the original must not be selectable.
            </p>}
          </div>
          <div className="rounded-xl border border-border bg-card p-3 space-y-2">
            <label htmlFor="pdf-studio-search" className="flex items-center gap-2 font-medium text-sm"><Search className="w-4 h-4" />Find selectable PDF text</label>
            <input id="pdf-studio-search" type="search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search source text, jump to a page" className="w-full rounded-lg border border-border bg-background p-2 text-sm" maxLength={120}/>
            {searchQuery.trim().length > 1 && (
              <div className="flex flex-wrap gap-2 text-xs">
                {matches.length ? matches.map((match, i) => (
                  <button type="button" key={i} onClick={() => { setPageIndex(match.page); setSelectedId(null); }}
                    className="rounded-md border border-border px-2 py-1 hover:border-primary max-w-full truncate" title={match.text}>
                    Page {match.page + 1}: {match.text.slice(0, 36)}
                  </button>
                )) : <p className="text-muted-foreground">No selectable text found. Scanned pages may not contain searchable text.</p>}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold">Page thumbnails · select, move or remove</p>
            <div className="flex gap-2 overflow-x-auto rounded-xl border border-border bg-muted/30 p-3">
              {pageOrder.map((origin, index) => (
                <button key={origin} type="button" aria-label={"Go to page " + (index + 1)}
                  aria-current={index === pageIndex ? "page" : undefined}
                  className={"shrink-0 rounded-lg border-2 bg-card p-2 text-xs text-center " + (index === pageIndex ? "border-primary" : "border-transparent hover:border-border")}
                  onClick={() => { setPageIndex(index); setSelectedId(null); }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={pages[origin].dataUrl} alt={"Page " + (index + 1) + " thumbnail"} className="h-20 w-auto max-w-16 mx-auto object-contain" />
                  <span className="block mt-1">Page {index + 1}</span>
                  {(elementsByPage[origin] || []).length > 0 && <span className="block text-primary">{elementsByPage[origin].length} edits</span>}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <Button size="sm" variant="outline" disabled={pageIndex === 0}
                onClick={() => { setPageOrder((order) => shiftPage(order, pageIndex, -1)); setPageIndex((v) => v - 1); }}>
                <MoveLeft className="w-4 h-4 mr-1" />Move earlier</Button>
              <Button size="sm" variant="outline" disabled={pageIndex === pageOrder.length - 1}
                onClick={() => { setPageOrder((order) => shiftPage(order, pageIndex, 1)); setPageIndex((v) => v + 1); }}>
                <MoveRight className="w-4 h-4 mr-1" />Move later</Button>
              <Button size="sm" variant="outline" disabled={pageOrder.length <= 1}
                onClick={() => { setPageOrder((order) => dropPage(order, pageIndex)); setPageIndex((v) => Math.max(0, Math.min(v, pageOrder.length - 2))); setSelectedId(null); }}>
                <Trash2 className="w-4 h-4 mr-1" />Remove page</Button>
              <Button size="sm" variant="ghost" onClick={() => { setPageOrder(pages.map((_, i) => i)); setPageIndex(0); setSelectedId(null); }}>Restore original page order</Button>
            </div>
          </div>
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
            <input ref={imageInputRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleImageUpload} />

            <Button variant="outline" size="sm" title="Undo markup (Ctrl+Z)" disabled={!undoStack.length} onClick={undo}><Undo2 className="h-4 w-4 mr-1" />Undo</Button>
            <Button variant="outline" size="sm" title="Redo markup (Ctrl+Shift+Z)" disabled={!redoStack.length} onClick={redo}><Redo2 className="h-4 w-4 mr-1" />Redo</Button>
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

            <div className="flex items-center gap-2">
              <button aria-label="Zoom out" onClick={() => setZoom((z) => Math.max(0.3, +(z - 0.1).toFixed(2)))} className="p-2 rounded-lg border border-border"><ZoomOut className="w-4 h-4" /></button>
              <span className="text-xs tabular-nums min-w-10 text-center">{Math.round(zoom * 100)}%</span>
              <button aria-label="Zoom in" onClick={() => setZoom((z) => Math.min(1.5, +(z + 0.1).toFixed(2)))} className="p-2 rounded-lg border border-border"><ZoomIn className="w-4 h-4" /></button>
              <button onClick={() => setZoom(Math.max(0.3, Math.min(1, (window.innerWidth - 90) / page.width)))} className="px-2 py-2 text-xs rounded-lg border border-border">Fit width</button>
            </div>
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

          {selectedElement && (
            <div className="rounded-xl border border-border bg-card p-3 flex flex-wrap items-center gap-3 text-sm">
              <span className="font-medium">Selected: {selectedElement.type}</span>
              <label className="flex items-center gap-1">Color
                <input aria-label="Selected element color" type="color" value={selectedElement.color}
                  onChange={(e) => { saveUndo(); updateElement(selectedElement.id, { color: e.target.value }); }} />
              </label>
              {selectedElement.type === "text" && (
                <>
                  <label className="flex items-center gap-2">Text size
                    <input type="number" min={8} max={120} className="w-16 rounded border border-border bg-background px-2 py-1"
                      value={Math.round(selectedElement.fontSize || 16)}
                      onChange={(e) => { saveUndo(); updateElement(selectedElement.id, { fontSize: Math.max(8, Math.min(120, Number(e.target.value) || 8)) }); }}/>
                  </label>
                  <Button size="sm" variant="outline" onClick={() => startTextEdit(selectedElement)}>Edit text</Button>
                </>
              )}
            </div>
          )}
          {/* Canvas */}
          <div className="bg-muted/40 border border-border rounded-2xl p-4 overflow-auto flex justify-center">
            <div className="relative" style={{ width: page.width * zoom, height: page.height * zoom }}>
              <Stage
                ref={stageRef}
                width={page.width * zoom}
                height={page.height * zoom}
                scaleX={zoom}
                scaleY={zoom}
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

          <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-2"><Layers2 className="w-5 h-5 text-primary" /><h3 className="font-semibold">Export options</h3></div>
            <label className="flex gap-3 items-start text-sm">
              <input type="radio" name="pdf-export" value="layered" checked={exportMode === "layered"} onChange={() => setExportMode("layered")} className="mt-1" />
              <span><strong>Layered PDF (text and links preserved where supported)</strong><span className="block text-xs text-muted-foreground">Keeps original PDF content and adds markup on top. Covered text remains searchable; not secure redaction. Reordering may affect forms. Helvetica text additions have limited language support.</span></span>
            </label>
            <label className="flex gap-3 items-start text-sm">
              <input type="radio" name="pdf-export" value="flattened" checked={exportMode === "flattened"} onChange={() => setExportMode("flattened")} className="mt-1" />
              <span><strong>Flattened image-only PDF</strong><span className="block text-xs text-muted-foreground">Builds a new document from visible pages and annotations; original selectable text, links and forms are NOT copied. Visual coverage is baked into pixels. Inspect results carefully; size and quality may change.</span></span>
            </label>
            {containsVisualCorrections && exportMode === "layered" && <p role="alert" className="rounded-lg border border-amber-400 p-2 text-sm text-amber-700 dark:text-amber-300">This file contains cover/whiteout overlays. Source text can still be recovered from Layered export. Choose Flattened for an image-only copy, or a verified redaction workflow for sensitive documents.</p>}
          </section>
          <Button onClick={handleExport} disabled={exporting} size="lg" className="w-full" variant="gradient">
            {exporting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Exporting...</> : <><Download className="w-4 h-4 mr-2" />Download {exportMode === "flattened" ? "Flattened" : "Layered"} PDF</>}
          </Button>
        </motion.div>
      )}
    </div>
  );
}
