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

/** Physical dimensions are converted into pixel counts using the user-supplied DPI.
 * Canvas exports do not necessarily embed matching DPI/EXIF metadata. */
export type ExamDimensionUnit = "px" | "in" | "cm" | "mm";
export const EXAM_DIMENSION_UNITS: {value:ExamDimensionUnit;label:string}[] = [
 {value:"px",label:"pixel"},
 {value:"in",label:"inch"},
 {value:"cm",label:"centimeter"},
 {value:"mm",label:"millimeter"},
];
export const DEFAULT_EXAM_DPI = 300;
export function validateExamDpi(dpi:number):number {
 if(!Number.isFinite(dpi)||!Number.isInteger(dpi)||dpi<36||dpi>1200)
  throw Error("DPI must be a whole number between 36 and 1200.");
 return dpi;
}
export function physicalToPixels(value:number,unit:ExamDimensionUnit,dpi:number):number {
 if(!Number.isFinite(value)||value<=0) throw Error("Dimension must be greater than zero.");
 if(unit==="px")return Math.round(value);
 validateExamDpi(dpi);
 const inches=unit==="in"?value:unit==="cm"?value/2.54:value/25.4;
 return Math.round(inches*dpi);
}
export function pixelsToPhysical(pixels:number,unit:ExamDimensionUnit,dpi:number):number {
 if(!Number.isFinite(pixels)||pixels<=0) throw Error("Invalid pixel dimension.");
 if(unit==="px")return pixels;
 validateExamDpi(dpi);
 const inches=pixels/dpi;
 return unit==="in"?inches:unit==="cm"?inches*2.54:inches*25.4;
}
export function formatDimensionValue(pixels:number,unit:ExamDimensionUnit,dpi:number):number {
 const n=pixelsToPhysical(pixels,unit,dpi);
 return unit==="px"?n:Number(n.toFixed(3));
}
/** Keep the user's source name by default; append -AirTools and the actual format.
 * Custom names can include a source extension, which is replaced on export. */
export function buildExamDownloadFilename(sourceName:string,rename:string,extension:string):string {
 const stripExt=(value:string)=>value.replace(/\.(?:jpe?g|png|webp|pdf)$/i,"");
 const sourceBase=stripExt(sourceName.split(/[\\/]/).pop()||"image");
 const manual=stripExt(rename.trim());
 const cleaned=(manual||sourceBase+"-AirTools")
  .replace(/[\\/<>:"|?*\x00-\x1f\x7f]/g,"-").replace(/\.+$/g,"").trim().slice(0,120);
 return (cleaned||"image-AirTools")+"."+extension;
}
