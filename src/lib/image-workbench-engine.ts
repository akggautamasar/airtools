import type { ImageWorkbenchPreset } from "./image-workbench-presets";

/* Functions in this module execute only in the browser except the pure unit
 * helpers, which are also exercised in node:test. No uploaded image leaves it. */
export type ExportFormat="jpeg"|"png"|"webp"|"bmp"|"ico"|"jfif";
export interface WorkbenchSettings {
 width:number;height:number;fit:"contain"|"cover"|"stretch"; background:string;
 quality:number; maxKB:number;strict:boolean; dpi:number;
 strength:number; regionX:number;regionY:number;regionW:number;regionH:number;
 border:number;radius:number; text:string; textColor:string;fontSize:number;
 rows:number;cols:number;arrangement:"horizontal"|"vertical"|"grid"|"photo-signature";
 output:ExportFormat; rotation:number;
}

export function ensureOutputSize(w:number,h:number){
 if(!Number.isInteger(w)||!Number.isInteger(h)||w<1||h<1||w>5000||h>5000||w*h>16_000_000)
   throw Error("Dimensions must be 1–5000 px and no more than 16 megapixels.");
 return {width:w,height:h};
}
export function mimeForOutput(format:ExportFormat):string{
 return format==="png"||format==="ico"?"image/png":format==="webp"?"image/webp":"image/jpeg";
}
export function suffixForOutput(format:ExportFormat){return format==="jpeg"?"jpg":format;}
export function exportName(name:string,format:ExportFormat,tag="AirTools"){
 const base=name.replace(/\.[^./\\]+$/,"").replace(/[\\/<>:"|?*\x00-\x1f]/g,"-").trim().slice(0,96)||"image";
 return base+"-"+tag+"."+suffixForOutput(format);
}
export function gridCells(count:number,columns:number) {
 const cols=Math.min(12,Math.max(1,Math.round(columns)));
 return {cols,rows:Math.ceil(Math.max(0,count)/cols)};
}
export function jpegPaddingBytes(required:number) {
 if(!Number.isSafeInteger(required)||required<0||required>4*1024*1024)throw Error("Padding size exceeds 4 MiB limit.");
 const chunks:number[]=[];let remaining=required;
 while(remaining>=4){
  const n=Math.min(65535,remaining);
  chunks.push(n);remaining-=n;
 }
 return {chunks,remainder:remaining};
}
export function addJpegPadding(original:Uint8Array,targetBytes:number){
 if(original.length<4||original[0]!==255||original[1]!==216)throw Error("Only valid JPEG images can be padded.");
 if(targetBytes<=original.length)return original;
 const extra=targetBytes-original.length;
 if(extra>4*1024*1024)throw Error("Padding is limited to 4 MiB.");
 const markerChunks:number[]=[];let remain=extra;
 while(remain>=4){
  const total=Math.min(remain,65537); // 2 marker bytes + max two-byte length (65535)
  markerChunks.push(total);remain-=total;
 }
 if(remain>0){ // A legal marker needs four bytes. Increase output slightly.
  markerChunks.push(4);remain=0;
 }
 const added=markerChunks.reduce((a,b)=>a+b,0),result=new Uint8Array(original.length+added);
 result.set(original.subarray(0,2),0);let offset=2;
 for(const bytes of markerChunks){
  result[offset++]=255;result[offset++]=239; // APP15
  const length=bytes-2;result[offset++]=length>>8;result[offset++]=length&255;
  // Payload remains zeroed; valid unknown APP15 application data.
  offset+=bytes-4;
 }
 result.set(original.subarray(2),offset);
 return result;
}
const read32=(a:Uint8Array,p:number)=>((a[p]*0x1000000)+(a[p+1]<<16)+(a[p+2]<<8)+a[p+3])>>>0;
const put32=(a:Uint8Array,p:number,n:number)=>{a[p]=n>>>24;a[p+1]=n>>>16;a[p+2]=n>>>8;a[p+3]=n;};
const put16=(a:Uint8Array,p:number,n:number)=>{a[p]=n&255;a[p+1]=(n>>8)&255;};
function crc32(data:Uint8Array){
 let crc=0xffffffff;
 for(const b of data){crc^=b;for(let i=0;i<8;i++)crc=crc&1?(crc>>>1)^0xedb88320:crc>>>1;}
 return (crc^0xffffffff)>>>0;
}
export function setPngDpi(input:Uint8Array,dpi:number):Uint8Array {
 if(!Number.isInteger(dpi)||dpi<36||dpi>1200)throw Error("Enter DPI between 36 and 1200.");
 if(input.length<33||input.subarray(0,8).join()!=="137,80,78,71,13,10,26,10")throw Error("Not a PNG.");
 const name=new Uint8Array([112,72,89,115]); // pHYs
 const record=new Uint8Array(21);
 put32(record,0,9);record.set(name,4);
 const ppm=Math.round(dpi/0.0254);
 put32(record,8,ppm);put32(record,12,ppm);record[16]=1;
 put32(record,17,crc32(record.subarray(4,17)));
 const chunks:Uint8Array[]=[];
 let offset=8,inserted=false;
 while(offset+12<=input.length){
  const length=read32(input,offset),end=offset+length+12;
  if(end>input.length)throw Error("Invalid PNG chunk length.");
  const type=String.fromCharCode(...input.subarray(offset+4,offset+8));
  if(type!=="pHYs")chunks.push(input.subarray(offset,end));
  if(type==="IHDR"&&!inserted){chunks.push(record);inserted=true;}
  offset=end;
  if(type==="IEND")break;
 }
 if(!inserted)throw Error("PNG has no IHDR.");
 const total=8+chunks.reduce((n,c)=>n+c.length,0);
 const out=new Uint8Array(total);out.set(input.subarray(0,8),0);
 let pos=8;for(const chunk of chunks){out.set(chunk,pos);pos+=chunk.length;}
 return out;
}
export function setJpegDpi(input:Uint8Array,dpi:number):Uint8Array {
 if(!Number.isInteger(dpi)||dpi<36||dpi>1200)throw Error("Enter DPI between 36 and 1200.");
 if(input.length<4||input[0]!==255||input[1]!==216)throw Error("Not a JPEG.");
 const density=Math.min(65535,dpi);
 let pos=2;
 while(pos+18<=input.length&&input[pos]===255){
  const marker=input[pos+1];
  if(marker===0xda||marker===0xd9)break;
  if(marker>=0xd0&&marker<=0xd7){pos+=2;continue;}
  const len=input[pos+2]*256+input[pos+3];
  if(len<2||pos+len+2>input.length)break;
  if(marker===0xe0&&len>=16&&String.fromCharCode(...input.subarray(pos+4,pos+9))==="JFIF\0"){
   const out=input.slice();
   out[pos+11]=1;out[pos+12]=density>>8;out[pos+13]=density&255;
   out[pos+14]=density>>8;out[pos+15]=density&255;
   return out;
  }
  pos+=len+2;
 }
 const jfif=new Uint8Array([255,224,0,16,74,70,73,70,0,1,2,1,density>>8,density&255,density>>8,density&255,0,0]);
 const out=new Uint8Array(input.length+jfif.length);
 out.set(input.subarray(0,2));out.set(jfif,2);out.set(input.subarray(2),2+jfif.length);
 return out;
}
export function inspectImageDpi(bytes:Uint8Array):number|null {
 if(bytes.length>25&&bytes[0]===137&&bytes[1]===80){
  let p=8;while(p+12<=bytes.length){
   const len=read32(bytes,p);if(p+len+12>bytes.length)break;
   const type=String.fromCharCode(...bytes.subarray(p+4,p+8));
   if(type==="pHYs"&&len>=9&&bytes[p+16]===1)return Math.round(read32(bytes,p+8)*0.0254);
   p+=len+12;
  }
 }
 if(bytes.length>16&&bytes[0]===255&&bytes[1]===216){
  let p=2;
  while(p+18<bytes.length&&bytes[p]===255){
   const marker=bytes[p+1];if(marker===0xda||marker===0xd9)break;
   const len=bytes[p+2]*256+bytes[p+3];if(len<2||p+len+2>bytes.length)break;
   if(marker===0xe0&&len>=16&&String.fromCharCode(...bytes.subarray(p+4,p+9))==="JFIF\0"){
    const unit=bytes[p+11],density=(bytes[p+12]<<8)+bytes[p+13];
    return unit===1?density:unit===2?Math.round(density*2.54):null;
   }
   p+=len+2;
  }
 }
 return null;
}
export async function jpegWithDpi(blob:Blob,dpi:number) {
 const bytes=new Uint8Array(await blob.arrayBuffer());
 return new Blob([new Uint8Array(setJpegDpi(bytes,dpi))],{type:"image/jpeg"});
}
export async function pngWithDpi(blob:Blob,dpi:number) {
 const bytes=new Uint8Array(await blob.arrayBuffer());
 return new Blob([new Uint8Array(setPngDpi(bytes,dpi))],{type:"image/png"});
}
export async function openImages(files:File[]) {
 if(!files.length)throw Error("Choose one or more images.");
 if(files.length>12)throw Error("Maximum 12 images per batch.");
 const result:ImageBitmap[]=[];
 try{
  for(const file of files){
   if(file.size>20*1024*1024)throw Error(file.name+" exceeds the 20 MiB limit.");
   const bitmap=await createImageBitmap(file);
   if(bitmap.width*bitmap.height>30_000_000){bitmap.close();throw Error(file.name+" is over 30 megapixels.");}
   result.push(bitmap);
  }
  return result;
 }catch(e){result.forEach(x=>x.close());throw e;}
}
export function createCanvas(w:number,h:number){
 ensureOutputSize(w,h);
 const canvas=document.createElement("canvas");canvas.width=w;canvas.height=h;return canvas;
}
function fillBackground(ctx:CanvasRenderingContext2D,w:number,h:number,bg:string) {
 ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
}
function drawContained(ctx:CanvasRenderingContext2D,image:ImageBitmap,x:number,y:number,w:number,h:number,background:string) {
 ctx.fillStyle=background;ctx.fillRect(x,y,w,h);
 const scale=Math.min(w/image.width,h/image.height);
 const rw=image.width*scale,rh=image.height*scale;
 ctx.drawImage(image,x+(w-rw)/2,y+(h-rh)/2,rw,rh);
}
function drawBase(ctx:CanvasRenderingContext2D,image:ImageBitmap,s:WorkbenchSettings){
 fillBackground(ctx,s.width,s.height,s.background);
 const iw=image.width,ih=image.height,w=s.width,h=s.height;
 if(s.fit==="stretch"){ctx.drawImage(image,0,0,w,h);return;}
 const scale=s.fit==="cover"?Math.max(w/iw,h/ih):Math.min(w/iw,h/ih);
 const nw=iw*scale,nh=ih*scale;
 ctx.drawImage(image,(w-nw)/2,(h-nh)/2,nw,nh);
}
function sharpen(ctx:CanvasRenderingContext2D,w:number,h:number,strength:number) {
 // Keep convolution bounded on cheap phones; do not claim recovered detail.
 if(w*h>4_000_000)throw Error("Sharpening is limited to 4 megapixels. Resize first.");
 const a=ctx.getImageData(0,0,w,h),out=ctx.createImageData(w,h);
 const k=Math.max(.15,Math.min(1,strength/100));
 const src=a.data,dst=out.data;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=(y*w+x)*4;
  for(let c=0;c<3;c++){
   const center=src[i+c];
   const left=src[(y*w+Math.max(0,x-1))*4+c],right=src[(y*w+Math.min(w-1,x+1))*4+c];
   const up=src[(Math.max(0,y-1)*w+x)*4+c],down=src[(Math.min(h-1,y+1)*w+x)*4+c];
   dst[i+c]=Math.max(0,Math.min(255,center+k*(4*center-left-right-up-down)));
  }
  dst[i+3]=src[i+3];
 }
 ctx.putImageData(out,0,0);
}
function drawPixelation(ctx:CanvasRenderingContext2D,w:number,h:number,size:number,region?:{x:number;y:number;w:number;h:number}){
 const x=region?.x||0,y=region?.y||0,rw=region?.w||w,rh=region?.h||h;
 const block=Math.max(2,Math.min(90,Math.round(size)));
 const tiny=document.createElement("canvas");tiny.width=Math.max(1,Math.ceil(rw/block));tiny.height=Math.max(1,Math.ceil(rh/block));
 const c=tiny.getContext("2d");if(!c)throw Error("Canvas unavailable");
 c.imageSmoothingEnabled=false;c.drawImage(ctx.canvas,x,y,rw,rh,0,0,tiny.width,tiny.height);
 ctx.imageSmoothingEnabled=false;ctx.drawImage(tiny,0,0,tiny.width,tiny.height,x,y,rw,rh);ctx.imageSmoothingEnabled=true;
}
export function renderWorkbench(
 images:ImageBitmap[],preset:ImageWorkbenchPreset,s:WorkbenchSettings,logo?:ImageBitmap
):HTMLCanvasElement{
 const first=images[0];if(!first)throw Error("No image selected.");
 const mode=preset.mode;
 const multi=(mode==="layout");
 let w=s.width,h=s.height;
 if(multi){
  const n=images.length;
  const cols=s.arrangement==="vertical"||s.arrangement==="photo-signature"?1:
   s.arrangement==="horizontal"?n:gridCells(n,s.cols).cols;
  const rows=Math.ceil(n/cols);
  w=Math.max(160,Math.min(5000,cols*400));h=Math.max(160,Math.min(5000,rows*400));
  if(w*h>16_000_000){const factor=Math.sqrt(16_000_000/(w*h));w=Math.round(w*factor);h=Math.round(h*factor);}
 }
 const canvas=createCanvas(w,h),ctx=canvas.getContext("2d",{willReadFrequently:true});if(!ctx)throw Error("Canvas unavailable");
 fillBackground(ctx,w,h,s.background);
 if(multi){
  const cols=s.arrangement==="vertical"||s.arrangement==="photo-signature"?1:
   s.arrangement==="horizontal"?images.length:gridCells(images.length,s.cols).cols;
  const rows=Math.ceil(images.length/cols);
  images.forEach((im,i)=>{
   const x=Math.round((i%cols)*w/cols),y=Math.round(Math.floor(i/cols)*h/rows);
   const x2=Math.round(((i%cols)+1)*w/cols),y2=Math.round((Math.floor(i/cols)+1)*h/rows);
   drawContained(ctx,im,x,y,x2-x,y2-y,s.background);
  });
  return canvas;
 }
 drawBase(ctx,first,{...s,width:w,height:h});
 if(mode==="effect"){
  const regionSelected=preset.slug.endsWith("-region");
  const region=regionSelected?{
   x:Math.round(s.regionX*w/100),y:Math.round(s.regionY*h/100),
   w:Math.round(s.regionW*w/100),h:Math.round(s.regionH*h/100)
  }:undefined;
  const effect=preset.effect||"grayscale";
  if(effect==="pixelate"){drawPixelation(ctx,w,h,s.strength,region);return canvas;}
  if(effect==="sharpen"){sharpen(ctx,w,h,s.strength);return canvas;}
  if(effect==="motion-blur"){
   const base=document.createElement("canvas");base.width=w;base.height=h;base.getContext("2d")?.drawImage(canvas,0,0);
   ctx.globalAlpha=.12;
   for(let i=-4;i<=4;i++)ctx.drawImage(base,i*s.strength/4,0);
   ctx.globalAlpha=1;return canvas;
  }
  const filters:Record<string,string>={
   grayscale:"grayscale(100%)",blackwhite:"grayscale(100%) contrast(260%)",
   blur:`blur(${Math.min(32,s.strength/3)}px)`,sepia:"sepia(85%)",
   deepfry:"contrast(240%) saturate(350%)",invert:"invert(100%)"
  };
  const temp=document.createElement("canvas");temp.width=w;temp.height=h;
  temp.getContext("2d")?.drawImage(canvas,0,0);
  const original=ctx.filter;ctx.filter=filters[effect]||"none";
  if(region){
   ctx.save();ctx.beginPath();ctx.rect(region.x,region.y,region.w,region.h);ctx.clip();
   ctx.drawImage(temp,0,0);ctx.restore();
  }else ctx.drawImage(temp,0,0);
  ctx.filter=original;return canvas;
 }
 if(mode==="overlay"){
  const kind=preset.overlay||"text";
  if(kind==="border"){
   const thick=Math.max(1,Math.round(s.border*w/100));
   ctx.strokeStyle=preset.slug==="white-border-image"?"#ffffff":s.textColor;
   ctx.lineWidth=thick;ctx.strokeRect(thick/2,thick/2,w-thick,h-thick);
  }else if(kind==="round"){
   const r=Math.min(w/2,h/2,Math.round(s.radius*Math.min(w,h)/100));
   const copy=document.createElement("canvas");copy.width=w;copy.height=h;copy.getContext("2d")?.drawImage(canvas,0,0);
   ctx.clearRect(0,0,w,h);
   ctx.beginPath();ctx.roundRect(0,0,w,h,r);ctx.clip();ctx.drawImage(copy,0,0);
  }else if(kind==="logo"&&logo){
   const size=w*Math.max(.05,Math.min(.65,s.fontSize/160)),height=size*logo.height/logo.width;
   ctx.globalAlpha=.8;ctx.drawImage(logo,w-size-20,h-height-20,size,height);ctx.globalAlpha=1;
  }else if(kind==="text"||kind==="date"){
   const size=Math.max(12,Math.min(180,s.fontSize));
   const text=s.text.trim()|| (kind==="date"?"Name / Date of Birth":"Your text");
   ctx.font=`bold ${size}px system-ui,sans-serif`;ctx.textAlign="center";
   const pad=size/1.5;const lines=text.split("\n").slice(0,5);
   const top=h-Math.max(pad,lines.length*(size*1.15)+pad);
   ctx.fillStyle="rgba(0,0,0,.55)";ctx.fillRect(0,top,w,h-top);
   ctx.fillStyle=s.textColor;
   lines.forEach((line,i)=>ctx.fillText(line,w/2,top+pad+i*size*1.15,w-16));
  }
 }
 return canvas;
}
export async function canvasBlob(canvas:HTMLCanvasElement,format:"jpeg"|"png"|"webp",quality=.9):Promise<Blob> {
 return new Promise((resolve,reject)=>canvas.toBlob(b=>{
  if(!b)return reject(Error("Image encoding failed"));
  if(b.type!=="image/"+format)return reject(Error("This browser cannot export "+format.toUpperCase()+". Try JPG or PNG."));
  resolve(b);
 },"image/"+format,quality));
}
export async function encodeBmp(canvas:HTMLCanvasElement):Promise<Blob>{
 const w=canvas.width,h=canvas.height,stride=(w*3+3)&~3,size=54+stride*h;
 if(size>48*1024*1024)throw Error("BMP output over 48 MiB. Resize first.");
 const result=new Uint8Array(size),v=new DataView(result.buffer);
 result[0]=66;result[1]=77;v.setUint32(2,size,true);v.setUint32(10,54,true);
 v.setUint32(14,40,true);v.setInt32(18,w,true);v.setInt32(22,h,true);
 v.setUint16(26,1,true);v.setUint16(28,24,true);v.setUint32(34,stride*h,true);
 const ctx=canvas.getContext("2d",{willReadFrequently:true});if(!ctx)throw Error("Canvas unavailable");
 const rgba=ctx.getImageData(0,0,w,h).data;
 for(let y=0;y<h;y++){
  const dest=54+(h-1-y)*stride;
  for(let x=0;x<w;x++){const src=(y*w+x)*4,j=dest+x*3;
   const a=rgba[src+3]/255;result[j]=Math.round(rgba[src+2]*a+255*(1-a));
   result[j+1]=Math.round(rgba[src+1]*a+255*(1-a));result[j+2]=Math.round(rgba[src]*a+255*(1-a));
  }
 }
 return new Blob([result],{type:"image/bmp"});
}
export async function encodeIco(canvas:HTMLCanvasElement):Promise<Blob>{
 const size=256,c=document.createElement("canvas");c.width=size;c.height=size;
 const ctx=c.getContext("2d");if(!ctx)throw Error("Canvas unavailable");
 const scale=Math.min(size/canvas.width,size/canvas.height);
 ctx.drawImage(canvas,(size-canvas.width*scale)/2,(size-canvas.height*scale)/2,canvas.width*scale,canvas.height*scale);
 const png=new Uint8Array(await (await canvasBlob(c,"png")).arrayBuffer());
 const header=new Uint8Array(22),view=new DataView(header.buffer);
 view.setUint16(2,1,true);view.setUint16(4,1,true);
 header[6]=0;header[7]=0;header[8]=0;header[9]=0;
 view.setUint16(10,1,true);view.setUint16(12,32,true);view.setUint32(14,png.length,true);view.setUint32(18,22,true);
 return new Blob([header,png],{type:"image/x-icon"});
}
export async function encodeImage(canvas:HTMLCanvasElement,s:WorkbenchSettings,p:ImageWorkbenchPreset){
 if(s.output==="ico")return {blob:await encodeIco(canvas),passed:true};
 if(s.output==="bmp")return {blob:await encodeBmp(canvas),passed:true};
 const encoding=s.output==="jfif"?"jpeg":s.output;
 if(encoding==="png"){
  let blob=await canvasBlob(canvas,"png");
  if(p.mode==="dpi")blob=await pngWithDpi(blob,s.dpi);
  return {blob,passed:!s.maxKB||blob.size<=s.maxKB*1024};
 }
 let best:Blob|null=null,passed=false;
 const qualities=s.maxKB?[.99,.94,.89,.83,.76,.68,.59,.48,.37,.27,.17,.09]:[Math.max(.1,Math.min(.99,s.quality/100))];
 for(const quality of qualities){
  const current=await canvasBlob(canvas,encoding,quality);
  best=current;if(!s.maxKB||current.size<=s.maxKB*1024){passed=true;break;}
 }
 if(!best)throw Error("Could not encode image.");
 if(p.mode==="dpi"&&encoding==="jpeg")best=await jpegWithDpi(best,s.dpi);
 if(p.slug==="image-kb-increaser"&&s.maxKB){
  const padded=addJpegPadding(new Uint8Array(await best.arrayBuffer()),s.maxKB*1024);
  best=new Blob([new Uint8Array(padded)],{type:"image/jpeg"});passed=true;
 }
 return {blob:best,passed:passed&&(!s.maxKB||best.size<=s.maxKB*1024)};
}
export async function imageToPdf(canvas:HTMLCanvasElement,maxKB:number) {
 const {PDFDocument}=await import("pdf-lib");
 let last:Blob|null=null;
 for(let pass=0;pass<12;pass++){
  const factor=Math.max(.35,1-pass*.055);
  const work=document.createElement("canvas");
  work.width=Math.max(80,Math.round(canvas.width*factor));work.height=Math.max(80,Math.round(canvas.height*factor));
  work.getContext("2d")?.drawImage(canvas,0,0,work.width,work.height);
  const jpg=await canvasBlob(work,"jpeg",Math.max(.12,.92-pass*.065));
  const doc=await PDFDocument.create(),page=doc.addPage([595.28,841.89]);
  const img=await doc.embedJpg(await jpg.arrayBuffer());
  const scale=Math.min(550/img.width,800/img.height),w=img.width*scale,h=img.height*scale;
  page.drawImage(img,{x:(595.28-w)/2,y:(841.89-h)/2,width:w,height:h});
  last=new Blob([new Uint8Array(await doc.save())],{type:"application/pdf"});
  if(!maxKB||last.size<=maxKB*1024)return {blob:last,passed:true};
 }
 if(!last)throw Error("Could not encode PDF");
 return {blob:last,passed:false};
}
export function tilesFromCanvas(canvas:HTMLCanvasElement,rows:number,cols:number) {
 const result:HTMLCanvasElement[]=[];
 rows=Math.max(1,Math.min(8,Math.round(rows)));cols=Math.max(1,Math.min(8,Math.round(cols)));
 for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
  const sx=Math.round(x*canvas.width/cols),sy=Math.round(y*canvas.height/rows);
  const ex=Math.round((x+1)*canvas.width/cols),ey=Math.round((y+1)*canvas.height/rows);
  const part=document.createElement("canvas");part.width=ex-sx;part.height=ey-sy;
  part.getContext("2d")?.drawImage(canvas,sx,sy,part.width,part.height,0,0,part.width,part.height);
  result.push(part);
 }
 return result;
}
