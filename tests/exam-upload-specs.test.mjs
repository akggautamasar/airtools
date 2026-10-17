import assert from "node:assert/strict";
import { test } from "node:test";
import {
  UPLOAD_KINDS, clampExamDimension, dimensionFromOther, percentDimensions,
  deriveExamCrop, validateExamOutput, examOutputName
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
