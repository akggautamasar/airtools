import assert from "node:assert/strict";
import {test} from "node:test";
import {ensureOutputSize,mimeForOutput,exportName,jpegPaddingBytes,addJpegPadding,setJpegDpi,inspectImageDpi,gridCells} from "../src/lib/image-workbench-engine.ts";
test("size and file types are bounded; no made-up browser AVIF export",()=>{
 assert.deepEqual(ensureOutputSize(300,400),{width:300,height:400});
 assert.throws(()=>ensureOutputSize(5000,5000));
 assert.equal(mimeForOutput("webp"),"image/webp");
 assert.equal(mimeForOutput("ico"),"image/png");
 assert.equal(exportName("hello.png","jpeg"),"hello-AirTools.jpg");
});
test("valid JPEG APP15 padding reaches target without corrupting SOI",()=>{
 const minimal=new Uint8Array([255,216,255,217]);
 const padded=addJpegPadding(minimal,100000);
 assert.equal(padded.length,100000);
 assert.deepEqual([...padded.slice(0,4)],[255,216,255,239]);
 assert.deepEqual([...padded.slice(-2)],[255,217]);
 assert.ok(jpegPaddingBytes(100000).chunks.length>0);
});
test("DPI update embeds valid JFIF and can be inspected",()=>{
 const base=new Uint8Array([255,216,255,217]);
 const image=setJpegDpi(base,300);
 assert.equal(inspectImageDpi(image),300);
 const updated=setJpegDpi(image,600);
 assert.equal(inspectImageDpi(updated),600);
});
test("grid layout rows and columns are consistent",()=>{
 assert.deepEqual(gridCells(10,3),{cols:3,rows:4});
 assert.deepEqual(gridCells(9,3),{cols:3,rows:3});
});
