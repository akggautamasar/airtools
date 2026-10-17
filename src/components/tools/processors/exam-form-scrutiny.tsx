"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, CircleHelp, Download, FileSearch, Loader2, ShieldCheck, UploadCloud, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadBlob, formatFileSize } from "@/lib/utils";
import { loadPdfJs } from "@/lib/pdf-client";
import type { Tool } from "@/types";
import {
  DOC_KINDS, SCRUTINY_FIELDS, blankScrutinyValues, classifyScrutinyDocument,
  compareScrutiny, safeValue, scrutinySummary, suggestScrutinyValues,
  type DocKind, type ScrutinyRecord, type ScrutinyResult,
} from "@/lib/exam-form-scrutiny";

const MAX_RECORDS=12;
const MAX_FILE=12*1024*1024;
const MAX_PAGES=15;
const MAX_TEXT=100000;
const inputStyle="w-full min-w-0 rounded-lg border border-border bg-background px-2.5 py-2 text-sm";
type BrowserRecord=ScrutinyRecord&{ filename:string; file?:File; note:string; busy:boolean };
const checklist=[
 "The form is still on the PREVIEW screen; final submission has NOT been clicked.",
 "I checked all spelling, date, gender and category entries against originals.",
 "I checked post preferences, exam centre, language and reservation choices against the notification.",
 "I checked eligibility and all cut-off dates from the CURRENT official notice.",
 "I checked photo/signature quality, file uploads, declarations and fee/payment requirements.",
];
const statusStyles={
 match:"border-green-300/60 bg-green-50/70 text-green-800 dark:bg-green-950/25 dark:text-green-200",
 mismatch:"border-red-300/70 bg-red-50/70 text-red-800 dark:bg-red-950/25 dark:text-red-200",
 review:"border-amber-300/70 bg-amber-50/70 text-amber-900 dark:bg-amber-950/25 dark:text-amber-200",
 unchecked:"border-border bg-muted/30 text-muted-foreground",
};
const statusLabel={match:"Matched",mismatch:"Mismatch",review:"Review required",unchecked:"Not checked"};
function createRecord(kind:DocKind|"form",file:File):BrowserRecord{
  return {id:crypto.randomUUID(),kind,label:kind==="form"?"Application preview":DOC_KINDS.find(x=>x.id===kind)?.label||"Record",
    values:blankScrutinyValues(),confirmed:false,filename:file.name,file,note:"Reading locally…",busy:true,extracted:false};
}
function safeHtmlToLines(source:string):string{
  // Remove executable/remote-resource tags BEFORE parsing. Never append uploaded HTML to the page.
  const clean=source
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi,"")
    .replace(/<(?:style|head|iframe|object|embed|link|img|audio|video|svg|meta|base)\b[^>]*>[\s\S]*?<\/(?:style|head|iframe|object|embed|link|img|audio|video|svg|meta|base)\s*>/gi,"")
    .replace(/<(?:iframe|object|embed|link|img|audio|video|svg|meta|base)\b[^>]*\/?>/gi,"");
  const doc=new DOMParser().parseFromString(clean,"text/html");
  doc.querySelectorAll("script,style,iframe,object,embed,link,img,audio,video,svg,meta,base").forEach(el=>el.remove());
  // Preserve input name/value pairs in saved single-page HTML.
  const pairs:string[]=[];
  doc.querySelectorAll("input,select,textarea").forEach(el=>{
    if(pairs.length>200) return;
    const input=el as HTMLInputElement;
    if(input instanceof HTMLInputElement && ["password","hidden","file"].includes(input.type))return;
    const label=el.id?doc.querySelector(`label[for="${CSS.escape(el.id)}"]`)?.textContent||"":""; // only inspected within inert document
    const title=(label||el.getAttribute("aria-label")||el.getAttribute("name")||el.id||"").trim().slice(0,120);
    let value="";
    if(el instanceof HTMLInputElement)value=el.value||el.getAttribute("value")||"";
    else if(el instanceof HTMLTextAreaElement)value=el.value||el.textContent||"";
    else if(el instanceof HTMLSelectElement)value=el.selectedOptions?.[0]?.text||el.value||"";
    if(title && value && title.length<120 && value.length<150)pairs.push(title+": "+value);
  });
  const text=doc.body?.innerText||doc.body?.textContent||"";
  // Saved HTML with scripts populating the form at runtime may contain NO filled values.
  const lines=text.replace(/\r/g,"").replace(/\t/g," ").replace(/[ ]{3,}/g,"  ");
  return [...pairs,lines].join("\n").slice(0,MAX_TEXT);
}
async function selectablePdf(file:File):Promise<{text:string;note:string}>{
  const pdfjs=await loadPdfJs();
  const task=pdfjs.getDocument({data:await file.arrayBuffer()});
  let pdf:Awaited<typeof task.promise>|null=null;
  try{
    pdf=await task.promise;
    const count=Math.min(pdf.numPages,MAX_PAGES),lines:string[]=[];
    for(let pageNum=1;pageNum<=count;pageNum++){
      const page=await pdf.getPage(pageNum);
      const t=await page.getTextContent();
      let lastY:number|null=null,row="";
      for(const item of t.items){
        if(!("str" in item))continue;
        const y=item.transform?.[5]??0;
        if(lastY!==null&&Math.abs(y-lastY)>2){if(row)lines.push(row);row="";}
        row+=(row?" ":"")+item.str;
        lastY=y;
      }
      if(row)lines.push(row);
      page.cleanup();
    }
    return {text:lines.join("\n").slice(0,MAX_TEXT),
      note:pdf.numPages>MAX_PAGES?`Only first ${MAX_PAGES} of ${pdf.numPages} pages were read. Unread pages are NOT checked.`:
        "Read selectable PDF text; scanned/image-only pages require optional OCR or manual entry."};
  }finally{await task.destroy();}
}
async function extract(file:File):Promise<{text:string;note:string}>{
  if(file.size>MAX_FILE||file.size===0)throw Error("Each file must be 1 byte–12 MiB.");
  if(/\.pdf$/i.test(file.name)||file.type==="application/pdf")return selectablePdf(file);
  if(/\.(htm|html)$/i.test(file.name))return {
    text:safeHtmlToLines((await file.text()).slice(0,MAX_TEXT*3)),
    note:"Read saved HTML as inert local text. JavaScript-filled values may be absent; compare against the visible original preview."};
  if(/\.txt$/i.test(file.name))return {
    text:(await file.text()).slice(0,MAX_TEXT),note:"Read plain text locally."};
  if(/\.docx$/i.test(file.name)){
    const mammoth=await import("mammoth");
    const result=await mammoth.extractRawText({arrayBuffer:await file.arrayBuffer()});
    return {text:result.value.slice(0,MAX_TEXT),note:"Read DOCX text locally. Layout is not preserved."};
  }
  if(/\.(jpe?g|png|webp)$/i.test(file.name))return {
    text:"",note:"Image loaded. Select Read image (OCR) to attempt on-device English OCR, or type fields manually."};
  throw Error("Supported formats: PDF, saved HTML/HTM, TXT, DOCX, JPG, PNG, WebP.");
}
async function localOcr(file:File):Promise<string>{
  const {createWorker}=await import("tesseract.js");
  const worker=await createWorker("eng");
  try{
    if(/\.pdf$/i.test(file.name)||file.type==="application/pdf"){
      const pdfjs=await loadPdfJs();
      const task=pdfjs.getDocument({data:await file.arrayBuffer()});
      let pdf:Awaited<typeof task.promise>|null=null;
      try{
        pdf=await task.promise;
        const texts:string[]=[];
        for(let i=1;i<=Math.min(pdf.numPages,3);i++){
          const page=await pdf.getPage(i);
          const factor=Math.min(1.7,1300/Math.max(page.getViewport({scale:1}).width,page.getViewport({scale:1}).height));
          const viewport=page.getViewport({scale:factor});
          const canvas=document.createElement("canvas");
          canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
          const ctx=canvas.getContext("2d");if(!ctx)throw Error("Canvas unavailable");
          await page.render({canvas,canvasContext:ctx,viewport}).promise;
          const result=await worker.recognize(canvas);
          texts.push(result.data.text);
          page.cleanup();
        }
        return texts.join("\n").slice(0,MAX_TEXT);
      }finally{await task.destroy();}
    }
    const result=await worker.recognize(file);
    return result.data.text.slice(0,MAX_TEXT);
  }finally{await worker.terminate();}
}
function displayValue(key:string,value:string,redact:boolean):string {
  if(key==="aadhaarLast4")return safeValue(key,value)||"Not entered";
  return !value.trim()?"Not entered":redact?"[hidden]":value;
}
function humanReport(results:ScrutinyResult[],summary:ReturnType<typeof scrutinySummary>,fileNames:string[],redact:boolean,ticks:boolean[]):string{
  return [
    "AIRTOOLS — PRE-SUBMISSION EXAM FORM SCRUTINY REPORT",
    "For personal review only. Not government validation, legal eligibility assessment, or approval.",
    "Do NOT treat 'Matched' as a guarantee that any uploaded certificate is authentic or accepted.",
    `Checked fields: ${results.length}; Matched: ${summary.matches}; Mismatch: ${summary.mismatches}; Review: ${summary.review}; Not checked: ${summary.unchecked}`,
    "Records: "+fileNames.length+" (names omitted for privacy)",
    "",
    "CHECKS",
    ...results.map(r=>[
      `${statusLabel[r.status].toUpperCase()}: ${r.label}`,
      `  Application: ${displayValue(r.key,r.submitted,redact)}`,
      `  Evidence: ${displayValue(r.key,r.evidence,redact)}`,
      `  Sources: ${redact?r.sources.length+" record(s)":r.sources.join(", ")||"None"}`,
      `  Note: ${r.explanation}`,
    ].join("\n")),
    "MANUAL PRE-SUBMIT CHECKLIST",
    ...checklist.map((q,i)=>`${ticks[i]?"[DONE]":"[NOT CONFIRMED]"} ${q}`),
    "",
    "Review the official notification and original application before final submission.",
    "Fields without matching evidence remain NOT CHECKED. Do not infer eligibility from this report.",
  ].join("\n\n");
}

