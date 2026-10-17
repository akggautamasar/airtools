"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
 AlertTriangle, CheckCircle2, Download, Image as ImageIcon,
 Info, Package, Plus, RotateCcw, Trash2, UploadCloud
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadBlob } from "@/lib/utils";
import type { Tool } from "@/types";
import { physicalToPixels, pixelsToPhysical, type ExamDimensionUnit } from "@/lib/exam-upload-specs";
import { IMAGE_WORKBENCH_BY_SLUG } from "@/lib/image-workbench-presets";
import type { ImageWorkbenchPreset } from "@/lib/image-workbench-presets";
import {
 canvasBlob, encodeImage, exportName, imageToPdf, inspectImageDpi, openImages,
 renderWorkbench, tilesFromCanvas, ensureOutputSize, suffixForOutput,
 type ExportFormat,type WorkbenchSettings
} from "@/lib/image-workbench-engine";

type ExportResult = {name:string;blob:Blob;passed:boolean;w:number;h:number;notice?:string};
const SUPPORTED=["image/png","image/jpeg","image/webp","image/bmp","image/avif","image/jfif"];
const PREVIEW_LIMIT=850;
function sizeLabel(bytes:number){return (bytes/1024).toFixed(1)+" KiB";}
function safeNumber(value:number,min:number,max:number){return Number.isFinite(value)?Math.max(min,Math.min(max,value)):min;}
function sourceSize(width:number,height:number){
 const fit=Math.min(1,5000/Math.max(width,height),Math.sqrt(16_000_000/(width*height)));
 return {width:Math.max(1,Math.round(width*fit)),height:Math.max(1,Math.round(height*fit))};
}
function resizePreview(original:HTMLCanvasElement,preview:HTMLCanvasElement){
 const scale=Math.min(1,PREVIEW_LIMIT/Math.max(original.width,original.height));
 preview.width=Math.max(1,Math.round(original.width*scale));
 preview.height=Math.max(1,Math.round(original.height*scale));
 preview.getContext("2d")?.drawImage(original,0,0,preview.width,preview.height);
}
const DEFAULT:WorkbenchSettings={
 width:1000,height:1000,fit:"contain",background:"#ffffff",quality:92,
 maxKB:0,strict:false,dpi:300,strength:30,
 regionX:30,regionY:30,regionW:40,regionH:40,
 border:5,radius:15,text:"",textColor:"#ffffff",fontSize:36,
 rows:2,cols:2,arrangement:"grid",output:"jpeg",rotation:0
};
export default function ImageWorkbench({tool}:{tool:Tool}){
 const preset=IMAGE_WORKBENCH_BY_SLUG[tool.slug];
 if(!preset)return <p className="rounded-xl border border-amber-400 p-4">This image operation is not configured.</p>;
 return <Workbench tool={tool} preset={preset}/>;
}
function Workbench({tool,preset}:{tool:Tool;preset:ImageWorkbenchPreset}){
 const initial=useMemo(()=>{
  const dpi=preset.dpi||300;
  const asPx=(n:number)=>physicalToPixels(n,preset.unit||"px",dpi);
  const init:WorkbenchSettings={...DEFAULT,dpi,maxKB:preset.targetKB||0,
   width:preset.width?Math.min(5000,asPx(preset.width)):1000,
   height:preset.height?Math.min(5000,asPx(preset.height)):1000,
   arrangement:preset.arrangement||"grid",
   rows:preset.rows||2,cols:preset.cols||2,
   output:preset.output||("jpeg" as ExportFormat)
  };
  if(preset.mode==="overlay"&&preset.overlay==="round")init.output="png";
  return init;
 },[preset]);
 const [files,setFiles]=useState<File[]>([]);
 const [previewUrls,setPreviewUrls]=useState<string[]>([]);
 const [selected,setSelected]=useState(0);
 const [settings,setSettings]=useState(initial);
 const [keepSource,setKeepSource]=useState(!preset.width);
 const [lockAspect,setLockAspect]=useState(true);
 const [unit,setUnit]=useState<ExamDimensionUnit>(preset.unit||"px");
 const [percent,setPercent]=useState(100);
 const [percentMode,setPercentMode]=useState(false);
 const [logo,setLogo]=useState<File|null>(null);
 const [sourceDpi,setSourceDpi]=useState<number|null>(null);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 const [error,setError]=useState("");
 const [results,setResults]=useState<ExportResult[]>([]);
 const [customName,setCustomName]=useState("");
 const canvasRef=useRef<HTMLCanvasElement>(null);
 const previewRun=useRef(0);
 const previewUrlsRef=useRef<string[]>([]);
 const fileInput=useRef<HTMLInputElement>(null);
 const sourceFile=files[selected];
 const mode=preset.mode;
 const multiple=mode==="layout"||mode==="split"||tool.slug.includes("bulk")||mode==="compress"||mode==="convert";
 const ready=files.length>0;
 const set=(key:keyof WorkbenchSettings,value:unknown)=>{
  setSettings(prev=>({...prev,[key]:value}));setResults([]);
 };
 const updateFiles=(added:FileList|null)=>{
  if(!added?.length)return;
  const accepted=Array.from(added).filter(f=>SUPPORTED.includes(f.type)||/\.(jpe?g|png|webp|bmp|avif|jfif)$/i.test(f.name));
  const next=[...files,...accepted].slice(0,12);
  if(!next.length){setError("Choose JPG, PNG, WebP, BMP or a browser-supported AVIF image.");return;}
  if(next.some(f=>f.size>20*1024*1024)){setError("Each image must be at most 20 MiB.");return;}
  previewUrlsRef.current.forEach(url=>URL.revokeObjectURL(url));
  const urls=next.map(f=>URL.createObjectURL(f));
  previewUrlsRef.current=urls;setPreviewUrls(urls);
  setFiles(next);setSelected(0);setResults([]);setError("");setMessage("");
  if(fileInput.current)fileInput.current.value="";
 };
 useEffect(()=>()=>{
  previewUrlsRef.current.forEach(url=>URL.revokeObjectURL(url));
 },[]);
 useEffect(()=>{
  let cancelled=false;
  if(!sourceFile)return;
  void (async()=>{
   try{
    const img=await createImageBitmap(sourceFile);
    if(cancelled){img.close();return;}
    if(!preset.width&&!preset.height){
     const dims=sourceSize(img.width,img.height);
     setSettings(prev=>({...prev,width:dims.width,height:dims.height}));
    }
    img.close();
    const dpi=inspectImageDpi(new Uint8Array(await sourceFile.arrayBuffer()));
    if(!cancelled)setSourceDpi(dpi);
   }catch{if(!cancelled)setError("This browser cannot decode this file. Try converting it to JPG or PNG first.");}
  })();
  return()=>{cancelled=true;};
 },[sourceFile,preset.width,preset.height]);
 const preview=useCallback(async()=>{
  if(!files.length||!canvasRef.current)return;
  const id=++previewRun.current;
  let images:ImageBitmap[]=[];
  let logoBitmap:ImageBitmap|null=null;
  try{
   images=await openImages(mode==="layout"?files:[files[selected]]);
   if(logo)logoBitmap=await createImageBitmap(logo);
   if(id!==previewRun.current)return;
   const first=images[0];
   const {width,height}=keepSource?sourceSize(first.width,first.height):{width:settings.width,height:settings.height};
   const small=sourceSize(width,height);
   const factor=Math.min(1,PREVIEW_LIMIT/Math.max(small.width,small.height));
   const previewSettings={...settings,width:Math.max(1,Math.round(small.width*factor)),height:Math.max(1,Math.round(small.height*factor)),
    border:settings.border,fontSize:Math.max(12,Math.round(settings.fontSize*factor))};
   const result=renderWorkbench(images,preset,previewSettings,logoBitmap||undefined);
   if(id===previewRun.current&&canvasRef.current)resizePreview(result,canvasRef.current);
  }catch(e){
   if(id===previewRun.current)setError(e instanceof Error?e.message:"Preview unavailable");
  }finally{images.forEach(img=>img.close());logoBitmap?.close();}
 },[files,selected,settings,preset,keepSource,mode,logo]);
 useEffect(()=>{const id=window.setTimeout(()=>{void preview();},180);return()=>{previewRun.current++;window.clearTimeout(id);};},[preview]);
 const changeDimension=(key:"width"|"height",value:number)=>{
  const n=safeNumber(value,1,5000);
  setSettings(prev=>{
   const px=unit==="px"?Math.round(n):physicalToPixels(n,unit,prev.dpi);
   const next={...prev,[key]:safeNumber(px,1,5000)};
   if(lockAspect&&files[selected]){
    const image=canvasRef.current; // editable ratio follows original source
    const ratio=image&&image.width&&image.height?image.width/image.height:prev.width/prev.height;
    if(key==="width")next.height=safeNumber(Math.round(next.width/ratio),1,5000);
    else next.width=safeNumber(Math.round(next.height*ratio),1,5000);
   }
   return next;
  });
  setKeepSource(false);setResults([]);
 };
 const outputDimensions=(img:ImageBitmap)=>{
  if(keepSource)return sourceSize(img.width,img.height);
  if(percentMode){
   const k=percent/100;
   return sourceSize(Math.max(1,Math.round(img.width*k)),Math.max(1,Math.round(img.height*k)));
  }
  return ensureOutputSize(settings.width,settings.height);
 };
 const exportNow=async()=>{
  if(!ready||busy)return;
  setError("");setMessage("");setBusy(true);setResults([]);
  const outs:ExportResult[]=[];
  let logoBitmap:ImageBitmap|null=null;
  try{
   if(settings.maxKB<0||settings.maxKB>4096)throw Error("Target maximum must be 0–4096 KiB.");
   if(settings.dpi<36||settings.dpi>1200)throw Error("Choose a DPI between 36 and 1200.");
   if(logo)logoBitmap=await createImageBitmap(logo);
   const batches=mode==="layout"?[files]:files.map(f=>[f]);
   for(let i=0;i<batches.length;i++){
    setMessage(`Processing ${i+1} of ${batches.length}…`);
    const group=batches[i],imgs=await openImages(group);
    try{
     const first=imgs[0],dims=outputDimensions(first);
     let settingsForOutput={...settings,...dims};
     let canvas=renderWorkbench(imgs,preset,settingsForOutput,logoBitmap||undefined);
     if(mode==="split"){
      const tiles=tilesFromCanvas(canvas,preset.rows||settings.rows,preset.cols||settings.cols);
      for(let j=0;j<tiles.length;j++){
       const blob=await canvasBlob(tiles[j],"png");
       outs.push({name:exportName(group[0].name,"png","tile-"+String(j+1).padStart(2,"0")),blob,passed:true,w:tiles[j].width,h:tiles[j].height});
      }
      continue;
     }
     if(mode==="inspect"){
      outs.push({name:group[0].name,blob:group[0],passed:true,w:first.width,h:first.height,
       notice:"Source file only; inspect the source properties shown above."});
      continue;
     }
     let blob:Blob,passed=true,notice="";
     if(mode==="pdf"){
      const pdf=await imageToPdf(canvas,settings.maxKB);
      blob=pdf.blob;passed=pdf.passed;
      if(!passed)notice="Could not meet the PDF size limit. Reduce output dimensions.";
     }else{
      let encoded=await encodeImage(canvas,settingsForOutput,preset);
      if(!encoded.passed&&settings.strict&&settings.maxKB&&
         (settings.output==="jpeg"||settings.output==="jfif"||settings.output==="webp")){
       for(let attempt=0;attempt<9&&!encoded.passed;attempt++){
        const w=Math.max(64,Math.round(canvas.width*.83)),h=Math.max(64,Math.round(canvas.height*.83));
        if(w===canvas.width&&h===canvas.height)break;
        const reduced=document.createElement("canvas");reduced.width=w;reduced.height=h;
        reduced.getContext("2d")?.drawImage(canvas,0,0,w,h);
        canvas=reduced;settingsForOutput={...settingsForOutput,width:w,height:h};
        encoded=await encodeImage(canvas,settingsForOutput,preset);
       }
      }
      blob=encoded.blob;passed=encoded.passed;
      if(!passed)notice="Could not meet the selected KB maximum at this quality/format. Lower dimensions or choose JPG/WebP.";
     }
     const suffix=mode==="pdf"?"pdf":suffixForOutput(settings.output);
     const base=customName.trim()?customName.trim():group[0].name;
     const outputName=(customName.trim()?base.replace(/\.[^.]+$/,"").replace(/[\\/<>:"|?*]/g,"-").slice(0,96)+"-AirTools."+suffix:
       exportName(base,settings.output,mode==="pdf"?"AirTools":"AirTools"));
     const finalName=mode==="pdf"?exportName(group[0].name,"jpeg").replace(/\.jpg$/,".pdf"):outputName;
     outs.push({name:customName.trim()?outputName:finalName,blob,passed,w:canvas.width,h:canvas.height,notice});
    }finally{imgs.forEach(img=>img.close());}
   }
   setResults(outs);setMessage(`${outs.length} file(s) prepared locally.`);
  }catch(e){setError(e instanceof Error?e.message:"Image processing failed");}
  finally{logoBitmap?.close();setBusy(false);}
 };
 const downloadAll=async()=>{
  if(!results.length)return;
  if(results.length===1){downloadBlob(results[0].blob,results[0].name);return;}
  setBusy(true);
  try{
   const JSZip=(await import("jszip")).default;
   const zip=new JSZip();
   results.forEach((result,i)=>zip.file(String(i+1).padStart(2,"0")+"-"+result.name,result.blob));
   downloadBlob(await zip.generateAsync({type:"blob",compression:"DEFLATE",compressionOptions:{level:3}}),"AirTools-image-results.zip");
  }catch(e){setError(e instanceof Error?e.message:"ZIP creation failed");}
  finally{setBusy(false);}
 };
 const selectClass="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
 const inputClass="w-full min-w-0 rounded-lg border border-border bg-background px-3 py-2 text-sm";
 const numeric=(label:string,key:keyof WorkbenchSettings,min:number,max:number,step=1)=>{
  const value=settings[key];
  if(typeof value!=="number")return null;
  return <label className="text-xs font-medium">{label}
    <input type="number" className={inputClass} min={min} max={max} step={step} value={value}
     onChange={e=>set(key,safeNumber(Number(e.target.value),min,max))}/>
   </label>;
 };
 return <div className="space-y-5">
  <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
   <h2 className="text-lg font-bold">{tool.name}</h2>
   <p className="text-sm text-muted-foreground">{preset.description}</p>
   {preset.note&&<p className="text-xs text-amber-700 dark:text-amber-400"><AlertTriangle className="mr-1 inline h-4 w-4"/>{preset.note}</p>}
   <p className="text-xs text-muted-foreground">Private, on-device editing. Up to 12 files, 20 MiB each. Output remains subject to browser and source image limits.</p>
  </div>
  <div className="rounded-2xl border border-border bg-card shadow-sm">
   <div className="flex flex-wrap items-center gap-3 border-b border-border p-3">
    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold hover:bg-muted">
     <UploadCloud className="h-4 w-4"/>Add images
     <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/bmp,image/avif,.jfif"
      multiple={multiple} className="sr-only" onChange={e=>updateFiles(e.target.files)}/>
    </label>
    {ready&&<button type="button" className="inline-flex items-center gap-1 text-xs text-muted-foreground" onClick={()=>{
      previewUrlsRef.current.forEach(url=>URL.revokeObjectURL(url));
      previewUrlsRef.current=[];setPreviewUrls([]);
      setFiles([]);setResults([]);setSelected(0);setSourceDpi(null);
    }}><Trash2 className="h-4 w-4"/>Clear files</button>}
    <span className="text-xs text-muted-foreground">{files.length} image(s) selected</span>
   </div>
   <div className="grid lg:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]">
    <div className="space-y-5 border-b border-border p-4 lg:border-b-0 lg:border-r">
     <h3 className="font-semibold">Settings</h3>
     {(mode==="resize"||mode==="compress"||mode==="convert"||mode==="effect"||mode==="overlay"||mode==="dpi"||mode==="pdf")&&
      <div className="space-y-3">
       <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={keepSource} onChange={e=>{setKeepSource(e.target.checked);setResults([]);}}/>Keep input pixel dimensions</label>
       {!keepSource&&<div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
         <span className="text-sm font-medium">Output dimensions</span>
         <select className="rounded-lg border border-border bg-background p-1.5 text-xs" value={unit} onChange={e=>setUnit(e.target.value as ExamDimensionUnit)}>
          <option value="px">Pixels</option><option value="in">Inches</option><option value="cm">Centimeters</option><option value="mm">Millimeters</option>
         </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
         {(["width","height"] as const).map(key=><label key={key} className="text-xs capitalize">{key}
          <input className={inputClass} type="number" min=".01" step={unit==="px"?1:.01}
           value={Number((unit==="px"?settings[key]:pixelsToPhysical(settings[key],unit,settings.dpi)).toFixed(unit==="px"?0:2))}
           onChange={e=>{const n=Number(e.target.value);if(n>0)changeDimension(key,n);}}/>
         </label>)}
        </div>
        {unit!=="px"&&numeric("Physical conversion DPI / PPI","dpi",36,1200)}
        <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={lockAspect} onChange={e=>setLockAspect(e.target.checked)}/>Lock aspect ratio</label>
        <label className="block text-xs">Fit
         <select className={selectClass} value={settings.fit} onChange={e=>set("fit",e.target.value)}>
          <option value="contain">Keep whole image (pad)</option><option value="cover">Fill / crop image</option><option value="stretch">Stretch (may distort)</option>
         </select>
        </label>
        <label className="text-xs">Percentage of original (optional)
         <div className="flex gap-2">
          <input type="checkbox" checked={percentMode} onChange={e=>setPercentMode(e.target.checked)} aria-label="Use percentage resize"/>
          <input type="range" min="10" max="300" step="5" value={percent} onChange={e=>setPercent(Number(e.target.value))} className="min-w-0 flex-1 accent-primary"/>
          <span>{percent}%</span>
         </div>
        </label>
       </div>}
      </div>}
     {(mode==="compress"||mode==="pdf"||mode==="dpi")&&<div className="space-y-2">
      {numeric(mode==="pdf"?"PDF maximum size (KiB; 0 = none)":"Maximum output size (KiB; 0 = none)","maxKB",0,4096)}
      {mode==="compress"&&<label className="flex items-start gap-2 text-xs">
       <input type="checkbox" checked={settings.strict} onChange={e=>set("strict",e.target.checked)}/>
       Allow reducing image dimensions when quality alone cannot meet KB limit
      </label>}
      {preset.slug==="image-kb-increaser"&&<p className="text-xs text-amber-700">Padding JPEG to a larger KB value does not improve resolution or visual quality.</p>}
     </div>}
     {(["resize","compress","convert","effect","overlay","dpi","inspect"].includes(mode))&&<label className="block text-xs font-medium">Save format
      <select className={selectClass} value={settings.output} onChange={e=>set("output",e.target.value)}>
       <option value="jpeg">JPG / JPEG</option><option value="png">PNG</option><option value="webp">WebP</option>
       {mode==="convert"&&<><option value="bmp">BMP</option><option value="ico">ICO (256px)</option><option value="jfif">JFIF (JPEG)</option></>}
      </select>
     </label>}
     {["compress","resize","convert"].includes(mode)&&numeric("JPG / WebP quality %","quality",10,99)}
     {mode==="effect"&&<div className="space-y-3">
      <label className="block text-xs">Effect strength: {settings.strength}
       <input className="w-full accent-primary" type="range" min="2" max="100" value={settings.strength} onChange={e=>set("strength",Number(e.target.value))}/>
      </label>
      {preset.slug.endsWith("-region")&&<div className="grid grid-cols-2 gap-2">
       {numeric("Region X (%)","regionX",0,95)}{numeric("Region Y (%)","regionY",0,95)}
       {numeric("Region width (%)","regionW",1,100)}{numeric("Region height (%)","regionH",1,100)}
      </div>}
     </div>}
     {mode==="overlay"&&<div className="space-y-2">
      {(preset.overlay==="text"||preset.overlay==="date")&&<label className="block text-xs">Text
       <textarea className={inputClass} rows={3} maxLength={180} placeholder="Enter text (and a new line if needed)" value={settings.text} onChange={e=>set("text",e.target.value)}/>
      </label>}
      {preset.overlay==="logo"&&<label className="block text-xs">Choose your logo
       <input type="file" accept="image/png,image/jpeg,image/webp" className="mt-1 w-full text-xs" onChange={e=>setLogo(e.target.files?.[0]||null)}/>
      </label>}
      {["text","date","logo"].includes(preset.overlay||"")&&numeric("Text / logo size","fontSize",12,150)}
      {preset.overlay==="border"&&numeric("Border thickness (%)","border",1,35)}
      {preset.overlay==="round"&&numeric("Corner radius (%)","radius",1,50)}
      <label className="flex items-center gap-2 text-xs">Overlay color
       <input type="color" value={settings.textColor} onChange={e=>set("textColor",e.target.value)}/>
      </label>
     </div>}
     {mode==="layout"&&<div className="space-y-2">
      <label className="block text-xs">Arrange images
       <select className={selectClass} value={settings.arrangement} onChange={e=>set("arrangement",e.target.value)}>
        <option value="grid">Grid collage</option><option value="horizontal">Side by side</option>
        <option value="vertical">Vertical stack</option><option value="photo-signature">Photo over signature</option>
       </select>
      </label>
      {numeric("Columns (grid)","cols",1,8)}
     </div>}
     {mode==="split"&&<div className="grid grid-cols-2 gap-2">{numeric("Rows","rows",1,8)}{numeric("Columns","cols",1,8)}</div>}
     {mode==="dpi"&&numeric("Embed DPI / PPI","dpi",36,1200)}
     {mode==="inspect"&&<p className="text-sm text-muted-foreground">The preview shows your image; source pixels and available JPEG/PNG DPI metadata are shown to the right. No claim is made that missing EXIF values were detected.</p>}
     <label className="flex items-center gap-2 text-xs">Canvas background
      <input type="color" value={settings.background} onChange={e=>set("background",e.target.value)}/>
     </label>
     <label className="block text-xs">Filename override (optional)
      <input type="text" maxLength={90} value={customName} onChange={e=>setCustomName(e.target.value)} placeholder="Original name + -AirTools" className={inputClass}/>
     </label>
     {error&&<p role="alert" className="rounded-lg border border-red-300 p-3 text-sm text-red-600">{error}</p>}
     {message&&<p role="status" className="text-xs text-muted-foreground">{message}</p>}
     <Button variant="gradient" size="lg" className="w-full" disabled={!ready||busy} onClick={()=>{void exportNow();}}>
      <Plus className="mr-2 h-4 w-4"/>{busy?"Processing…":mode==="inspect"?"Inspect Image":"Create "+(mode==="pdf"?"PDF":"Image")+" Files"}
     </Button>
     <Button variant="outline" size="sm" className="w-full" onClick={()=>{setSettings(initial);setKeepSource(!preset.width);setError("");setResults([]);}}>
      <RotateCcw className="mr-2 h-4 w-4"/>Reset settings
     </Button>
    </div>
    <div className="min-w-0 space-y-4 bg-muted/10 p-4 lg:p-6">
     {!ready?<div className="flex min-h-72 flex-col items-center justify-center rounded-xl border-2 border-dashed border-border text-center">
      <ImageIcon className="mb-3 h-10 w-10 text-muted-foreground"/>
      <p className="font-semibold">Choose an image to begin</p>
      <p className="mt-1 text-sm text-muted-foreground">No account, card or server upload needed.</p>
     </div>:<>
      <div className="flex flex-wrap items-center justify-between gap-2">
       <h3 className="font-semibold">Live preview</h3>
       <p className="text-xs text-muted-foreground">{sourceFile?.name}</p>
      </div>
      {files.length>1&&<div className="flex gap-2 overflow-x-auto pb-2">
       {files.map((f,i)=><button key={i} type="button" onClick={()=>setSelected(i)} title={f.name}
        className={"w-20 shrink-0 overflow-hidden rounded border-2 p-1 "+(selected===i?"border-primary":"border-border")}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={previewUrls[i]} className="h-14 w-full object-contain" alt={f.name}/>
        <span className="block truncate text-[10px]">{f.name}</span>
       </button>)}
      </div>}
      <div className="flex min-h-60 items-center justify-center overflow-auto rounded-xl p-3" style={{backgroundImage:"repeating-conic-gradient(#e7e7e7 0 25%,#fff 0 50%)",backgroundSize:"20px 20px"}}>
       <canvas ref={canvasRef} className="max-h-[440px] max-w-full rounded shadow-sm" aria-label="Processed image preview"/>
      </div>
      <div className="rounded-xl border border-border bg-card p-3 text-sm">
       <p><strong>Input:</strong> {sourceFile?.name} · {sourceFile?(sourceFile.size/1024).toFixed(1):"0"} KiB</p>
       {sourceDpi!==null?<p>Metadata resolution: <strong>{sourceDpi} DPI</strong> (JFIF/PNG)</p>:<p>Source DPI: not present or not readable in JFIF/PNG metadata</p>}
       <p className="text-xs text-muted-foreground">Preview and output may differ slightly due to JPEG compression. Check actual downloads.</p>
      </div>
     </>}
     {results.length>0&&<div className="space-y-3 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">{results.every(r=>r.passed)?<CheckCircle2 className="h-5 w-5 text-green-600"/>:<AlertTriangle className="h-5 w-5 text-amber-600"/>}
       <strong>{results.length} file(s) prepared</strong>
      </div>
      {results.map((r,i)=><div key={i} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-2">
       <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold">{r.name}</p>
        <p className="text-[11px] text-muted-foreground">{sizeLabel(r.blob.size)} · {r.w}×{r.h} {r.passed?"· target OK":"· target not met"}</p>
        {r.notice&&<p className="text-[11px] text-amber-700">{r.notice}</p>}
       </div>
       <Button size="sm" variant="outline" onClick={()=>downloadBlob(r.blob,r.name)}><Download className="mr-1 h-3.5 w-3.5"/>Save</Button>
      </div>)}
      {results.length>1&&<Button className="w-full" disabled={busy} onClick={()=>{void downloadAll();}}><Package className="mr-2 h-4 w-4"/>Download ZIP</Button>}
     </div>}
    </div>
   </div>
  </div>
  <div className="rounded-xl border border-border p-3 text-xs text-muted-foreground">
   <Info className="mr-1 inline h-4 w-4"/> No AI-generated objects, automatic face identification, guaranteed retouching or government approval.
   Browser support differs for AVIF decoding, canvas effects and WebP exports. Pixel or DPI changes alone cannot restore missing image detail.
  </div>
 </div>;
}
