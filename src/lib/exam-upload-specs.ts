/**
 * Sample profiles from specific recruitment notices, NOT universal or current
 * exam upload rules. Candidates must compare their own live portal.
 * min/max sizes are exact only for the cited notice; width/height are working
 * canvas sizes unless dimensionsOfficial is true.
 */
export type ExamAssetKind="photo"|"signature"|"thumb"|"declaration"|"document";
export type ExamImageFormat="jpeg"|"png"|"webp";
export interface ExamUploadPreset {
  id:string; label:string; agency:string; kind:ExamAssetKind;
  width:number; height:number; minKB:number; maxKB:number;
  format:ExamImageFormat; source:string; sourceLabel:string;
  dimensionNote:string; dimensionsOfficial:boolean; requirement:string[];
  optional?:boolean;
}
export const EXAM_UPLOAD_PRESETS:ExamUploadPreset[]=[
  {id:"rrb25-photo",agency:"RRB",kind:"photo",label:"RRB CEN 09/2025 · Photograph",
    width:200,height:230,minKB:40,maxKB:70,format:"jpeg",
    source:"https://www.rrbcdg.gov.in/uploads/2025/09-LVL1/092025-FAQs.pdf",sourceLabel:"RRB CEN 09/2025 FAQ Q51",
    dimensionNote:"200×230 is an editable working canvas, NOT an RRB-mandated pixel dimension. Check upload form; minimum 100 DPI stated.",dimensionsOfficial:false,
    requirement:["JPEG; 40–70 KB in this CEN FAQ","Recent clear photo, face unobstructed","Check upload portal for exact dimensions, background and live-photo rules"]},
  {id:"rrb25-sign",agency:"RRB",kind:"signature",label:"RRB CEN 09/2025 · Signature",
    width:350,height:150,minKB:30,maxKB:70,format:"jpeg",
    source:"https://www.rrbcdg.gov.in/uploads/2025/09-LVL1/092025-FAQs.pdf",sourceLabel:"RRB CEN 09/2025 FAQ Q51",
    dimensionNote:"350×150 is an editable working canvas, NOT a mandated pixel dimension. Check current notice.",dimensionsOfficial:false,
    requirement:["JPEG; 30–70 KB in this CEN FAQ","Real handwritten candidate signature in the required ink","Fully visible, legible strokes, clean white paper"]},
  {id:"rrb25-tech-sign",agency:"RRB",kind:"signature",label:"RRB CEN 02/2025 Technician · Signature",
    width:350,height:200,minKB:30,maxKB:49,format:"jpeg",
    source:"https://www.rrbcdg.gov.in/uploads/2025/02-TECH/022025-CEN.pdf",sourceLabel:"RRB CEN 02/2025 § signature",
    dimensionNote:"Working canvas 350×200; notification specifies MINIMUM 140×60 px, not this exact canvas.",dimensionsOfficial:false,
    requirement:["JPEG; 30–49 KB, at least 140×60 pixels, 100 DPI scan minimum","Black ink on white paper; cursive/running handwriting","Do not submit block capitals, blank, cutoff, colored ink or thumb in place of signature"]},
  {id:"ibps25-sign",agency:"IBPS-style notice",kind:"signature",label:"IBPS-hosted 2025/26 notice · Signature",
    width:140,height:60,minKB:10,maxKB:20,format:"jpeg",
    source:"https://ibpsreg.ibps.in/nabfdsadec25/",sourceLabel:"IBPS-hosted recruitment scanning instructions",
    dimensionNote:"140×60 pixels preferred by the cited notice, not a universal IBPS requirement.",dimensionsOfficial:false,
    requirement:["JPG/JPEG, 10–20 KB in cited notice","140×60 px preferred","Black-ink running signature on white paper; not CAPITAL letters"]},
  {id:"ibps25-thumb",agency:"IBPS-style notice",kind:"thumb",label:"IBPS-hosted 2025/26 notice · Left thumb",
    width:240,height:240,minKB:20,maxKB:50,format:"jpeg",
    source:"https://ibpsreg.ibps.in/nabfdsadec25/",sourceLabel:"IBPS-hosted recruitment scanning instructions",
    dimensionNote:"240×240 pixels (200 DPI) preferred by the cited notice.",dimensionsOfficial:false,
    requirement:["JPG/JPEG; 20–50 KB in cited notice","Actual LEFT thumb impression; black or blue ink on white paper","Complete ridge impression, not smudged or cropped"]},
  {id:"ibps25-declaration",agency:"IBPS-style notice",kind:"declaration",label:"IBPS-hosted 2025/26 · Handwritten declaration",
    width:800,height:400,minKB:50,maxKB:100,format:"jpeg",
    source:"https://ibpsreg.ibps.in/nabfdsadec25/",sourceLabel:"IBPS-hosted recruitment scanning instructions",
    dimensionNote:"800×400 pixels at 200 DPI preferred in cited notice.",dimensionsOfficial:false,
    requirement:["JPG/JPEG; 50–100 KB in cited notice","Write prescribed text by hand in English in black ink on white paper","Do not use ALL CAPS, typed text, another person's handwriting, or blurred images"]},
  {id:"ssc24-sign",agency:"SSC",kind:"signature",label:"SSC CHSL 2024 · Signature (historical)",
    width:400,height:200,minKB:10,maxKB:20,format:"jpeg",
    source:"https://ssc.gov.in/api/attachment/uploads/masterData/NoticeBoards/Notice%20of%20CHSLE%202024_05_04_24.pdf",sourceLabel:"SSC CHSL 2024 notice",
    dimensionNote:"4×2 cm suggested in historical notice; 400×200 is EDITABLE working pixels, not specified resolution.",dimensionsOfficial:false,
    requirement:["Historical rule: JPEG, 10–20 KB; about 4×2 cm","Signature cannot be blurred","SSC recruitment may require LIVE camera photo—an uploaded edited photo cannot substitute"]},
  {id:"custom-photo",agency:"Custom",kind:"photo",label:"Custom photograph",
    width:200,height:230,minKB:0,maxKB:100,format:"jpeg",
    source:"",sourceLabel:"User-supplied application notice",dimensionNote:"Set all dimensions and file limits from your actual form.",dimensionsOfficial:false,
    requirement:["Plain background, natural expression, face visible","Do not use filters or digital alteration if prohibited"]},
  {id:"custom-sign",agency:"Custom",kind:"signature",label:"Custom signature",
    width:300,height:100,minKB:0,maxKB:50,format:"jpeg",
    source:"",sourceLabel:"User-supplied application notice",dimensionNote:"Set dimensions and size from your actual form.",dimensionsOfficial:false,
    requirement:["Applicant's real running signature, centered and complete","Ink and background according to issuing notice"]},
  {id:"custom-thumb",agency:"Custom",kind:"thumb",label:"Custom thumb impression",
    width:240,height:240,minKB:0,maxKB:50,format:"jpeg",
    source:"",sourceLabel:"User-supplied application notice",dimensionNote:"Set dimensions and size from your actual form.",dimensionsOfficial:false,
    requirement:["Correct thumb (left/right as required), complete, legible ridges"]},
  {id:"custom-declaration",agency:"Custom",kind:"declaration",label:"Custom handwritten declaration",
    width:800,height:400,minKB:0,maxKB:100,format:"jpeg",
    source:"",sourceLabel:"User-supplied application notice",dimensionNote:"Enter prescribed text, pixel size, format and size limits.",dimensionsOfficial:false,
    requirement:["Use precise wording from your recruitment notice","Real handwriting; verify case/language and legibility"]},
];
export function validateExamOutput(bytes:number,width:number,height:number,spec:{minKB:number;maxKB:number;width:number;height:number;format:ExamImageFormat},mime:string) {
 const issues:string[]=[];
 if(width!==spec.width||height!==spec.height)issues.push("Pixel dimensions do not match target");
 if(mime!==("image/"+spec.format))issues.push("File format is not "+spec.format.toUpperCase());
 if(bytes<spec.minKB*1024)issues.push("File is smaller than the selected minimum");
 if(bytes>spec.maxKB*1024)issues.push("File is larger than the selected maximum");
 return {passed:issues.length===0,issues};
}
export function examOutputName(kind:ExamAssetKind,format:ExamImageFormat) {
 return "airtools-exam-"+kind+"."+(format==="jpeg"?"jpg":format);
}
export function clampExamDimension(value:number):number {
 return Math.max(20,Math.min(4000,Math.round(Number.isFinite(value)?value:20)));
}
export function deriveExamCrop(w:number,h:number,targetW:number,targetH:number,zoom:number,x:number,y:number){
 if([w,h,targetW,targetH,zoom,x,y].some(n=>!Number.isFinite(n))||w<=0||h<=0||targetW<=0||targetH<=0||zoom<1||zoom>4||x<0||x>1||y<0||y>1)
   throw Error("Invalid crop coordinates");
 const ratio=targetW/targetH;
 const baseW=Math.min(w,h*ratio),baseH=baseW/ratio;
 const sw=baseW/zoom,sh=baseH/zoom;
 return {sx:(w-sw)*x,sy:(h-sh)*y,sw,sh};
}
