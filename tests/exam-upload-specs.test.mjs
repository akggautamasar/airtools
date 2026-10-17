import assert from "node:assert/strict";
import {test} from "node:test";
import {EXAM_UPLOAD_PRESETS,validateExamOutput,clampExamDimension,deriveExamCrop,examOutputName} from "../src/lib/exam-upload-specs.ts";

test("separate profiles for signature thumb and declaration, with sources",()=>{
 assert.ok(EXAM_UPLOAD_PRESETS.find(x=>x.id==="ibps25-sign")?.maxKB===20);
 assert.deepEqual([EXAM_UPLOAD_PRESETS.find(x=>x.id==="ibps25-thumb")?.width,EXAM_UPLOAD_PRESETS.find(x=>x.id==="ibps25-thumb")?.height],[240,240]);
 assert.equal(EXAM_UPLOAD_PRESETS.find(x=>x.id==="rrb25-tech-sign")?.minKB,30);
 for(const p of EXAM_UPLOAD_PRESETS.filter(x=>x.agency!=="Custom"))assert.ok(p.source.startsWith("https://"));
});
test("byte-level output validation enforces bounds inclusively",()=>{
 const spec={width:140,height:60,minKB:10,maxKB:20,format:"jpeg"};
 assert.equal(validateExamOutput(10*1024,140,60,spec,"image/jpeg").passed,true);
 assert.equal(validateExamOutput(20*1024,140,60,spec,"image/jpeg").passed,true);
 assert.deepEqual(validateExamOutput(2*1024,120,60,spec,"image/png").issues.length,3);
 assert.equal(validateExamOutput(21*1024,140,60,spec,"image/jpeg").passed,false);
});
test("safe dimensions and crop never exceed source",()=>{
 assert.equal(clampExamDimension(90000),4000);
 assert.equal(clampExamDimension(-5),20);
 for(const [w,h,tw,th,z,x,y] of [[600,800,200,230,1,.5,.5],[1200,400,140,60,2,1,0],[300,300,240,240,4,0,1]]){
  const r=deriveExamCrop(w,h,tw,th,z,x,y);
  assert.ok(r.sx>=0&&r.sy>=0&&r.sw+r.sx<=w+1e-6&&r.sh+r.sy<=h+1e-6);
  assert.ok(Math.abs(r.sw/r.sh-tw/th)<1e-8);
 }
 assert.throws(()=>deriveExamCrop(200,100,140,60,0,.5,.5));
});
test("human readable names",()=>assert.equal(examOutputName("thumb","jpeg"),"airtools-exam-thumb.jpg"));
