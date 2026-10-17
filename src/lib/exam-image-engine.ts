import type {ExamAssetKind,ExamImageFormat} from "./exam-upload-specs";
import {deriveExamCrop} from "./exam-upload-specs";

export interface RenderSettings {width:number;height:number;kind:ExamAssetKind;zoom:number;x:number;y:number;paperCleanup:boolean;inset:number;}
export interface ExamImageAnalysis {
  brightness:number;contrast:number;inkFraction:number;darkBorderFraction:number;
  flags:string[];
}
export async function loadExamImage(file:File):Promise<HTMLImageElement>{
  if(file.size>15*1024*1024)throw Error("Source image must be 15 MiB or smaller");
  if(!["image/jpeg","image/png","image/webp"].includes(file.type))throw Error("Please upload a JPG, PNG or WebP image");
  const url=URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve,reject)=>{
      const img=new Image();
      img.onload=()=>{if(img.naturalWidth*img.naturalHeight>28_000_000)reject(Error("Image is too large (28 megapixel limit)"));else resolve(img);};
      img.onerror=()=>reject(Error("Could not decode this image"));
      img.src=url;
    });
  }finally{URL.revokeObjectURL(url);}
}
export function renderExamImage(image:HTMLImageElement,s:RenderSettings):HTMLCanvasElement {
 const canvas=document.createElement("canvas");canvas.width=s.width;canvas.height=s.height;
 const ctx=canvas.getContext("2d",{willReadFrequently:true});if(!ctx)throw Error("Canvas unavailable");
 ctx.fillStyle="#ffffff";ctx.fillRect(0,0,s.width,s.height);
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
 const iw=image.naturalWidth,ih=image.naturalHeight;
 if(s.kind==="photo"){
   const crop=deriveExamCrop(iw,ih,s.width,s.height,s.zoom,s.x,s.y);
   ctx.drawImage(image,crop.sx,crop.sy,crop.sw,crop.sh,0,0,s.width,s.height);
 }else{
   const pad=Math.min(.35,Math.max(0,s.inset))/2;
   const innerW=s.width*(1-2*pad),innerH=s.height*(1-2*pad);
   const fit=Math.min(innerW/iw,innerH/ih)*Math.min(2,s.zoom);
   const w=Math.min(s.width,iw*fit),h=Math.min(s.height,ih*fit);
   const dx=(s.width-w)*s.x,dy=(s.height-h)*s.y;
   ctx.drawImage(image,dx,dy,w,h);
 }
 if(s.paperCleanup && s.kind!=="photo"){
   const pixels=ctx.getImageData(0,0,s.width,s.height),data=pixels.data;
   for(let i=0;i<data.length;i+=4){
     // only brighten near-white paper; NEVER replace real ink/identity features
     if(data[i]>=215&&data[i+1]>=215&&data[i+2]>=215){
       const t=Math.min(1,(Math.min(data[i],data[i+1],data[i+2])-215)/40);
       for(let k=0;k<3;k++)data[i+k]=Math.round(data[i+k]*(1-t)+255*t);
     }
   }
   ctx.putImageData(pixels,0,0);
 }
 return canvas;
}
export async function canvasAsBlob(canvas:HTMLCanvasElement,format:ExamImageFormat,quality=.9):Promise<Blob>{
 return new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error("Image encoding failed")),"image/"+format,quality));
}
export async function sizeTargetExport(canvas:HTMLCanvasElement,format:ExamImageFormat,minKB:number,maxKB:number) {
 if(format==="png") {
   const blob=await canvasAsBlob(canvas,"png");
   return {blob,quality:null as number|null,inRange:blob.size>=minKB*1024&&blob.size<=maxKB*1024};
 }
 // Browser JPEG/WebP encoders vary; test multiple qualities and choose a
 // valid in-range result where possible, otherwise choose nearest boundary.
 let best:Blob|null=null,bestQ=0,bestDiff=Number.POSITIVE_INFINITY,bestInRange=false;
 for(let i=0;i<=22;i++){
   const q=Math.max(.05,.99-i*.0425);
   const blob=await canvasAsBlob(canvas,format,q);
   const lower=minKB*1024,upper=maxKB*1024,valid=blob.size>=lower&&blob.size<=upper;
   const distance=valid?Math.abs(blob.size-(lower+upper)/2):blob.size<lower?lower-blob.size:blob.size-upper;
   if((valid&&!bestInRange)||(valid===bestInRange&&distance<bestDiff)){
     best=blob;bestQ=q;bestDiff=distance;bestInRange=valid;
   }
 }
 if(!best)throw Error("Failed to encode image");
 return {blob:best,quality:bestQ,inRange:bestInRange};
}
export function analyzeExamCanvas(canvas:HTMLCanvasElement,kind:ExamAssetKind):ExamImageAnalysis {
 const sample=document.createElement("canvas");sample.width=96;sample.height=96;
 const context=sample.getContext("2d",{willReadFrequently:true});
 if(!context)throw Error("Cannot analyze canvas");
 context.drawImage(canvas,0,0,96,96);
 const {data}=context.getImageData(0,0,96,96);
 let sum=0,sumSquares=0,ink=0,borderInk=0,borderPixels=0;
 for(let y=0;y<96;y++)for(let x=0;x<96;x++){
   const i=(y*96+x)*4,grey=(data[i]*.2126+data[i+1]*.7152+data[i+2]*.0722);
   sum+=grey;sumSquares+=grey*grey;if(grey<170)ink++;
   if(x<3||y<3||x>92||y>92){borderPixels++;if(grey<160)borderInk++;}
 }
 const mean=sum/(96*96);
 const contrast=Math.sqrt(Math.max(0,sumSquares/(96*96)-mean*mean));
 const inkFrac=ink/(96*96),borderFrac=borderInk/Math.max(1,borderPixels);
 const flags:string[]=[];
 if(kind==="photo"){
   if(mean<65)flags.push("Image appears very dark; retake with even front lighting.");
   if(mean>245)flags.push("Image appears overexposed; face detail may be lost.");
   if(contrast<18)flags.push("Low contrast; check that the face is sharp and clearly visible.");
   flags.push("Manually check: one real face, frontal gaze, full head, plain background, no filters or forbidden eyewear.");
 }else{
   if(inkFrac<.005)flags.push("Very little dark ink detected. File may be blank or too faint.");
   if(borderFrac>.16)flags.push("Dark marks touch the edges. The impression or writing may be cropped.");
   if(mean<140)flags.push("Paper/background appears unusually dark.");
   if(contrast<15)flags.push("Low contrast; strokes or thumb ridges may be faint.");
   flags.push(kind==="thumb"?"Manually check: correct hand/thumb and complete, separate ridges.":kind==="declaration"?"Manually check: exact required words, genuine handwriting and capitalization.":"Manually check: genuine running signature, proper ink, no cropping or block capitals.");
 }
 return {brightness:Math.round(mean),contrast:Math.round(contrast),inkFraction:inkFrac,darkBorderFraction:borderFrac,flags};
}
