/** User-defined image export settings; no recruitment-notice assumptions. */
export type ExamAssetKind = "photo" | "signature" | "thumb" | "declaration" | "document";
export type ExamImageFormat = "jpeg" | "png" | "webp";
export type ExamFitMode = "contain" | "cover" | "stretch";

export const UPLOAD_KINDS: {id:ExamAssetKind;label:string}[] = [
 {id:"photo",label:"Photo"},{id:"signature",label:"Signature"},
 {id:"thumb",label:"Thumb impression"},{id:"declaration",label:"Declaration"},
 {id:"document",label:"Document PDF"}
];

export function clampExamDimension(value:number):number {
 return Math.max(20,Math.min(4000,Math.round(Number.isFinite(value)?value:20)));
}
export function dimensionFromOther(value:number,originalOther:number,originalChanged:number){
 if(!Number.isFinite(value)||!Number.isFinite(originalOther)||!Number.isFinite(originalChanged)||originalChanged<=0)
  throw Error("Invalid image aspect ratio");
 return clampExamDimension(Math.round(value * originalOther / originalChanged));
}
export function percentDimensions(originalWidth:number,originalHeight:number,percent:number){
 if(!Number.isInteger(originalWidth)||!Number.isInteger(originalHeight)||originalWidth<1||originalHeight<1||!Number.isFinite(percent)||percent<=0)
  throw Error("Invalid image dimensions or percentage");
 const requestedWidth=Math.max(1,originalWidth*percent/100),requestedHeight=Math.max(1,originalHeight*percent/100);
 // Scale uniformly when exceeding browser canvas bounds; never silently
 // break the source aspect ratio by clamping the two axes independently.
 const factor=Math.min(1,4000/Math.max(requestedWidth,requestedHeight),Math.sqrt(16_000_000/(requestedWidth*requestedHeight)));
 return {width:clampExamDimension(Math.round(requestedWidth*factor)),height:clampExamDimension(Math.round(requestedHeight*factor))};
}
export function deriveExamCrop(w:number,h:number,targetW:number,targetH:number,zoom:number,x:number,y:number) {
 if([w,h,targetW,targetH,zoom,x,y].some(n=>!Number.isFinite(n))||w<=0||h<=0||targetW<=0||targetH<=0||zoom<1||zoom>4||x<0||x>1||y<0||y>1)
  throw Error("Invalid crop coordinates");
 const ratio=targetW/targetH,baseW=Math.min(w,h*ratio),baseH=baseW/ratio;
 const sw=baseW/zoom,sh=baseH/zoom;
 return {sx:(w-sw)*x,sy:(h-sh)*y,sw,sh};
}
export function validateExamOutput(
 bytes:number,width:number,height:number,
 spec:{width:number;height:number;format:ExamImageFormat;minKB?:number;maxKB?:number},mime:string
) {
 const issues:string[]=[];
 if(width!==spec.width||height!==spec.height)issues.push("Output dimensions do not match the chosen pixels.");
 if(mime!=="image/"+spec.format)issues.push("Output format is not the requested format.");
 if(spec.minKB && bytes<spec.minKB*1024)issues.push("File is below your minimum KB.");
 if(spec.maxKB && bytes>spec.maxKB*1024)issues.push("File is above your maximum KB.");
 return {passed:issues.length===0,issues};
}
export function examOutputName(kind:ExamAssetKind,format:ExamImageFormat) {
 return "airtools-"+kind+"."+(format==="jpeg"?"jpg":format);
}
