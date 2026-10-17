import assert from "node:assert/strict";
import { test } from "node:test";
import {
  UPLOAD_KINDS, clampExamDimension, dimensionFromOther, percentDimensions,
  deriveExamCrop, validateExamOutput, examOutputName,
  physicalToPixels, pixelsToPhysical, formatDimensionValue,
  validateExamDpi, buildExamDownloadFilename
} from "../src/lib/exam-upload-specs.ts";

test("file types are generic, not tied to an exam notification",()=>{
 assert.deepEqual(UPLOAD_KINDS.map(x=>x.id),["photo","signature","thumb","declaration","document"]);
});
test("linked dimensions preserve source ratio",()=>{
 assert.equal(dimensionFromOther(132,531,413),170);
 assert.equal(dimensionFromOther(170,413,531),132);
 assert.equal(clampExamDimension(9000),4000);
 assert.equal(clampExamDimension(-10),20);
});
test("percentage uses original pixels and bounds",()=>{
 assert.deepEqual(percentDimensions(413,531,100),{width:413,height:531});
 assert.deepEqual(percentDimensions(413,531,50),{width:207,height:266});
 assert.throws(()=>percentDimensions(413,531,0));
 assert.deepEqual(percentDimensions(6000,4000,100),{width:4000,height:2667});
});
test("cover crop does not exceed source dimensions",()=>{
 for(const [w,h,tw,th,z,x,y] of [[600,800,200,230,1,.5,.5],[1200,400,140,60,2,1,0],[300,300,240,240,4,0,1]]){
  const r=deriveExamCrop(w,h,tw,th,z,x,y);
  assert.ok(r.sx>=0&&r.sy>=0&&r.sw+r.sx<=w+1e-6&&r.sh+r.sy<=h+1e-6);
  assert.ok(Math.abs(r.sw/r.sh-tw/th)<1e-8);
 }
 assert.throws(()=>deriveExamCrop(200,100,140,60,0,.5,.5));
});
test("byte validation uses optional KiB limits and actual MIME",()=>{
 const spec={width:140,height:60,format:"jpeg",minKB:10,maxKB:20};
 assert.equal(validateExamOutput(10*1024,140,60,spec,"image/jpeg").passed,true);
 assert.equal(validateExamOutput(20*1024,140,60,spec,"image/jpeg").passed,true);
 assert.equal(validateExamOutput(2*1024,120,60,spec,"image/png").issues.length,3);
 assert.equal(validateExamOutput(21*1024,140,60,spec,"image/jpeg").passed,false);
 assert.equal(validateExamOutput(20*1024,140,60,{width:140,height:60,format:"jpeg"},"image/jpeg").passed,true);
});
test("names",()=>assert.equal(examOutputName("thumb","jpeg"),"airtools-thumb.jpg"));

test("inches, centimetres and millimetres become exact pixels at supplied DPI",()=>{
 assert.equal(physicalToPixels(2,"in",300),600);
 assert.equal(physicalToPixels(2.54,"cm",300),300);
 assert.equal(physicalToPixels(25.4,"mm",300),300);
 assert.equal(physicalToPixels(35,"mm",300),413);
 assert.equal(physicalToPixels(170,"px",300),170);
 assert.ok(Math.abs(pixelsToPhysical(413,"mm",300)-34.9673)<.005);
 assert.equal(formatDimensionValue(300,"in",300),1);
 assert.equal(formatDimensionValue(300,"cm",300),2.54);
 assert.equal(formatDimensionValue(300,"mm",300),25.4);
});
test("DPI changes physical-to-pixel conversion, not pixel values",()=>{
 assert.equal(physicalToPixels(1,"in",72),72);
 assert.equal(physicalToPixels(1,"in",600),600);
 assert.equal(physicalToPixels(600,"px",72),600);
 assert.throws(()=>validateExamDpi(0));
 assert.throws(()=>validateExamDpi(1600));
 assert.throws(()=>physicalToPixels(-1,"cm",300));
});
test("default name preserves uploaded basename, adds AirTools, and respects final extension",()=>{
 assert.equal(buildExamDownloadFilename("My Portrait (1).JPG","","jpg"),"My Portrait (1)-AirTools.jpg");
 assert.equal(buildExamDownloadFilename("handwritten-signature.png","","png"),"handwritten-signature-AirTools.png");
 assert.equal(buildExamDownloadFilename("PI7-413x531_11ron-10.jpg","","webp"),"PI7-413x531_11ron-10-AirTools.webp");
 assert.equal(buildExamDownloadFilename("photo.jpg","Application Photo.png","jpg"),"Application Photo.jpg");
 assert.equal(buildExamDownloadFilename("photo.jpg","../my/new:name","jpg"),"..-my-new-name.jpg");
 assert.equal(buildExamDownloadFilename("photo.jpg","  ","jpg"),"photo-AirTools.jpg");
});
