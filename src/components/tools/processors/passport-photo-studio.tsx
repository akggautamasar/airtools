"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, ScanFace, Printer, AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UploadZone } from "@/components/tools/upload-zone";
import type { Tool, UploadedFile } from "@/types";
import { downloadBlob } from "@/lib/utils";
import { calculateCoverCrop, mmToPixels, PASSPORT_PRESETS, sheetLayout } from "@/lib/photo-studio";

const DPI = 300;
const MAX_DIM = 2200;
type BrowserFaceDetector = { detect: (image: HTMLImageElement) => Promise<{ boundingBox: DOMRectReadOnly }[]> };
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Cannot open this image"));
    image.src = src;
  });
}
async function toBlob(canvas: HTMLCanvasElement, type: string, quality = 0.94): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error("Export failed")), type, quality));
}
async function renderPhoto(image: HTMLImageElement, width: number, height: number, zoom: number, x: number, y: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw Error("Canvas unavailable");
  const crop = calculateCoverCrop(image.naturalWidth, image.naturalHeight, width / height, zoom, x, y);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, width, height);
  return canvas;
}
function PhotoStudio({ tool: _tool }: { tool: Tool }) {
  const [files,setFiles] = useState<UploadedFile[]>([]);
  const [photoUrl,setPhotoUrl] = useState("");
  const [presetId,setPresetId] = useState("35x45");
  const [customWidth,setCustomWidth] = useState(35);
  const [customHeight,setCustomHeight] = useState(45);
  const [zoom,setZoom] = useState(1);
  const [x,setX] = useState(0.5);
  const [y,setY] = useState(0.5);
  const [guide,setGuide] = useState(true);
  const [sheet,setSheet] = useState<"a4" | "4x6">("4x6");
  const [format,setFormat] = useState<"jpeg" | "png">("jpeg");
  const [busy,setBusy] = useState(false);
  const [info,setInfo] = useState("");
  const [error,setError] = useState("");
  const preview = useRef<HTMLCanvasElement>(null);
  const current = PASSPORT_PRESETS.find(p=>p.id===presetId) || PASSPORT_PRESETS[0];
  const widthMm = presetId==="custom" ? customWidth : current.widthMm;
  const heightMm = presetId==="custom" ? customHeight : current.heightMm;
  const widthPx=mmToPixels(Math.max(5,Math.min(100,widthMm)),DPI);
  const heightPx=mmToPixels(Math.max(5,Math.min(100,heightMm)),DPI);
  const sheetSize = sheet==="a4" ? {w:210,h:297} : {w:101.6,h:152.4};
  const layout = sheetLayout(widthMm,heightMm,sheetSize.w,sheetSize.h);
  const originalRef=useRef<HTMLImageElement|null>(null);

  useEffect(()=>{
    if(!files[0])return;
    const url=URL.createObjectURL(files[0].file);
    let active=true;
    void loadImage(url).then(image=>{
      if(!active)return;
      originalRef.current=image;
      setPhotoUrl(url);
      setInfo(image.naturalWidth+" × "+image.naturalHeight+" source pixels");
    }).catch(e=>{if(active)setError(e.message);});
    return ()=>{active=false;originalRef.current=null;URL.revokeObjectURL(url);};
  },[files]);

  const drawPreview=useCallback(()=>{
    const canvas=preview.current, source=originalRef.current;
    if(!canvas || !source)return;
    canvas.width=Math.max(200,Math.round(340*widthMm/heightMm));canvas.height=340;
    const crop=calculateCoverCrop(source.naturalWidth,source.naturalHeight,widthMm/heightMm,zoom,x,y);
    const ctx=canvas.getContext("2d");
    if(!ctx)return;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.imageSmoothingQuality="high";
    ctx.drawImage(source,crop.sx,crop.sy,crop.sw,crop.sh,0,0,canvas.width,canvas.height);
    if(guide){
      ctx.strokeStyle="rgba(255,255,255,.8)";ctx.lineWidth=1.3;ctx.setLineDash([6,5]);
      ctx.strokeRect(5,5,canvas.width-10,canvas.height-10);
      ctx.beginPath();ctx.moveTo(canvas.width/2,0);ctx.lineTo(canvas.width/2,canvas.height);
      ctx.moveTo(0,canvas.height/2);ctx.lineTo(canvas.width,canvas.height/2);ctx.stroke();
      ctx.setLineDash([]);
      if(current.headMinMm && current.headMaxMm){
        const mid=(current.headMinMm+current.headMaxMm)/2*canvas.height/heightMm;
        ctx.strokeStyle="#f8e16c";ctx.strokeRect(canvas.width*.25,(canvas.height-mid)/2,canvas.width*.5,mid);
      }
    }
  },[widthMm,heightMm,zoom,x,y,guide,current.headMinMm,current.headMaxMm]);
  useEffect(()=>{void Promise.resolve().then(drawPreview);},[photoUrl,drawPreview]);

  const autoFrame=async()=>{
    const img=originalRef.current;
    if(!img)return;
    setError("");
    const FaceDetectorCtor = (window as unknown as {FaceDetector?:new(opts:{fastMode:boolean,maxDetectedFaces:number})=>BrowserFaceDetector}).FaceDetector;
    if(!FaceDetectorCtor){
      setInfo("Automatic face detection is not available in this browser. Use the crop, zoom and alignment sliders.");
      return;
    }
    setBusy(true);
    try{
      const faces=await new FaceDetectorCtor({fastMode:false,maxDetectedFaces:3}).detect(img);
      if(faces.length!==1){setInfo("Automatic framing needs exactly one detectable face. Use manual controls.");return;}
      const face=faces[0].boundingBox;
      const midX=(face.x+face.width/2)/img.naturalWidth;
      const midY=(face.y+face.height/2)/img.naturalHeight;
      setX(Math.max(0,Math.min(1,midX)));setY(Math.max(0,Math.min(1,midY)));
      setInfo("Approximate face center detected. Manually check head height, expression, background and shoulders.");
    }catch{setInfo("Face detection could not run; manual framing is available.");}
    finally{setBusy(false);}
  };

  const generate=async(kind:"single"|"sheet")=>{
    if(!originalRef.current || busy)return;
    setBusy(true);setError("");
    try{
      const image=originalRef.current;
      const cropped=await renderPhoto(image,widthPx,heightPx,zoom,x,y);
      const photo=await toBlob(cropped,format==="jpeg"?"image/jpeg":"image/png");
      if(kind==="single"){
        downloadBlob(photo,"airtools-"+presetId+"-"+widthPx+"x"+heightPx+"."+ (format==="jpeg"?"jpg":"png"));
      }else{
        if(layout.count<1)throw Error("This photo does not fit on the chosen sheet; select A4 or a smaller preset.");
        const {PDFDocument}=await import("pdf-lib");
        const pdf=await PDFDocument.create();
        const mmPt=72/25.4;
        const page=pdf.addPage([sheetSize.w*mmPt,sheetSize.h*mmPt]);
        const embedded=format==="jpeg"?await pdf.embedJpg(await photo.arrayBuffer()):await pdf.embedPng(await photo.arrayBuffer());
        const margin=5,gap=2;
        const usedW=layout.cols*widthMm+(layout.cols-1)*gap;
        const usedH=layout.rows*heightMm+(layout.rows-1)*gap;
        const offsetX=(sheetSize.w-usedW)/2,offsetY=(sheetSize.h-usedH)/2;
        for(let row=0;row<layout.rows;row++)for(let col=0;col<layout.cols;col++){
          page.drawImage(embedded,{
            x:(offsetX+col*(widthMm+gap))*mmPt,
            y:(sheetSize.h-offsetY-(row+1)*heightMm-row*gap)*mmPt,
            width:widthMm*mmPt,height:heightMm*mmPt
          });
        }
        downloadBlob(new Blob([new Uint8Array(await pdf.save())],{type:"application/pdf"}),
          "airtools-"+presetId+"-"+sheet+"-print-sheet.pdf");
      }
    }catch(e){setError(e instanceof Error?e.message:"Export failed");}
    finally{setBusy(false);}
  };
  return <div className="space-y-5">
    <header className="rounded-2xl border border-border p-5 space-y-2">
      <h2 className="text-xl font-bold">Passport & ID Photo Studio</h2>
      <p className="text-sm text-muted-foreground">Crop an original photo to standard print sizes, review head-position guides, and make print sheets. All editing happens in your browser; no photo upload to our server.</p>
      <p className="text-xs text-amber-700 dark:text-amber-400"><AlertTriangle className="inline h-4 w-4"/> Official approval is never guaranteed. Many authorities prohibit AI edits and digitally replaced backgrounds. This tool does not change your face, clothing or background and does not perform biometric certification.</p>
    </header>
    <UploadZone accept={{"image/jpeg":[".jpg",".jpeg"],"image/png":[".png"],"image/webp":[".webp"]}} multiple={false} maxFiles={1} maxSize={16*1024*1024}
      onFilesChange={(selected)=>{setFiles(selected.slice(-1));setError("");setZoom(1);setX(.5);setY(.5);}}
      title="Choose an original face photo" description="JPG, PNG or WebP · best results with even light and a real plain backdrop"/>
    {files.length>0&&<div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <section className="space-y-4 rounded-2xl border border-border p-4">
        <label className="block text-sm font-medium">Country / print-size template
          <select aria-label="Photo template" value={presetId} onChange={e=>setPresetId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-background p-3">
            {PASSPORT_PRESETS.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </label>
        {presetId==="custom"&&<div className="grid grid-cols-2 gap-2">
          <label className="text-xs">Width (mm)<input type="number" min={5} max={100} value={customWidth} onChange={e=>setCustomWidth(Math.max(5,Math.min(100,Number(e.target.value)||5)))} className="block w-full rounded-lg border border-border bg-background p-2"/></label>
          <label className="text-xs">Height (mm)<input type="number" min={5} max={100} value={customHeight} onChange={e=>setCustomHeight(Math.max(5,Math.min(100,Number(e.target.value)||5)))} className="block w-full rounded-lg border border-border bg-background p-2"/></label>
        </div>}
        <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1 text-xs">
          <p>Print: <b>{widthMm} × {heightMm} mm</b> · Export: <b>{widthPx} × {heightPx} px at 300 DPI</b></p>
          {current.headMinMm&&<p>Head-height guide: <b>{current.headMinMm}–{current.headMaxMm} mm</b> (estimate only)</p>}
          <p>{current.note}</p>
          {current.source&&<a href={current.source} target="_blank" rel="noopener noreferrer" className="underline text-primary">Check official photo requirements ↗</a>}
        </div>
        <Button variant="outline" onClick={autoFrame} disabled={busy} className="w-full">
          <ScanFace className="h-4 w-4 mr-2"/>Try automatic face centering
        </Button>
        <div className="space-y-3 text-sm">
          {[
            {name:"Zoom",value:zoom,min:1,max:3,step:.02,onChange:setZoom,valueLabel:zoom.toFixed(2)+"×"},
            {name:"Horizontal position",value:x,min:0,max:1,step:.01,onChange:setX,valueLabel:Math.round(x*100)+"%"},
            {name:"Vertical position",value:y,min:0,max:1,step:.01,onChange:setY,valueLabel:Math.round(y*100)+"%"}
          ].map(s=><label key={s.name} className="block">
            <span className="flex justify-between"><span>{s.name}</span><span className="text-muted-foreground">{s.valueLabel}</span></span>
            <input type="range" value={s.value} min={s.min} max={s.max} step={s.step} onChange={e=>s.onChange(Number(e.target.value))} className="w-full accent-primary"/>
          </label>)}
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={guide} onChange={e=>setGuide(e.target.checked)}/> Show alignment guides</label>
          <button type="button" onClick={()=>{setZoom(1);setX(.5);setY(.5);}} className="flex items-center gap-1 text-xs underline"><RotateCcw className="h-3.5 w-3.5"/>Reset crop</button>
        </div>
        <p className="text-xs text-muted-foreground">{info}</p>
      </section>
      <section className="space-y-4 rounded-2xl border border-border p-4">
        <h3 className="font-semibold">Live crop preview</h3>
        <div className="flex min-h-72 items-center justify-center rounded-xl bg-muted/40 p-3">
          <canvas ref={preview} className="max-w-full rounded shadow-md" style={{maxHeight:380}} aria-label="Passport crop preview"/>
        </div>
        <p className="text-xs text-muted-foreground">The guide lines are not included in downloads. Face size must be checked against the issuing authority’s actual requirements.</p>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">Image export
            <select value={format} onChange={e=>setFormat(e.target.value as "jpeg"|"png")} className="mt-1 w-full rounded-lg border border-border bg-background p-2">
              <option value="jpeg">JPG</option><option value="png">PNG</option>
            </select>
          </label>
          <label className="text-sm">Print sheet
            <select value={sheet} onChange={e=>setSheet(e.target.value as "a4"|"4x6")} className="mt-1 w-full rounded-lg border border-border bg-background p-2">
              <option value="4x6">4 × 6 in</option><option value="a4">A4</option>
            </select>
          </label>
        </div>
        <p className="text-xs text-muted-foreground">{layout.count} photos fit on {sheet==="a4"?"A4":"4 × 6 in"} with cutting margins. Print the PDF at <b>100% / Actual size</b> (no scaling).</p>
        {error&&<p role="alert" className="text-sm text-red-500">{error}</p>}
        <Button variant="gradient" size="lg" className="w-full" disabled={busy} onClick={()=>{void generate("single");}}>
          <Download className="h-4 w-4 mr-2"/>Download photo
        </Button>
        <Button variant="outline" size="lg" className="w-full" disabled={busy||layout.count===0} onClick={()=>{void generate("sheet");}}>
          <Printer className="h-4 w-4 mr-2"/>Download print-ready PDF sheet
        </Button>
      </section>
    </div>}
    <p className="text-xs text-muted-foreground">This tool offers dimensional cropping, not AI clothing replacement, retouching, automatic official compliance checks or human review. For US applications, confirm the latest digital-alteration rules before using cropped or resized files.</p>
  </div>;
}
export default PhotoStudio;