export default function ExamFormScrutiny({tool}:{tool:Tool}){
  const [form,setForm]=useState<BrowserRecord|null>(null);
  const [documents,setDocuments]=useState<BrowserRecord[]>([]);
  const [error,setError]=useState("");
  const [checklistDone,setChecklistDone]=useState<boolean[]>(Array(checklist.length).fill(false));
  const [showDetails,setShowDetails]=useState(false);
  const [includeSensitive,setIncludeSensitive]=useState(false);
  const [results,setResults]=useState<ScrutinyResult[]|null>(null);
  const [processing,setProcessing]=useState(false);
  const formExists=Boolean(form);
  const pending=(form?.busy||documents.some(x=>x.busy))??false;
  const docs=useMemo(()=>documents,[documents]);
  const totals=results?scrutinySummary(results):null;
  function updateRecord(id:string,update:Partial<BrowserRecord>){
    setResults(null);
    setForm(old=>old?.id===id?{...old,...update}:old);
    setDocuments(old=>old.map(d=>d.id===id?{...d,...update}:d));
  }
  function changeField(record:BrowserRecord,key:string,value:string){
    const next={...record.values,[key]:key==="aadhaarLast4"?safeValue(key,value):value.slice(0,130)};
    updateRecord(record.id,{values:next,confirmed:false});
  }
  async function process(record:BrowserRecord){
    try{
      const result=await extract(record.file!);
      const suggested=suggestScrutinyValues(result.text);
      updateRecord(record.id,{values:suggested,confirmed:false,extracted:!!result.text,note:result.note,busy:false});
    }catch(err){
      updateRecord(record.id,{note:(err instanceof Error?err.message:"Text extraction failed")+" Enter values manually.",busy:false,confirmed:false});
    }
  }
  async function addForm(files:FileList|null){
    const file=files?.[0];if(!file)return;
    if(!/\.(pdf|html?|txt|docx|jpe?g|png|webp)$/i.test(file.name)||file.size>MAX_FILE||file.size===0){
      setError("Choose a PDF, saved HTML/HTM, TXT, DOCX or image up to 12 MiB.");return;
    }
    setError("");setResults(null);
    const record=createRecord("form",file);
    setForm(record);
    await process(record);
  }
  async function addDocuments(fileList:FileList|null){
    const files=Array.from(fileList||[]);
    if(!files.length)return;
    const capacity=MAX_RECORDS-docs.length;
    if(capacity<=0){setError("Maximum 12 supporting records. Remove one to add another.");return;}
    const selected=files.slice(0,capacity).filter(f=>f.size>0&&f.size<=MAX_FILE&&/\.(pdf|docx|txt|jpe?g|png|webp)$/i.test(f.name));
    setError(selected.length!==files.length?"Some files were skipped (12-record or 12-MiB limit; unsupported file).":"");
    const added=selected.map(file=>createRecord(classifyScrutinyDocument(file.name),file));
    setDocuments(old=>[...old,...added]);setResults(null);
    await Promise.all(added.map(process));
  }
  async function runOcr(record:BrowserRecord){
    if(!record.file||record.busy)return;
    updateRecord(record.id,{busy:true,note:"OCR running on this device…"});
    try{
      const text=await localOcr(record.file);
      const fields=suggestScrutinyValues(text);
      updateRecord(record.id,{values:{...record.values,...Object.fromEntries(Object.entries(fields).filter(([,v])=>v))},
        busy:false,confirmed:false,extracted:!!text,
        note:"English OCR completed locally. OCR may be inaccurate; confirm the original image. PDF OCR reads only the first 3 pages."});
    }catch{
      updateRecord(record.id,{busy:false,confirmed:false,note:"OCR unavailable or failed. Enter values manually. OCR language files can be downloaded by the library."});
    }
  }
  function runComparison(){
    if(!form || pending){setError("Upload and finish reading your application first.");return;}
    if(!form.confirmed){setError("Review and confirm the application values first.");return;}
    setError("");
    setResults(compareScrutiny(form,docs));
  }
  function reset(){
    setForm(null);setDocuments([]);setResults(null);setError("");
    setChecklistDone(Array(checklist.length).fill(false));setIncludeSensitive(false);
  }
  function downloadReport(kind:"txt"|"json"){
    if(!results||!totals)return;
    const redacted=!includeSensitive;
    const report=humanReport(results,totals,docs.map(d=>d.filename),redacted,checklistDone);
    const body=kind==="txt"?report:JSON.stringify({
      tool:"AirTools Pre-Submission Exam Form Scrutiny",version:1,notice:"Heuristic cross-document review, not official verification",
      counts:totals,checks:results.map(r=>({
        key:r.key,label:r.label,status:r.status,application:displayValue(r.key,r.submitted,redacted),
        evidence:displayValue(r.key,r.evidence,redacted),sources:redacted?r.sources.map((_,i)=>"Record "+(i+1)):r.sources,explanation:r.explanation,
      })),checklist:checklist.map((description,i)=>({description,confirmed:checklistDone[i]})),
    },null,2);
    downloadBlob(new Blob([body],{type:kind==="txt"?"text/plain;charset=utf-8":"application/json"}),`AirTools-Form-Scrutiny-${redacted?"redacted":"details"}.${kind}`);
  }
  function renderFieldEditor(record:BrowserRecord){
    return <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Only labelled fields are suggested. Check every suggestion against the actual record; edit values as needed.
       Blank fields are never treated as matches.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {SCRUTINY_FIELDS.map(field=><label key={field.key} className="min-w-0 text-xs">
          <span className="mb-1 block font-medium">{field.label}</span>
          <input className={inputStyle} type="text" value={record.values[field.key]||""} autoComplete="off"
            placeholder={field.type==="date"?"DD/MM/YYYY or YYYY-MM-DD":field.key==="aadhaarLast4"?"Only last 4 digits": "Not found — enter if present"}
            onChange={e=>changeField(record,field.key,e.target.value)}/>
        </label>)}
      </div>
      <label className="flex items-start gap-2 rounded-xl border border-border bg-muted/30 p-3 text-sm">
        <input type="checkbox" checked={record.confirmed} disabled={record.busy} className="mt-1"
          onChange={e=>updateRecord(record.id,{confirmed:e.target.checked})}/>
        I manually checked these extracted or entered values against the {record.kind==="form"?"visible application preview":"original supporting certificate"}.
        Unread fields are intentionally blank.
      </label>
    </div>;
  }
  return <div className="space-y-6">
    <header className="space-y-3 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2"><FileSearch className="h-6 w-6 text-primary"/><h2 className="text-xl font-bold">{tool.name}</h2></div>
      <p className="text-sm text-muted-foreground">Before clicking Final Submit, save or print the application preview to PDF (or save the browser page as HTML). Upload that preview and supporting certificates, confirm extracted details, then compare them. No government login or portal access required.</p>
      <div className="rounded-xl border border-amber-300/60 bg-amber-50/50 p-3 text-sm text-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
        <AlertTriangle className="mr-2 inline h-4 w-4"/>
        <strong>Personal accuracy assistant, not an official checker.</strong> It cannot certify identity, eligibility, certificate validity, document authenticity or government acceptance. Saved HTML may omit dynamic values; always compare with the actual preview. Never upload login credentials, OTPs or a complete Aadhaar number.
      </div>
      <p className="text-xs text-muted-foreground"><ShieldCheck className="mr-1 inline h-4 w-4"/>Files stay inside this browser session. The application does not send them to AirTools servers. OCR is optional and may download English recognition assets. Use a <a href="https://uidai.gov.in/en/my-aadhaar" className="underline" target="_blank" rel="noopener noreferrer">masked Aadhaar</a> if it is relevant to your chosen form.</p>
      <Button variant="outline" size="sm" onClick={reset}>Clear all records and report</Button>
    </header>
    <section className="space-y-3 rounded-2xl border border-border bg-card p-4 sm:p-5">
      <h3 className="font-semibold">1. Upload the application PREVIEW (before final submission)</h3>
      <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border p-4 text-sm hover:bg-muted/40">
        <UploadCloud className="h-5 w-5"/><span>{form?"Replace application preview":"Select preview PDF, saved HTML, text or screenshot"}</span>
        <input type="file" className="sr-only" accept=".pdf,.html,.htm,.txt,.docx,.jpg,.jpeg,.png,.webp"
          onChange={e=>{void addForm(e.target.files);e.target.value="";}}/>
      </label>
      <p className="text-xs text-muted-foreground">In the application portal, use Print → Save as PDF, or Save Page As → HTML. A PDF containing selectable text is best. This tool never submits the form.</p>
      {form&&<div className="space-y-3 rounded-xl border border-border p-3">
        <p className="break-all text-xs font-semibold">{form.filename} · {formatFileSize(form.file?.size||0)}</p>
        <p className="text-xs text-muted-foreground">{form.note}</p>
        {form.busy?<span className="flex items-center gap-1 text-xs"><Loader2 className="h-4 w-4 animate-spin"/>Reading…</span>:
          <Button size="sm" variant="outline" onClick={()=>{void runOcr(form);}}>Read preview via OCR (optional for scanned PDF/image)</Button>}
        {!form.busy&&{renderFieldEditor(form)}}
      </div>}
    </section>
    <section className="space-y-3 rounded-2xl border border-border bg-card p-4 sm:p-5">
      <h3 className="font-semibold">2. Upload supporting documents (up to {MAX_RECORDS})</h3>
      <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border p-4 text-sm hover:bg-muted/40">
        <UploadCloud className="h-5 w-5"/><span>Add Class 10, Class 12, Aadhaar, caste, diploma or other certificates</span>
        <input type="file" multiple className="sr-only" accept=".pdf,.docx,.txt,.jpg,.jpeg,.png,.webp"
          onChange={e=>{void addDocuments(e.target.files);e.target.value="";}}/>
      </label>
      <p className="text-xs text-muted-foreground">File names are used only to guess document type; correct the type below. Each field is checked only against relevant, confirmed documents. Missing documents yield <strong>Not checked</strong>, never a false green result.</p>
      {docs.map((doc,i)=><details key={doc.id} className="rounded-xl border border-border p-3" open={docs.length===1&&i===0}>
        <summary className="cursor-pointer text-sm font-semibold">{doc.confirmed?"✓ ":""}{doc.filename} {doc.busy?" · Reading…":""}</summary>
        <div className="mt-3 space-y-3">
          <label className="block text-xs font-medium">Document type
            <select className={inputStyle} value={doc.kind} onChange={e=>updateRecord(doc.id,{kind:e.target.value as DocKind,confirmed:false,label:DOC_KINDS.find(k=>k.id===e.target.value)?.label||"Supporting document"})}>
              {DOC_KINDS.map(k=><option key={k.id} value={k.id}>{k.label}</option>)}
            </select>
          </label>
          <p className="text-xs text-muted-foreground">{doc.note}</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" disabled={doc.busy} onClick={()=>{void runOcr(doc);}}>Read image/PDF via OCR</Button>
            <Button size="sm" variant="outline" onClick={()=>{setDocuments(old=>old.filter(x=>x.id!==doc.id));setResults(null);}}>Remove record</Button>
          </div>
          {!doc.busy&&{renderFieldEditor(doc)}}
        </div>
      </details>)}
      {!docs.length&&<p className="text-xs text-muted-foreground">No certificates uploaded. All document-based checks will be reported as Not checked.</p>}
    </section>
    <section className="space-y-3 rounded-2xl border border-border bg-card p-4 sm:p-5">
      <h3 className="font-semibold">3. Compare and scrutinize the application</h3>
      <p className="text-sm text-muted-foreground">Green means a confirmed field agrees with a confirmed supporting record. Red means different entries. Amber means ambiguity or conflicting supporting records. Gray means no reliable check was possible.</p>
      {error&&<p role="alert" className="rounded-xl border border-red-300 p-3 text-sm text-red-700 dark:text-red-300">{error}</p>}
      <Button className="w-full" disabled={!formExists||pending||processing||!form?.confirmed} onClick={()=>{setProcessing(true);try{runComparison();}finally{setProcessing(false);}}}>
        <FileSearch className="mr-2 h-4 w-4"/>{processing?"Comparing…":"Scrutinize Form"}
      </Button>
      {!form?.confirmed&&<p className="text-xs text-amber-700 dark:text-amber-300">Upload and manually confirm the application fields to enable scrutiny.</p>}
      {totals&&<div className="space-y-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {([
            {name:"Matched",value:totals.matches,key:"match"},
            {name:"Mismatch",value:totals.mismatches,key:"mismatch"},
            {name:"Review required",value:totals.review,key:"review"},
            {name:"Not checked",value:totals.unchecked,key:"unchecked"},
          ] as const).map(t=><div key={t.key} className={"rounded-xl border p-3 text-center "+statusStyles[t.key]}>
            <p className="text-2xl font-bold tabular-nums">{t.value}</p><p className="text-xs font-semibold">{t.name}</p>
          </div>)}
        </div>
        <div className="space-y-2">
          {results?.map(r=><details key={r.key} open={r.status==="mismatch"||r.status==="review"}
            className={"rounded-xl border px-3 py-2 "+statusStyles[r.status]}>
            <summary className="cursor-pointer text-sm font-semibold">
              {r.status==="match"?<CheckCircle2 className="mr-1 inline h-4 w-4"/>:
              r.status==="mismatch"?<XCircle className="mr-1 inline h-4 w-4"/>:
              <CircleHelp className="mr-1 inline h-4 w-4"/>}
              {r.label} — {statusLabel[r.status]}
            </summary>
            <div className="mt-2 space-y-1 text-xs leading-relaxed">
              <p><strong>Application:</strong> {r.submitted||"Not found"}</p>
              <p><strong>Supporting:</strong> {r.evidence||"Not available"}</p>
              <p><strong>Source:</strong> {r.sources.join(", ")||"No suitable confirmed record"}</p>
              <p>{r.explanation}</p>
            </div>
          </details>)}
        </div>
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" checked={showDetails} onChange={e=>setShowDetails(e.target.checked)}/>
          Show report export options
        </label>
        {showDetails&&<div className="space-y-3 rounded-xl border border-border p-3">
          <label className="flex items-start gap-2 text-xs">
            <input type="checkbox" checked={includeSensitive} onChange={e=>setIncludeSensitive(e.target.checked)}/>
            Include personal values and document labels in exported report (default: redacted). Aadhaar is always masked.
          </label>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={()=>downloadReport("txt")}><Download className="mr-1 h-4 w-4"/>Download text report</Button>
            <Button variant="outline" size="sm" onClick={()=>downloadReport("json")}><Download className="mr-1 h-4 w-4"/>Download JSON report</Button>
          </div>
        </div>}
      </div>}
    </section>
    <section className="space-y-3 rounded-2xl border border-border bg-card p-4 sm:p-5">
      <h3 className="font-semibold">4. Final manual checks that documents cannot prove</h3>
      <p className="text-xs text-muted-foreground">These are user-confirmed reminders, not automatic checks. The official notice always takes priority.</p>
      {checklist.map((label,i)=><label key={label} className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm">
        <input className="mt-1" type="checkbox" checked={checklistDone[i]}
          onChange={e=>setChecklistDone(old=>old.map((v,j)=>i===j?e.target.checked:v))}/>{label}
      </label>)}
      <p className="text-xs text-amber-800 dark:text-amber-300">Never click final submit solely because a report has green results. Verify the actual preview and current recruitment notification.</p>
      <Link className="text-sm text-primary underline" href="/tools/document-consistency-radar">Need a general name/DOB consistency check across records?</Link>
    </section>
  </div>;
}
