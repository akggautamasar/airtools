import { test } from "node:test";
import assert from "node:assert/strict";
import { emptyFields, normalizePersonName, compareField, compareDocuments, parseSuggestedDate, suggestFieldsFromText, summarizeComparisons } from "../src/lib/consistency-radar.ts";

test("name normalization preserves script and removes separator differences", () => {
  assert.equal(normalizePersonName("  Arun  K. "), "ARUN K");
  assert.equal(normalizePersonName("शिव कुमार"), "शिव कुमार");
  assert.equal(compareField("fullName", "Arun Kumar", "ARUN  Kumar.").kind, "formatting");
  assert.equal(compareField("fullName", "Arun Kumar", "Kumar Arun").kind, "review");
  assert.equal(compareField("fullName", "Arun K", "Arun Kumar").kind, "review");
  assert.equal(compareField("fullName", "Arun Kumar", "Arun Kuman").kind, "review");
  assert.equal(compareField("fullName", "Arun Kumar", "Priya Singh").kind, "different");
  assert.equal(compareField("fullName", "", "Arun").kind, "missing");
});
test("dates are strictly checked and parsed in explicit ISO or DD/MM/YYYY", () => {
  assert.equal(parseSuggestedDate("29/02/2024"), "2024-02-29");
  assert.equal(parseSuggestedDate("29/02/2023"), null);
  assert.equal(parseSuggestedDate("2024-02-29"), "2024-02-29");
  assert.equal(parseSuggestedDate("31/04/2024"), null);
  assert.equal(parseSuggestedDate("02/03/2024"), "2024-03-02");
  assert.equal(compareField("dateOfBirth", "2024-03-02", "2024-02-03").kind, "different");
});
test("label-only candidates require review", () => {
  assert.deepEqual(suggestFieldsFromText("Full Name: Arun Kumar\nFather's Name: Raj Kumar\nDOB: 04/12/2001"), {
    fullName: "Arun Kumar", fatherName: "Raj Kumar", dateOfBirth: "2001-12-04",
  });
  assert.deepEqual(suggestFieldsFromText("DOB: 99/99/2024\nHello Arun"), {});
});
test("field matrix includes missing records and reference alignment", () => {
  const a = {id:"ref", label:"School certificate", fields: {...emptyFields(),fullName:"Arun Kumar",dateOfBirth:"2000-06-11"}};
  const b = {id:"other",label:"Application",fields:{...emptyFields(),fullName:"ARUN KUMAR",dateOfBirth:"2000-06-12"}};
  const result = compareDocuments([a,b], "ref");
  assert.equal(result.length, 4);
  assert.deepEqual(summarizeComparisons(result),{exact:0,formatting:1,review:0,different:1,missing:2});
  assert.throws(()=>compareDocuments([a,b],"unknown"));
  assert.throws(()=>compareDocuments([a],"ref"));
});
