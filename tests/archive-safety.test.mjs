import { test } from "node:test";
import assert from "node:assert/strict";
import { safeZipName, validateZipEntries, ZIP_LIMITS } from "../src/lib/archive-safety.ts";
test("reject path traversal", () => {
  for (const p of ["../secret", "/secret", "C:\\secret", "folder/../secret", "folder//file", "evil\u0000file"]) assert.equal(safeZipName(p), null);
  assert.equal(safeZipName("docs/report.pdf"), "docs/report.pdf");
});
test("check expansion and count", () => {
  assert.doesNotThrow(() => validateZipEntries([{name:"readme.txt",compressedSize:5,uncompressedSize:20}], 100));
  assert.throws(() => validateZipEntries([{name:"bomb.txt",compressedSize:2,uncompressedSize:2e7}], 100));
  assert.throws(() => validateZipEntries([{name:"x",compressedSize:NaN,uncompressedSize:5}], 100));
  assert.throws(() => validateZipEntries([], ZIP_LIMITS.archiveBytes+1));
  assert.throws(() => validateZipEntries(Array.from({length:101}, (_,i)=>({name:"f"+i,compressedSize:1,uncompressedSize:1})), 500));
});
