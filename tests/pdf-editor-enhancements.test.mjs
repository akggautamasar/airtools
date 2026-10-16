import assert from "node:assert/strict";
import { test } from "node:test";
import { shiftPage, dropPage, isOriginalPageOrder, wrapCanvasText } from "../src/lib/pdf-editor-enhancements.ts";

test("rearranging pages preserves original references", () => {
  assert.deepEqual(shiftPage([0,1,2],1,1),[0,2,1]);
  assert.deepEqual(shiftPage([0,1,2],0,-1),[0,1,2]);
  assert.deepEqual(dropPage([2,0,1],1),[2,1]);
  assert.equal(isOriginalPageOrder([0,1,2],3),true);
  assert.equal(isOriginalPageOrder([0,2,1],3),false);
  assert.equal(isOriginalPageOrder([0,1],3),false);
  assert.throws(()=>dropPage([0],0));
  assert.throws(()=>dropPage([1,2],-1));
});
test("flattened text wrapping preserves explicit newlines", () => {
  assert.deepEqual(wrapCanvasText("one two three\nhello",8,(s)=>s.length),["one two","three","hello"]);
  assert.deepEqual(wrapCanvasText("alpha\n\nbeta",20,(s)=>s.length),["alpha","","beta"]);
});
