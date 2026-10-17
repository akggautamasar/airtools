import assert from "node:assert/strict";
import { test } from "node:test";
import { PASSPORT_PRESETS, mmToPixels, calculateCoverCrop, sheetLayout } from "../src/lib/photo-studio.ts";

test("official passport print size presets match their published dimensions", ()=>{
  const us = PASSPORT_PRESETS.find(x=>x.id==="us-passport");
  const uk = PASSPORT_PRESETS.find(x=>x.id==="uk-printed");
  assert.equal(us.widthMm,50.8);assert.equal(us.heightMm,50.8);
  assert.equal(uk.widthMm,35);assert.equal(uk.heightMm,45);
  assert.equal(uk.headMinMm,29);assert.equal(uk.headMaxMm,34);
});
test("millimetres are converted using 25.4 mm per inch at 300 DPI",()=>{
  assert.equal(mmToPixels(25.4,300),300);
  assert.equal(mmToPixels(50.8,300),600);
  assert.equal(mmToPixels(35,300),413);
  assert.throws(()=>mmToPixels(-1));
});
test("crop covers output ratio and remains fully within input bounds",()=>{
  for(const [w,h,ratio,zoom,x,y] of [[1200,800,1,1,.5,.5],[600,900,35/45,1.8,.2,.9],[3000,2000,1.5,3,1,0]]){
    const r=calculateCoverCrop(w,h,ratio,zoom,x,y);
    assert.ok(r.sx>=0&&r.sy>=0);
    assert.ok(r.sx+r.sw<=w+1e-5&&r.sy+r.sh<=h+1e-5);
    assert.ok(Math.abs(r.sw/r.sh-ratio)<1e-5);
  }
  assert.throws(()=>calculateCoverCrop(100,100,1,.5));
});
test("print sheet respects margins and correct physical sizes",()=>{
  const a=sheetLayout(35,45,210,297);
  assert.equal(a.count,a.cols*a.rows);
  assert.ok(a.count>=12);
  const b=sheetLayout(50.8,50.8,101.6,152.4);
  assert.ok(b.count>=1);
  assert.equal(sheetLayout(210,297,100,150).count,0);
});
