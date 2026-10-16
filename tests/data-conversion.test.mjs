import assert from "node:assert/strict";
import { test } from "node:test";
import { csvToJson, jsonToCsv, parseCsv } from "../src/lib/data-conversion.ts";
import { sniffFileSignature } from "../src/lib/file-signatures.ts";

test("CSV quotes, commas, embedded line breaks and BOM", () => {
 const text = '\uFEFFname,note\r\n"Anne, B.","line 1\nline ""2"""\r\n';
 const parsed = parseCsv(text);
 assert.equal(parsed.records[0].name, "Anne, B.");
 assert.equal(parsed.records[0].note, 'line 1\nline "2"');
 assert.deepEqual(JSON.parse(csvToJson(text).json), [{name:"Anne, B.",note:'line 1\nline "2"'}]);
});
test("CSV rejects malformed rows and duplicate headings", () => {
 assert.throws(() => parseCsv('x,x\n1,2'));
 assert.throws(() => parseCsv('a,b\n1'));
 assert.throws(() => parseCsv('a\n"unclosed'));
 assert.throws(() => parseCsv('a\n"x"z'));
});
test("JSON to CSV escapes commas and spreadsheet formulas", () => {
 const r = jsonToCsv(JSON.stringify([{ name: 'Test,"one"', input: '=2+2' }]));
 assert.match(r.csv, /"Test,""one"""/);
 assert.match(r.csv, /'=2\+2/);
 assert.equal(parseCsv(r.csv).records[0].input, "'=2+2");
 assert.equal(jsonToCsv('[{"n":3}]',false).csv, 'n\r\n3\r\n');
});
test("JSON to CSV rejects nested types", () => {
 assert.throws(() => jsonToCsv('[{"x":{"y":1}}]'));
 assert.throws(() => jsonToCsv('[42]'));
});
test("signature detection recognizes known headers and unknowns", () => {
 assert.equal(sniffFileSignature(new Uint8Array([0x25,0x50,0x44,0x46,0x2d])), "PDF document");
 assert.equal(sniffFileSignature(new Uint8Array([0x50,0x4b,0x03,0x04])), "ZIP archive / ZIP-based Office document");
 assert.match(sniffFileSignature(new Uint8Array([0,1,2,3])), /Unknown/);
});
