"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle, CheckCircle2, ChevronDown, Download, FileImage,
  Image as ImageIcon, Info, LockKeyhole, Package, RotateCcw,
  Trash2, UploadCloud, XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadBlob, formatFileSize } from "@/lib/utils";
import type { Tool } from "@/types";
import {
  clampExamDimension, dimensionFromOther, percentDimensions,
  UPLOAD_KINDS, validateExamOutput,
  type ExamAssetKind, type ExamFitMode, type ExamImageFormat
} from "@/lib/exam-upload-specs";
import {
  analyzeExamCanvas, canvasAsBlob, loadExamImage, renderExamImage, sizeTargetExport,
  type ExamImageAnalysis
} from "@/lib/exam-image-engine";

type Output = {blob:Blob;name:string;issues:string[];width:number;height:number};
type KitItem = {kind:ExamAssetKind;blob:Blob;name:string;issues:string[]};
type ResizeMode = "size" | "percent";
type FormatChoice = "original" | ExamImageFormat;
const GUIDE:Record<ExamAssetKind,{good:string[];bad:string[]}>={
 photo:{
  good:["Head and face clearly visible","Even light and suitable plain background","Correct crop and natural, unaltered appearance"],
  bad:["Blur, shadow or excessive filters","Cut-off head, chin or shoulders","An uploaded file when the portal requires a live capture"]
 },
 signature:{
  good:["Real handwritten running signature","Full strokes visible with some space around edges","Ink clearly distinguishable from paper"],
  bad:["Cropped, faint or smudged signature","Block letters where not permitted","Typed or artificially generated signature"]
 },
 thumb:{
  good:["Real requested finger and hand","Complete, centered impression","Readable, unsmudged ridges"],
  bad:["Wrong finger or hand","Marks reaching image edge","Smudged, faint or cropped ridges"]
 },
 declaration:{
  good:["Genuine handwritten text","Entire writing remains readable","Wording and ink checked before submission"],
  bad:["Typed text when handwriting is required","Missing or cut-off lines","Unreadable writing or incorrect wording"]
 },
 document:{
  good:["All corners and text remain visible","Clear seals and signatures","Correct, complete original document"],
  bad:["Cut-off content or unreadable text","Expired or incorrect document","Modified original details"]
 }
};
function displaySize(bytes:number){return (bytes/1024).toFixed(1)+" KB";}
function suggestedKind(slug:string):ExamAssetKind {
 if(slug.includes("signature"))return "signature";
 if(slug.includes("thumb"))return "thumb";
 if(slug.includes("declaration"))return "declaration";
 if(slug.includes("document"))return "document";
 return "photo";
}
function cleanName(name:string){return name.replace(/\.[^.]+$/,"").replace(/[^a-z0-9_.-]+/gi,"-").slice(0,65)||"image";}
function previewCanvas(source:HTMLCanvasElement,target:HTMLCanvasElement) {
 const scale=Math.min(1,450/Math.max(source.width,source.height));
 target.width=Math.max(1,Math.round(source.width*scale));
 target.height=Math.max(1,Math.round(source.height*scale));
 target.getContext("2d")?.drawImage(source,0,0,target.width,target.height);
}
async function toA4Pdf(img:HTMLImageElement,maxKB:number|null):Promise<Blob> {
 const {PDFDocument}=await import("pdf-lib");
 let result:Blob|null=null;
 for(let i=0;i<11;i++){
  const cnv=document.createElement("canvas");
  const maxDim=Math.max(450,1900-i*145);
  const scale=Math.min(1,maxDim/Math.max(img.naturalWidth,img.naturalHeight));
  cnv.width=Math.max(40,Math.round(img.naturalWidth*scale));
  cnv.height=Math.max(40,Math.round(img.naturalHeight*scale));
  cnv.getContext("2d")?.drawImage(img,0,0,cnv.width,cnv.height);
  const jpeg=await canvasAsBlob(cnv,"jpeg",Math.max(.22,.91-i*.067));
  const pdf=await PDFDocument.create();
  const page=pdf.addPage([595.28,841.89]);
  const embedded=await pdf.embedJpg(await jpeg.arrayBuffer());
  const fit=Math.min((595.28-45)/embedded.width,(841.89-45)/embedded.height);
  const w=embedded.width*fit,h=embedded.height*fit;
  page.drawImage(embedded,{x:(595.28-w)/2,y:(841.89-h)/2,width:w,height:h});
  result=new Blob([new Uint8Array(await pdf.save())],{type:"application/pdf"});
  if(!maxKB||result.size<=maxKB*1024)break;
 }
 if(!result)throw Error("PDF creation failed");
 return result;
}
export default function ExamApplicationStudio({tool}:{tool:Tool}) {
 const initial=suggestedKind(tool.slug);
 const [kind,setKind]=useState<ExamAssetKind>(initial);
 const [source,setSource]=useState<{file:File;image:HTMLImageElement}|null>(null);
 const [mode,setMode]=useState<ResizeMode>("size");
 const [width,setWidth]=useState(200);
 const [height,setHeight]=useState(200);
 const [lockAspect,setLockAspect]=useState(true);
 const [percentage,setPercentage]=useState(100);
 const [fit,setFit]=useState<ExamFitMode>("contain");
 const [zoom,setZoom]=useState(1);
 const [offsetX,setOffsetX]=useState(.5);
 const [offsetY,setOffsetY]=useState(.5);
 const [paperCleanup,setPaperCleanup]=useState(false);
 const [format,setFormat]=useState<FormatChoice>("original");
 const [maxKB,setMaxKB]=useState("");
 const [minKB,setMinKB]=useState("");
 const [showAdvanced,setShowAdvanced]=useState(false);
 const [showGuide,setShowGuide]=useState(false);
 const [analysis,setAnalysis]=useState<ExamImageAnalysis|null>(null);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [output,setOutput]=useState<Output|null>(null);
 const [kit,setKit]=useState<KitItem[]>([]);
 const picker=useRef<HTMLInputElement>(null);
 const canvasPreview=useRef<HTMLCanvasElement>(null);
 const [previewReady,setPreviewReady]=useState(false);

 const documentMode=kind==="document";
 const originalW=source?.image.naturalWidth||200,originalH=source?.image.naturalHeight||200;
 const actual=mode==="percent"?percentDimensions(originalW,originalH,percentage):{width:clampExamDimension(width),height:clampExamDimension(height)};
 const effectiveFormat:ExamImageFormat=format==="original"
  ?(source?.file.type==="image/png"?"png":source?.file.type==="image/webp"?"webp":"jpeg"):format;
 const maxNumber=maxKB.trim()?Number(maxKB):null;
 const minNumber=minKB.trim()?Number(minKB):null;
 const extension=effectiveFormat==="jpeg"?"jpg":effectiveFormat;
 const displayName=source?cleanName(source.file.name)+"-"+actual.width+"x"+actual.height+"."+extension:"";
 const canEdit=!!source&&!busy;

 function resetEditor(){
  setMode("size");setLockAspect(true);setPercentage(100);setFit("contain");
  setZoom(1);setOffsetX(.5);setOffsetY(.5);setPaperCleanup(false);
  setFormat("original");setMaxKB("");setMinKB("");setError("");setOutput(null);setAnalysis(null);
 }
 function chooseKind(id:ExamAssetKind) {
  if(id===kind)return;
  setKind(id);
  // Preserve the uploaded image across editor modes, but each type gets a
  // separate exported entry in the kit.
  setOutput(null);setPaperCleanup(false);setFit("contain");setError("");
 }
 async function upload(file?:File) {
  setError("");setOutput(null);setSource(null);setPreviewReady(false);
  if(!file)return;
  setBusy(true);
  try{
   const image=await loadExamImage(file);
   setSource({file,image});
   const dims=percentDimensions(image.naturalWidth,image.naturalHeight,100);
   setWidth(dims.width);setHeight(dims.height);
   resetEditor();
  }catch(e){setError(e instanceof Error?e.message:"Could not load the image");}
  finally{setBusy(false);}
 }
 function setDimension(which:"width"|"height",raw:string){
  const v=Number(raw);
  if(!raw.trim()||!Number.isFinite(v))return;
  const next=clampExamDimension(v);
  if(which==="width"){
   setWidth(next);
   if(lockAspect)setHeight(dimensionFromOther(next,originalH,originalW));
  }else{
   setHeight(next);
   if(lockAspect)setWidth(dimensionFromOther(next,originalW,originalH));
  }
  setOutput(null);
 }
 function newFit(v:ExamFitMode){
  setFit(v);setZoom(1);setOffsetX(.5);setOffsetY(.5);setOutput(null);
 }
 useEffect(()=>{
  if(!source||!canvasPreview.current||documentMode)return;
  let raf=0;
  try{
   const canvas=renderExamImage(source.image,{
    width:actual.width,height:actual.height,kind,zoom,x:offsetX,y:offsetY,
    fit,paperCleanup,inset:.06
   });
   previewCanvas(canvas,canvasPreview.current);
   const quality=analyzeExamCanvas(canvas,kind);
   raf=window.requestAnimationFrame(()=>{setAnalysis(quality);setPreviewReady(true);});
  }catch{
   raf=window.requestAnimationFrame(()=>setPreviewReady(false));
  }
  return()=>window.cancelAnimationFrame(raf);
 },[source,actual.width,actual.height,kind,fit,zoom,offsetX,offsetY,paperCleanup,documentMode]);
 function handleReset(){
  const dims=percentDimensions(originalW,originalH,100);
  setWidth(dims.width);setHeight(dims.height);resetEditor();
 }
 async function generate(){
  if(!source||busy)return;
  setBusy(true);setError("");setOutput(null);
  try{
   if(!Number.isInteger(actual.width)||!Number.isInteger(actual.height)||actual.width<20||actual.height<20||actual.width>4000||actual.height>4000)
    throw Error("Dimensions must be whole pixel values between 20 and 4000");
   if(actual.width*actual.height>16_000_000)throw Error("Output must not exceed 16 megapixels");
   if(maxNumber!==null&&(!Number.isFinite(maxNumber)||maxNumber<1||maxNumber>5000))
    throw Error("Maximum size must be between 1 and 5000 KB");
   if(minNumber!==null&&(!Number.isFinite(minNumber)||minNumber<0||minNumber>5000))
    throw Error("Minimum size must be between 0 and 5000 KB");
   if(minNumber!==null&&maxNumber!==null&&minNumber>maxNumber)
    throw Error("Minimum KB cannot exceed maximum KB");
   if(documentMode) {
    const pdf=await toA4Pdf(source.image,maxNumber);
    const issues:string[]=[];
    if(minNumber!==null&&pdf.size<minNumber*1024)issues.push("PDF is smaller than your requested minimum.");
    if(maxNumber!==null&&pdf.size>maxNumber*1024)issues.push("PDF exceeds your maximum KB.");
    const result={blob:pdf,name:cleanName(source.file.name)+"-A4.pdf",width:595,height:842,issues};
    setOutput(result);setKit(items=>[...items.filter(i=>i.kind!==kind),{kind,blob:pdf,name:result.name,issues}]);
   }else{
    const canvas=renderExamImage(source.image,{
     width:actual.width,height:actual.height,kind,zoom,x:offsetX,y:offsetY,
     fit,paperCleanup,inset:.06
    });
    const result=await sizeTargetExport(canvas,effectiveFormat,minNumber||0,maxNumber||0);
    const technical=validateExamOutput(result.blob.size,actual.width,actual.height,{
     width:actual.width,height:actual.height,format:effectiveFormat,
     ...(minNumber!==null?{minKB:minNumber}:{}),...(maxNumber!==null?{maxKB:maxNumber}:{})
    },result.blob.type);
    const outputName=cleanName(source.file.name)+"-"+kind+"-"+actual.width+"x"+actual.height+"."+extension;
    const value={blob:result.blob,name:outputName,issues:technical.issues,width:actual.width,height:actual.height};
    setOutput(value);
    setKit(items=>[...items.filter(i=>i.kind!==kind),{kind,blob:result.blob,name:outputName,issues:technical.issues}]);
   }
  }catch(e){setError(e instanceof Error?e.message:"Export failed");}
  finally{setBusy(false);}
 }
 async function exportKit(){
  if(!kit.length||busy)return;
  setBusy(true);setError("");
  try{
   const JSZip=(await import("jszip")).default;
   const zip=new JSZip();
   kit.forEach(item=>zip.file(item.name,item.blob));
   downloadBlob(await zip.generateAsync({type:"blob"}),"airtools-form-upload-files.zip");
  }catch(e){setError(e instanceof Error?e.message:"Could not create ZIP file");}
  finally{setBusy(false);}
 }
 const guide=GUIDE[kind];

 return <div className="space-y-5">
  <header className="rounded-2xl border border-border bg-card p-5">
   <h2 className="text-xl font-bold">Photo, Signature & Thumb Resize Editor</h2>
   <p className="mt-1 text-sm text-muted-foreground">Choose your own dimensions, percentage, file size and format. Resize original images in your browser, then download exactly what you prepared.</p>
  </header>

  <div className="flex flex-wrap gap-2" aria-label="Type of image to prepare">
   {UPLOAD_KINDS.map(item=><button key={item.id} type="button" aria-pressed={kind===item.id} onClick={()=>chooseKind(item.id)}
    className={"rounded-xl border px-3 py-2 text-sm font-medium transition-colors "+(kind===item.id?"border-primary bg-primary/10 text-primary":"border-border hover:border-primary/50")}>
    {item.label}
   </button>)}
  </div>

  <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
   <div className="flex flex-wrap items-center gap-3 border-b border-border p-3">
    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted">
     <UploadCloud className="h-4 w-4"/> {source?"Change image":"Add image"}
     <input ref={picker} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={e=>{void upload(e.target.files?.[0]);}}/>
    </label>
    {source&&<>
     <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{source.file.name} · {formatFileSize(source.file.size)}</span>
     <button type="button" className="rounded-lg border border-border p-2 text-muted-foreground hover:text-foreground" title="Remove image"
      onClick={()=>{setSource(null);setOutput(null);setPreviewReady(false);if(picker.current)picker.current.value="";}}>
      <Trash2 className="h-4 w-4"/>
     </button>
    </>}
    {!source&&<span className="text-xs text-muted-foreground">JPG, PNG or WebP · 15 MiB maximum · private, on-device</span>}
   </div>

   <div className="grid lg:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]">
    <div className="space-y-6 border-b border-border p-4 sm:p-5 lg:border-b-0 lg:border-r">
     <section className="space-y-4">
      <h3 className="font-semibold">Resize Settings</h3>
      <div className="flex rounded-xl bg-muted p-1" role="tablist" aria-label="Resize method">
       {([{id:"size",label:"By Size"},{id:"percent",label:"As Percentage"}] as const).map(tab=>
        <button key={tab.id} type="button" role="tab" aria-selected={mode===tab.id} onClick={()=>{setMode(tab.id);setOutput(null);}}
         className={"flex-1 rounded-lg px-2 py-2 text-xs font-semibold sm:text-sm "+(mode===tab.id?"bg-background text-foreground shadow-sm":"text-muted-foreground hover:text-foreground")}>
         {tab.label}
        </button>)}
      </div>
      {mode==="size" ? <>
       <div className="grid grid-cols-2 gap-3">
        <label className="text-sm">Width <span className="text-xs text-muted-foreground">(px)</span>
         <input type="number" min="20" max="4000" step="1" value={width} disabled={!source} onChange={e=>setDimension("width",e.target.value)}
          className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-3"/>
        </label>
        <label className="text-sm">Height <span className="text-xs text-muted-foreground">(px)</span>
         <input type="number" min="20" max="4000" step="1" value={height} disabled={!source} onChange={e=>setDimension("height",e.target.value)}
          className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-3"/>
        </label>
       </div>
       <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={lockAspect} onChange={e=>{
         const next=e.target.checked;setLockAspect(next);
         if(next&&source)setHeight(dimensionFromOther(width,originalH,originalW));setOutput(null);
        }}/>
        <LockKeyhole className="h-4 w-4 text-muted-foreground"/>Lock aspect ratio
       </label>
       <p className="text-xs text-muted-foreground">Unlock to set any width and height. The Fit option controls whether the image is cropped or padded.</p>
      </>:<>
       <label className="block text-sm">Size: <strong>{percentage}%</strong>
        <div className="mt-2 flex items-center gap-3 rounded-xl border border-border p-3">
         <input type="range" min="10" max="300" step="5" value={percentage} disabled={!source}
          onChange={e=>{setPercentage(Number(e.target.value));setOutput(null);}} className="min-w-0 flex-1 accent-primary"/>
         <input type="number" min="10" max="300" value={percentage} disabled={!source}
          onChange={e=>{setPercentage(Math.min(300,Math.max(10,Number(e.target.value)||10)));setOutput(null);}}
          className="w-16 rounded-lg border border-border bg-background p-1.5 text-right text-sm" aria-label="Resize percentage"/>
        </div>
       </label>
       <p className="text-xs text-muted-foreground">{originalW} × {originalH} becomes {actual.width} × {actual.height} pixels.</p>
      </>}
      {!documentMode&&<div className="space-y-2">
       <label className="block text-sm font-medium">How the image fits</label>
       <select value={fit} disabled={!source} onChange={e=>newFit(e.target.value as ExamFitMode)}
        className="w-full rounded-lg border border-border bg-background p-3 text-sm">
        <option value="contain">Fit entire image (no crop)</option>
        <option value="cover">Fill dimensions (crop edges)</option>
        <option value="stretch">Stretch to dimensions (can distort)</option>
       </select>
       {fit==="cover"&&source&&<div className="space-y-2 rounded-xl bg-muted/50 p-3">
        <label className="block text-xs">Crop zoom: {zoom.toFixed(2)}×
         <input className="block w-full accent-primary" type="range" min="1" max="4" step=".05" value={zoom} onChange={e=>{setZoom(Number(e.target.value));setOutput(null);}}/>
        </label>
        {(["X","Y"] as const).map(axis=><label key={axis} className="block text-xs">{axis==="X"?"Horizontal":"Vertical"} crop position
         <input className="block w-full accent-primary" type="range" min="0" max="1" step=".02" value={axis==="X"?offsetX:offsetY}
          onChange={e=>{(axis==="X"?setOffsetX:setOffsetY)(Number(e.target.value));setOutput(null);}}/>
        </label>)}
       </div>}
       {fit==="stretch"&&<p className="text-xs text-amber-700 dark:text-amber-400">Stretching can distort faces, signatures and thumb impressions. Use Fit or Crop when possible.</p>}
      </div>}
      {!documentMode&&kind!=="photo"&&<label className="flex items-start gap-2 text-xs text-muted-foreground">
       <input type="checkbox" checked={paperCleanup} onChange={e=>{setPaperCleanup(e.target.checked);setOutput(null);}}/>
       Whiten nearly-white scanned paper (optional)
      </label>}
     </section>

     <section className="space-y-4">
      <h3 className="font-semibold">Export Settings</h3>
      <label className="block text-sm">Target file size <span className="text-muted-foreground">(optional maximum)</span>
       <div className="mt-2 flex overflow-hidden rounded-lg border border-border">
        <input type="number" min="1" max="5000" value={maxKB} placeholder="e.g. 50" onChange={e=>{setMaxKB(e.target.value);setOutput(null);}}
         className="min-w-0 flex-1 bg-background px-3 py-3"/>
        <span className="border-l border-border bg-muted px-3 py-3 text-sm">KB</span>
       </div>
      </label>
      <p className="text-xs text-muted-foreground">Enter your own maximum file size. JPG and WebP can reduce quality to meet it when possible; PNG may not.</p>
      <button type="button" className="flex w-full items-center justify-between text-sm text-muted-foreground" onClick={()=>setShowAdvanced(v=>!v)} aria-expanded={showAdvanced}>
       Advanced size options <ChevronDown className={"h-4 w-4 transition-transform "+(showAdvanced?"rotate-180":"")}/>
      </button>
      {showAdvanced&&<label className="block text-sm">Minimum file size <span className="text-muted-foreground">(optional)</span>
       <div className="mt-2 flex overflow-hidden rounded-lg border border-border">
        <input type="number" min="0" max="5000" value={minKB} placeholder="No minimum" onChange={e=>{setMinKB(e.target.value);setOutput(null);}}
         className="min-w-0 flex-1 bg-background px-3 py-3"/>
        <span className="border-l border-border bg-muted px-3 py-3 text-sm">KB</span>
       </div>
      </label>}
      {!documentMode&&<label className="block text-sm">Save Image As
       <select className="mt-2 w-full rounded-lg border border-border bg-background p-3" value={format}
        onChange={e=>{setFormat(e.target.value as FormatChoice);setOutput(null);}}>
        <option value="original">Original format</option>
        <option value="jpeg">JPG</option>
        <option value="png">PNG</option>
        <option value="webp">WebP</option>
       </select>
      </label>}
      {documentMode&&<p className="text-xs text-muted-foreground">This mode generates a single-page A4 PDF from your image. Original multi-page PDF processing is available in the PDF tools.</p>}
     </section>

     <div className="space-y-2">
      {error&&<p role="alert" className="rounded-lg border border-red-300 p-2 text-sm text-red-600">{error}</p>}
      <Button variant="gradient" size="lg" className="w-full" disabled={!canEdit} onClick={()=>{void generate();}}>
       <Download className="mr-2 h-4 w-4"/>{busy?"Processing…":"Export"}
      </Button>
      <Button variant="outline" size="sm" className="w-full" disabled={!source} onClick={handleReset}>
       <RotateCcw className="mr-1 h-4 w-4"/>Reset settings
      </Button>
     </div>
    </div>

    <div className="min-w-0 space-y-5 bg-muted/10 p-4 sm:p-6">
     {!source?<div className="flex min-h-80 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border text-center">
      <ImageIcon className="h-10 w-10 text-muted-foreground"/>
      <p className="font-semibold">Add an image to see your preview</p>
      <p className="max-w-xs text-sm text-muted-foreground">Its original width and height will populate automatically, just like a regular image resizer.</p>
     </div>:<div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
       <h3 className="font-semibold">Live Preview</h3>
       <span className="rounded-lg bg-muted px-2 py-1 text-xs">{documentMode?"A4 PDF":actual.width+" × "+actual.height+" px"}</span>
      </div>
      <div className="flex min-h-64 items-center justify-center rounded-xl bg-muted/50 p-4" style={{backgroundImage:"repeating-conic-gradient(#e6e6e6 0 25%,#fff 0 50%)",backgroundSize:"20px 20px"}}>
       {documentMode?
        <div className="space-y-3 text-center text-sm">
         <FileImage className="mx-auto h-10 w-10"/>
         <p>Source image will be placed on an A4 PDF page.</p>
         <p className="text-muted-foreground">{originalW} × {originalH} px source</p>
        </div>:
        <canvas ref={canvasPreview} aria-label="Image resized preview" className={"max-h-[440px] max-w-full rounded shadow-sm "+(!previewReady?"opacity-60":"")}/>
       }
      </div>
      <div className="rounded-xl border border-border bg-card p-3">
       <p className="truncate text-sm font-semibold">{documentMode?cleanName(source.file.name)+"-A4.pdf":displayName}</p>
       <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-lg bg-muted px-2 py-1">{originalW} × {originalH}</span>
        <span aria-hidden>→</span>
        <span className="rounded-lg bg-green-100 px-2 py-1 font-semibold text-green-900">{documentMode?"A4":actual.width+" × "+actual.height}</span>
       </div>
       <p className="mt-2 text-xs text-muted-foreground">Preview shows the chosen crop and dimensions. Actual output file size is verified after export.</p>
      </div>
      {analysis&&!documentMode&&<p className="text-xs text-muted-foreground">
       <Info className="mr-1 inline h-3.5 w-3.5"/>Brightness {analysis.brightness}/255 · Contrast {analysis.contrast}. These are rough signals, not official acceptance tests.
      </p>}
     </div>}

     {output&&<section className="space-y-3 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">
       {output.issues.length?<AlertTriangle className="h-5 w-5 text-amber-600"/>:<CheckCircle2 className="h-5 w-5 text-green-600"/>}
       <div><p className="text-sm font-semibold">{output.issues.length?"Review size or format":"Technical checks passed"}</p>
        <p className="text-xs text-muted-foreground">{displaySize(output.blob.size)} · {output.name}</p></div>
      </div>
      {output.issues.map(issue=><p key={issue} className="text-xs text-amber-700">{issue}</p>)}
      <p className="text-xs text-muted-foreground">File checks do not guarantee acceptance by an application website.</p>
      <Button onClick={()=>downloadBlob(output.blob,output.name)} className="w-full"><Download className="mr-2 h-4 w-4"/>Download image/file</Button>
     </section>}
    </div>
   </div>
  </div>

  {kit.length>0&&<section className="space-y-3 rounded-2xl border border-border p-4">
   <div className="flex items-center justify-between">
    <h3 className="font-semibold">Your prepared files</h3>
    <button type="button" className="text-xs text-muted-foreground underline" onClick={()=>setKit([])}>Clear list</button>
   </div>
   <div className="grid gap-2 sm:grid-cols-2">{kit.map(item=><div key={item.kind} className="flex justify-between gap-2 rounded-lg bg-muted/30 p-3 text-xs">
    <span className="truncate">{item.name}</span>
    <span className={item.issues.length?"text-amber-600":"text-green-600"}>{displaySize(item.blob.size)}</span>
   </div>)}</div>
   <Button variant="outline" onClick={()=>{void exportKit();}} disabled={busy} className="w-full"><Package className="mr-2 h-4 w-4"/>Download all as ZIP</Button>
  </section>}
  <section className="rounded-2xl border border-border p-4">
   <button type="button" aria-expanded={showGuide} onClick={()=>setShowGuide(v=>!v)} className="flex w-full items-center justify-between gap-2 text-left font-semibold">
    <span>Accepted & rejected image checklist</span><ChevronDown className={"h-4 w-4 transition-transform "+(showGuide?"rotate-180":"")}/>
   </button>
   {showGuide&&<div className="mt-4 grid gap-3 sm:grid-cols-2">
    <div className="space-y-2 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-950 dark:bg-green-950/20 dark:text-green-200">
     <p className="flex items-center gap-1 font-semibold"><CheckCircle2 className="h-4 w-4"/>Typically suitable</p>
     {guide.good.map(x=><p key={x} className="text-xs">✓ {x}</p>)}
    </div>
    <div className="space-y-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-950 dark:bg-red-950/20 dark:text-red-200">
     <p className="flex items-center gap-1 font-semibold"><XCircle className="h-4 w-4"/>Common problems</p>
     {guide.bad.map(x=><p key={x} className="text-xs">✕ {x}</p>)}
    </div>
    <p className="text-xs text-muted-foreground sm:col-span-2">These examples are general quality guidance. Follow the specifications shown by the application website you are submitting to.</p>
   </div>}
  </section>
  <p className="flex items-start gap-2 text-xs text-muted-foreground"><AlertTriangle className="h-4 w-4 shrink-0"/>No source image is uploaded to AirTools servers by this editor. Use an authentic photo, genuine handwritten signature or real thumb impression. Cropping and resizing cannot replace any compulsory live-camera capture.</p>
 </div>;
}
