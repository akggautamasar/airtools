"use client";
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Download, FileCheck2, FileImage, PenLine, Fingerprint, ScrollText, FileText, ShieldCheck, RotateCcw, Package, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadBlob, formatFileSize } from "@/lib/utils";
import type { Tool } from "@/types";
import {
 EXAM_UPLOAD_PRESETS,clampExamDimension,examOutputName,validateExamOutput,
 type ExamAssetKind,type ExamImageFormat,type ExamUploadPreset
} from "@/lib/exam-upload-specs";
import { loadExamImage,renderExamImage,sizeTargetExport,analyzeExamCanvas,canvasAsBlob,type ExamImageAnalysis } from "@/lib/exam-image-engine";

type KitFile = {kind:ExamAssetKind;name:string;blob:Blob;status:"pass"|"review"};
type Guide = {good:string[];bad:string[]};
const GUIDES:Record<ExamAssetKind,Guide>={
 photo:{good:["Recent unaltered, front-facing photograph","Full head, face and shoulders visible","Even lighting; plain backdrop if required","Original camera capture when live upload is required"],
 bad:["Blur, excessive shadow, sideways face","Hat, mask, dark glasses, blocked forehead","Beauty filters, AI face/background edits if prohibited","Cropped scalp or chin; other people visible"]},
 signature:{good:["Applicant's own running handwritten signature","Complete strokes with padding around edges","Ink color, paper and size match the notice","Readable after reduction to upload size"],
 bad:["Typed font or pasted/drawn imitation","BLOCK CAPITAL letters where prohibited","Truncated or overly faint strokes","Thumb impression or someone else's signature"]},
 thumb:{good:["Actual required LEFT or RIGHT thumb","Full impression with visible ridge details","Ink color and white paper as required","Not smudged; centered within canvas"],
 bad:["Wrong hand or finger","Cut-off impression or smeared ridges","Faint print, stains or printed image","Wrong background color"]},
 declaration:{good:["Exact words from the live application notice","Own handwriting with required case and ink","All lines visible and readable","Correct orientation and size"],
 bad:["Typed/generated text instead of handwriting","Incorrect wording or spelling","ALL CAPS where forbidden","Missing lines, smudges or crop"]},
 document:{good:["All corners visible; complete original document","Sharp and readable text/seal/date","Correct page orientation and file type","File size within the specific notice limit"],
 bad:["Cut-off certificate number or signatures","Blurred, overexposed or unreadable scan","Wrong certificate, expired or mismatched details","Composited or altered document content"]}
};
const iconFor:Record<ExamAssetKind,typeof FileImage>={photo:FileImage,signature:PenLine,thumb:Fingerprint,declaration:ScrollText,document:FileText};
const ALL_KINDS:ExamAssetKind[]=["photo","signature","thumb","declaration","document"];
function suggestedFor(kind:ExamAssetKind){
 return EXAM_UPLOAD_PRESETS.find(p=>p.kind===kind && p.agency!=="Custom") ||
 EXAM_UPLOAD_PRESETS.find(p=>p.kind===kind)!;
}
function asKiB(n:number){return (n/1024).toFixed(1)+" KiB";}
function numInput(label:string,value:number,min:number,max:number,onChange:(value:number)=>void,step=1){
 return <label className="block text-xs font-medium">{label}
  <input type="number" value={value} min={min} max={max} step={step}
    onChange={e=>onChange(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-2.5 text-sm"/>
 </label>;
}
function makePreview(src:HTMLCanvasElement,target:HTMLCanvasElement){
 const w=src.width,h=src.height,scale=Math.min(1,450/Math.max(w,h));
 target.width=Math.max(1,Math.round(w*scale));
 target.height=Math.max(1,Math.round(h*scale));
 target.getContext("2d")?.drawImage(src,0,0,target.width,target.height);
}
async function pdfFromImage(image:HTMLImageElement,maxKB:number):Promise<Blob>{
 const {PDFDocument}=await import("pdf-lib");
 const doc=await PDFDocument.create();
 const page=doc.addPage([595.28,841.89]); // A4 PDF points
 const ctxCanvas=document.createElement("canvas");
 const iw=image.naturalWidth,ih=image.naturalHeight;
 for(let pass=0;pass<9;pass++){
  const factor=Math.min(1,(1800-pass*155)/Math.max(iw,ih));
  ctxCanvas.width=Math.max(100,Math.round(iw*factor));
  ctxCanvas.height=Math.max(100,Math.round(ih*factor));
  ctxCanvas.getContext("2d")?.drawImage(image,0,0,ctxCanvas.width,ctxCanvas.height);
  const jpg=await canvasAsBlob(ctxCanvas,"jpeg",Math.max(.3,.88-pass*.072));
  if(pass===0 || pass===8 || jpg.size<maxKB*1024){
   const bytes=await jpg.arrayBuffer();
   const embedded=await doc.embedJpg(bytes);
   const availW=595.28-50,availH=841.89-50;
   const fit=Math.min(availW/embedded.width,availH/embedded.height);
   const w=embedded.width*fit,h=embedded.height*fit;
   page.drawImage(embedded,{x:(595.28-w)/2,y:(841.89-h)/2,width:w,height:h});
   const pdfBytes=await doc.save();
   const pdf=new Blob([new Uint8Array(pdfBytes)],{type:"application/pdf"});
   if(pdf.size<=maxKB*1024||pass===8)return pdf;
   // The previous image remains on the same PDF page; create fresh document next pass.
   page.node.delete?.("Contents" as never);
  }
 }
 throw Error("Could not build document PDF");
}
export default function ExamApplicationStudio({tool}:{tool:Tool}){
 const inferred:ExamAssetKind=tool.slug.includes("signature")?"signature":tool.slug.includes("thumb")?"thumb":tool.slug.includes("declaration")?"declaration":tool.slug.includes("document")?"document":"photo";
 const [kind,setKind]=useState<ExamAssetKind>(inferred);
 const [presetId,setPresetId]=useState(suggestedFor(inferred).id);
 const [source,setSource]=useState<{file:File;img:HTMLImageElement}|null>(null);
 const [spec,setSpec]=useState(()=>({width:suggestedFor(inferred).width,height:suggestedFor(inferred).height,
  minKB:suggestedFor(inferred).minKB,maxKB:suggestedFor(inferred).maxKB,format:suggestedFor(inferred).format as ExamImageFormat}));
 const [zoom,setZoom]=useState(1);
 const [x,setX]=useState(.5);
 const [y,setY]=useState(.5);
 const [inset,setInset]=useState(.12);
 const [clean,setClean]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [analysis,setAnalysis]=useState<ExamImageAnalysis|null>(null);
 const [output,setOutput]=useState<{name:string;blob:Blob;issues:string[]}|null>(null);
 const [kit,setKit]=useState<KitFile[]>([]);
 const [checks,setChecks]=useState([false,false,false,false]);
 const [sourceInfo,setSourceInfo]=useState("");
 const preview=useRef<HTMLCanvasElement>(null);
 const picker=useRef<HTMLInputElement>(null);
 const preset=EXAM_UPLOAD_PRESETS.find(p=>p.id===presetId)||suggestedFor(kind);
 const isDocument=kind==="document";
 const changeKind=(v:ExamAssetKind)=>{
  const p=suggestedFor(v);setKind(v);setPresetId(p.id);setSpec({width:p.width,height:p.height,minKB:p.minKB,maxKB:p.maxKB,format:p.format});
  setSource(null);setError("");setAnalysis(null);setOutput(null);setZoom(1);setX(.5);setY(.5);setChecks([false,false,false,false]);
  if(picker.current)picker.current.value="";
 };
 const choosePreset=(v:string)=>{
  const p=EXAM_UPLOAD_PRESETS.find(s=>s.id===v);
  if(!p)return;
  setPresetId(v);setSpec({width:p.width,height:p.height,minKB:p.minKB,maxKB:p.maxKB,format:p.format});
  setOutput(null);setChecks([false,false,false,false]);setError("");
 };
 const setField=<K extends keyof typeof spec>(key:K,value:(typeof spec)[K])=>{
  setSpec(s=>({...s,[key]:value}));setOutput(null);
 };
 const chooseFile=async(file?:File)=>{
  setError("");setOutput(null);setAnalysis(null);setSource(null);setChecks([false,false,false,false]);
  if(!file)return;
  setBusy(true);
  try{
   const img=await loadExamImage(file);setSource({file,img});
   setSourceInfo(img.naturalWidth+" × "+img.naturalHeight+" px · "+formatFileSize(file.size));
  }catch(e){setError(e instanceof Error?e.message:"Unable to read image");}
  finally{setBusy(false);}
 };
 useEffect(()=>{
  if(!source||!preview.current||!Number.isFinite(spec.width)||!Number.isFinite(spec.height)||spec.width<20||spec.height<20)return;
  try{
   const canvas=renderExamImage(source.img,{width:clampExamDimension(spec.width),height:clampExamDimension(spec.height),
    kind,zoom,x,y,paperCleanup:clean,inset});
   makePreview(canvas,preview.current);
   setAnalysis(analyzeExamCanvas(canvas,kind));
  }catch{ /* Invalid in-progress dimensions; export validation reports detail. */ }
 },[source,spec.width,spec.height,kind,zoom,x,y,clean,inset]);
 async function createOutput(){
  if(!source||busy)return;
  setError("");setBusy(true);
  try{
   if(!Number.isInteger(spec.width)||!Number.isInteger(spec.height)||spec.width<20||spec.height<20||spec.width>4000||spec.height>4000)
     throw Error("Pixel dimensions must be whole numbers between 20 and 4000");
   if(!Number.isFinite(spec.minKB)||!Number.isFinite(spec.maxKB)||spec.minKB<0||spec.maxKB<1||spec.minKB>spec.maxKB||spec.maxKB>3000)
     throw Error("Enter a valid minimum and maximum file size (up to 3000 KiB)");
   if(isDocument){
     const pdf=await pdfFromImage(source.img,spec.maxKB);
     const issues=pdf.size>spec.maxKB*1024?["PDF exceeds maximum KB; try clearer smaller scan"]:[];
     const out={name:"airtools-exam-document.pdf",blob:pdf,issues};
     setOutput(out);setKit(k=>[...k.filter(i=>i.kind!=="document"),{kind,name:out.name,blob:pdf,status:issues.length?"review":"pass"}]);
   }else{
     const canvas=renderExamImage(source.img,{width:spec.width,height:spec.height,kind,zoom,x,y,paperCleanup:clean,inset});
     const result=await sizeTargetExport(canvas,spec.format,spec.minKB,spec.maxKB);
     const outcome=validateExamOutput(result.blob.size,canvas.width,canvas.height,spec,"image/"+spec.format);
     const name=examOutputName(kind,spec.format);
     const out={name,blob:result.blob,issues:outcome.issues};
     setOutput(out);setAnalysis(analyzeExamCanvas(canvas,kind));
     setKit(k=>[...k.filter(i=>i.kind!==kind),{kind,name,blob:result.blob,status:outcome.passed?"pass":"review"}]);
   }
  }catch(e){setError(e instanceof Error?e.message:"Image conversion failed");}
  finally{setBusy(false);}
 }
 async function exportKit(){
  if(!kit.length)return;setBusy(true);setError("");
  try{
   const JSZip=(await import("jszip")).default,zip=new JSZip();
   for(const item of kit)zip.file(item.name,item.blob);
   zip.file("README.txt","EXAM FORM UPLOAD KIT\n\nAlways compare every saved file with your CURRENT recruitment notification and portal.\nThese are formatted candidate uploads, NOT government-certified or guaranteed accepted.\nNever submit a photo replacement for a compulsory live camera capture.\nPhotos, handwriting, signatures and impressions must be genuine.\n");
   downloadBlob(await zip.generateAsync({type:"blob"}),"airtools-exam-upload-kit.zip");
  }catch(e){setError(e instanceof Error?e.message:"Could not create ZIP");}
  finally{setBusy(false);}
 }
 const guide=GUIDES[kind];
 return <div className="space-y-5">
  <section className="rounded-2xl border border-border p-5 space-y-2">
   <h2 className="text-xl font-bold">Exam Application Upload Studio</h2>
   <p className="text-sm text-muted-foreground">Prepare original photographs, signatures, thumb impressions, handwritten declarations and scanned documents for recruitment forms. Pixel dimensions, KiB targets, JPEG/PNG/WebP conversion, crop, paper cleanup and ZIP kit — all processed on your device.</p>
   <p className="text-xs text-amber-700 dark:text-amber-400"><AlertTriangle className="inline h-4 w-4 mr-1"/>Specifications depend on each exam notice. Passing file-size and pixel checks does not guarantee portal acceptance, facial authenticity, ink compliance or biometric validity. Never digitally replace a compulsory live photo.</p>
  </section>
  <nav className="grid grid-cols-2 gap-2 sm:grid-cols-5" aria-label="Application file type">
   {ALL_KINDS.map(k=>{const Icon=iconFor[k];return <button type="button" key={k} aria-pressed={kind===k} onClick={()=>changeKind(k)}
     className={"rounded-xl border-2 p-3 text-center text-xs font-semibold capitalize "+(kind===k?"border-primary bg-primary/10":"border-border hover:border-primary/50")}>
     <Icon className="mx-auto mb-1 h-5 w-5"/>{k==="document"?"Document to PDF":k}
    </button>;})}
  </nav>
  <section className="space-y-3 rounded-2xl border border-border p-4">
   <h3 className="font-semibold">1. Choose exam-specific example or enter your notice</h3>
   <select aria-label="Recruitment portal template" value={presetId} onChange={e=>choosePreset(e.target.value)}
     className="w-full rounded-lg border border-border bg-background p-3 text-sm">
    {EXAM_UPLOAD_PRESETS.filter(p=>p.kind===kind).map(p=><option key={p.id} value={p.id}>{p.label}</option>)}
   </select>
   <div className="text-xs text-muted-foreground space-y-2">
    <p>{preset.dimensionNote}</p>
    {preset.source&&<a className="font-medium underline text-primary" href={preset.source} target="_blank" rel="noopener noreferrer">View source notice — {preset.sourceLabel} ↗</a>}
    <ul className="list-disc pl-5">{preset.requirement.map(r=><li key={r}>{r}</li>)}</ul>
   </div>
   <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
    {numInput("Width (px)",spec.width,20,4000,v=>setField("width",clampExamDimension(v)))}
    {numInput("Height (px)",spec.height,20,4000,v=>setField("height",clampExamDimension(v)))}
    {numInput("Min KiB",spec.minKB,0,3000,v=>setField("minKB",Math.max(0,Math.min(3000,Number.isFinite(v)?v:0))))}
    {numInput("Max KiB",spec.maxKB,1,3000,v=>setField("maxKB",Math.max(1,Math.min(3000,Number.isFinite(v)?v:1))))}
    <label className="text-xs font-medium">Output format
     <select value={spec.format} disabled={isDocument} onChange={e=>setField("format",e.target.value as ExamImageFormat)} className="mt-1 w-full rounded-lg border border-border bg-background p-2.5 text-sm">
      <option value="jpeg">JPG/JPEG</option><option value="png">PNG</option><option value="webp">WebP</option>
     </select>
    </label>
   </div>
   {isDocument&&<p className="text-xs text-muted-foreground">Scanned image → A4 PDF; uses a JPEG scan inside PDF, respecting maximum size when feasible. It cannot create or validate legal certificates. For original PDF compression use the separate Compress PDF tool.</p>}
  </section>
  <div className="grid gap-5 lg:grid-cols-2">
   <section className="space-y-3 rounded-2xl border border-border p-4">
    <h3 className="font-semibold">2. Upload and frame</h3>
    <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border px-3 py-7 text-center hover:border-primary">
     <FileImage className="h-7 w-7 text-primary"/>
     <span className="text-sm font-medium">Choose a {kind} image</span>
     <span className="text-xs text-muted-foreground">JPEG, PNG or WebP · max 15 MiB, 28 megapixels · no server upload</span>
     <input ref={picker} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={e=>{void chooseFile(e.target.files?.[0]);}}/>
    </label>
    {source&&<>
      <p className="text-xs text-muted-foreground">{source.file.name} · {sourceInfo}</p>
      <div className="flex min-h-40 justify-center rounded-xl border border-border p-3" style={{backgroundImage:"repeating-conic-gradient(#e5e7eb 0 25%, #fff 0 50%)",backgroundSize:"18px 18px"}}>
       <canvas ref={preview} aria-label={"Preview of "+kind} className="max-h-[380px] max-w-full object-contain rounded shadow"/>
      </div>
      <div className="grid grid-cols-2 gap-3">
       {([
        ["Zoom",zoom,1,kind==="photo"?4:2,setZoom],
        ["Horizontal position",x,0,1,setX],
        ["Vertical position",y,0,1,setY],
        ["Padding for writing",inset,0,.35,setInset]
       ] as const).filter(r=>kind!=="photo"||r[0]!=="Padding for writing").map(([label,val,min,max,set])=>
        <label key={label} className="text-xs">{label}: {Number(val).toFixed(2)}
         <input type="range" min={min} max={max} step=".02" value={val} onChange={e=>{set(Number(e.target.value));setOutput(null);}} className="block w-full accent-primary"/>
        </label>
       )}
      </div>
      {kind!=="photo"&&<label className="flex items-start gap-2 text-xs"><input type="checkbox" checked={clean} onChange={e=>{setClean(e.target.checked);setOutput(null);}}/>
        Gently whiten nearly-white scanner paper (optional; manually check the ink and do not alter original evidence)
       </label>}
      <Button variant="outline" size="sm" onClick={()=>{setZoom(1);setX(.5);setY(.5);setInset(.12);setClean(false);setOutput(null);}}>
       <RotateCcw className="mr-1 h-4 w-4"/>Reset framing
      </Button>
     </>}
   </section>
   <section className="space-y-4 rounded-2xl border border-border p-4">
    <h3 className="font-semibold">3. Accepted vs. rejected — visual review</h3>
    <div className="grid grid-cols-2 gap-3">
     <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-green-950 dark:border-green-900 dark:bg-green-950/20 dark:text-green-300">
      <div className="mb-2 flex items-center gap-1 text-sm font-semibold"><CheckCircle2 className="h-4 w-4"/>Usually acceptable*</div>
      <ul className="space-y-2 text-xs">{guide.good.map(g=><li key={g}>✓ {g}</li>)}</ul>
     </div>
     <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-950 dark:border-red-900 dark:bg-red-950/20 dark:text-red-300">
      <div className="mb-2 flex items-center gap-1 text-sm font-semibold"><XCircle className="h-4 w-4"/>Common rejection risks</div>
      <ul className="space-y-2 text-xs">{guide.bad.map(g=><li key={g}>✕ {g}</li>)}</ul>
     </div>
    </div>
    <p className="text-xs text-muted-foreground">*Examples are guidance, not official sample photographs. Inspect the actual recruitment notice; visual issues are not certified by this tool.</p>
    {analysis&&<div className="space-y-2 rounded-lg bg-muted/50 p-3 text-xs">
      <p className="font-semibold">Local quality signals (heuristics, not AI biometric checks)</p>
      <p>Average brightness {analysis.brightness}/255 · Contrast {analysis.contrast} · Dark pixels {(analysis.inkFraction*100).toFixed(1)}%</p>
      <ul className="space-y-1">{analysis.flags.map(x=><li key={x}>• {x}</li>)}</ul>
    </div>}
    <div className="space-y-2">
     {["I checked the CURRENT portal notification","This is my own genuine source photo / ink impression","I visually checked full framing, wording and legibility","I confirmed the exact required KB, pixels and file format"].map((label,i)=>
      <label key={label} className="flex items-start gap-2 text-xs"><input type="checkbox" checked={checks[i]} onChange={e=>setChecks(old=>old.map((v,j)=>j===i?e.target.checked:v))} className="mt-0.5"/>{label}</label>
     )}
     <p className="text-xs text-muted-foreground">{checks.filter(Boolean).length}/4 manual pre-upload checks acknowledged</p>
    </div>
   </section>
  </div>
  <section className="rounded-2xl border border-border p-4 space-y-3">
   <h3 className="font-semibold">4. Generate and validate your file</h3>
   <p className="text-xs text-muted-foreground">The editor searches JPEG/WebP compression qualities for the chosen KiB range. Very simple scans can remain smaller than the minimum even at maximum quality; highly detailed files may exceed the maximum. It never falsely marks them as passing.</p>
   {error&&<p role="alert" className="rounded-lg border border-red-300 p-3 text-sm text-red-600">{error}</p>}
   <Button size="lg" variant="gradient" className="w-full" disabled={!source||busy} onClick={()=>{void createOutput();}}>
    <FileCheck2 className="mr-2 h-4 w-4"/>{busy?"Preparing file…":"Generate upload-ready "+(isDocument?"PDF":kind)}
   </Button>
   {output&&<div className="space-y-3 rounded-xl border border-border p-4">
     <div className="flex items-center gap-2">
      {output.issues.length===0?<CheckCircle2 className="h-5 w-5 text-green-600"/>:<AlertTriangle className="h-5 w-5 text-amber-600"/>}
      <div><p className="font-semibold text-sm">{output.issues.length?"Review required: technical checks failed":"File format, pixels and size checks passed"}</p>
       <p className="text-xs text-muted-foreground">{output.name} · {asKiB(output.blob.size)} · {isDocument?"A4 PDF":spec.width+" × "+spec.height+" px"}</p></div>
     </div>
     {output.issues.map(issue=><p key={issue} className="text-xs text-amber-700">• {issue}</p>)}
     <p className="text-xs text-muted-foreground">Technical checks only: a real examination portal can still reject unsuitable photo content, fake signatures, blurred text or a different notice specification.</p>
     <Button className="w-full" onClick={()=>downloadBlob(output.blob,output.name)}><Download className="mr-2 h-4 w-4"/>Download {output.name}</Button>
    </div>}
  </section>
  {kit.length>0&&<section className="space-y-3 rounded-2xl border border-border p-4">
   <h3 className="flex items-center gap-2 font-semibold"><Package className="h-4 w-4"/>Application form upload kit ({kit.length}/5)</h3>
   <p className="text-xs text-muted-foreground">Prepare different file types using tabs above. Your prepared images remain in this tab and can be downloaded together.</p>
   <div className="grid gap-2 sm:grid-cols-2">{kit.map(it=><div key={it.kind} className="flex items-center justify-between rounded-lg bg-muted/40 p-2 text-xs">
    <span>{it.name} · {asKiB(it.blob.size)}</span><span className={it.status==="pass"?"text-green-600":"text-amber-600"}>{it.status==="pass"?"Size OK":"Review"}</span>
   </div>)}</div>
   <Button variant="outline" disabled={busy} className="w-full" onClick={()=>{void exportKit();}}><Download className="mr-2 h-4 w-4"/>Download all as ZIP</Button>
  </section>}
  <p className="text-xs text-muted-foreground flex items-start gap-1"><ShieldCheck className="h-4 w-4 shrink-0"/>No login, payment, server storage or external image processor. Data stays in your browser; source files and prepared assets disappear when the tab closes. Exam authorities may change file rules without notice.</p>
 </div>;
}
