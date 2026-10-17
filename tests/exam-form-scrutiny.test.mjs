import {test} from "node:test";
import assert from "node:assert/strict";
import {
 blankScrutinyValues,classifyScrutinyDocument,compareScrutiny,normalizeScrutinyValue,
 SCRUTINY_FIELDS,safeValue,scrutinySummary,suggestScrutinyValues
} from "../src/lib/exam-form-scrutiny.ts";
const field=k=>SCRUTINY_FIELDS.find(f=>f.key===k);
const make=(kind,values,confirmed=true)=>({id:kind+Math.random(),kind,label:kind,values:{...blankScrutinyValues(),...values},confirmed});
test("extract labelled application preview fields; no guesses from unrelated unlabelled text",()=>{
 const s=suggestScrutinyValues(`Candidate Name : Kavita Singh
Date of Birth : 12/11/2000
Father's Name : Raj Singh
Category : Scheduled Caste
10th Roll Number : 180040
Email Address : kavita@example.invalid`);
 assert.equal(s.fullName,"Kavita Singh");
 assert.equal(s.dob,"2000-11-12");
 assert.equal(s.fatherName,"Raj Singh");
 assert.equal(s.category,"Scheduled Caste");
 assert.equal(s.class10Roll,"180040");
 assert.equal(s.email,"kavita@example.invalid");
 assert.equal(s.motherName,"");
});
test("both missing upload and no verified evidence are NOT checked",()=>{
 const form=make("form",{fullName:"Kavita Singh",dob:"12/11/2000",category:"SC"});
 const none=compareScrutiny(form,[]);
 assert.equal(none.find(x=>x.key==="category").status,"unchecked");
 assert.equal(none.find(x=>x.key==="dob").status,"unchecked");
 const unconfirmed=make("class10",{dob:"2000-11-12"},false);
 assert.equal(compareScrutiny(form,[unconfirmed]).find(x=>x.key==="dob").status,"unchecked");
 const confirmedBlank=make("class10",{},true);
 assert.equal(compareScrutiny(form,[confirmedBlank]).find(x=>x.key==="dob").status,"unchecked");
});
test("matched, mismatch, review, unchecked statuses reflect independent relevant evidence",()=>{
 const form=make("form",{fullName:"Kavita Singh",dob:"12/11/2000",category:"SC",class10Roll:"12345",email:"k@example.com"});
 const class10=make("class10",{fullName:"Kavita Singh",dob:"2000-11-13",class10Roll:"12345"});
 const caste=make("caste",{category:"Scheduled Caste"});
 const rows=compareScrutiny(form,[class10,caste]);
 assert.equal(rows.find(x=>x.key==="fullName").status,"match");
 assert.equal(rows.find(x=>x.key==="dob").status,"mismatch");
 assert.equal(rows.find(x=>x.key==="category").status,"match");
 assert.equal(rows.find(x=>x.key==="class10Roll").status,"match");
 assert.equal(rows.find(x=>x.key==="email").status,"unchecked");
 assert.equal(scrutinySummary(rows).mismatches,1);
});
test("two conflicting supporting records prevent false green",()=>{
 const form=make("form",{fullName:"Amit Kumar"});
 const a=make("aadhaar",{fullName:"Amit Kumar"});
 const b=make("class10",{fullName:"Amit Kumaar"});
 const result=compareScrutiny(form,[a,b]).find(x=>x.key==="fullName");
 assert.equal(result.status,"review");
});
test("name abbreviations are review, not automatically accepted",()=>{
 const form=make("form",{fullName:"Kavita S"});
 const doc=make("class10",{fullName:"Kavita Singh"});
 assert.equal(compareScrutiny(form,[doc]).find(x=>x.key==="fullName").status,"review");
});
test("form values must be manually confirmed",()=>{
 const form=make("form",{fullName:"Kavita Singh"},false);
 const doc=make("class10",{fullName:"Kavita Singh"});
 assert.equal(compareScrutiny(form,[doc]).find(x=>x.key==="fullName").status,"unchecked");
});
test("Aadhaar number is masked and compared by only last four digits",()=>{
 assert.equal(safeValue("aadhaarLast4","1234 5678 4321"),"XXXX-XXXX-4321");
 assert.equal(normalizeScrutinyValue(field("aadhaarLast4"),"XXXX-XXXX-4321"),"4321");
 const form=make("form",{aadhaarLast4:"XXXXXXXX4321"});
 const doc=make("aadhaar",{aadhaarLast4:"123456784321"});
 const row=compareScrutiny(form,[doc]).find(x=>x.key==="aadhaarLast4");
 assert.equal(row.status,"match");
 assert.equal(row.evidence,"XXXX-XXXX-4321");
});
test("classification uses filename heuristics, unknown goes other",()=>{
 assert.equal(classifyScrutinyDocument("My_Class_10_Marksheet.pdf"),"class10");
 assert.equal(classifyScrutinyDocument("masked_Aadhaar.pdf"),"aadhaar");
 assert.equal(classifyScrutinyDocument("proof.pdf"),"other");
});
test("parse invalid/missing dates as unchecked or review rather than false positive",()=>{
 const f=make("form",{dob:"32/13/2000"});
 const d=make("class10",{dob:"2000-01-01"});
 assert.equal(compareScrutiny(f,[d]).find(x=>x.key==="dob").status,"mismatch");
 assert.equal(suggestScrutinyValues("Date of Birth : 31/02/2000").dob,"");
});
