import { compareField, parseSuggestedDate } from "./consistency-radar.ts";

export const DOC_KINDS = [
  { id:"class10", label:"Class 10 / Matriculation marksheet" },
  { id:"class12", label:"Class 12 / Intermediate marksheet" },
  { id:"aadhaar", label:"Masked Aadhaar / identity document" },
  { id:"diploma", label:"Diploma certificate / marksheet" },
  { id:"graduation", label:"Graduation certificate / marksheet" },
  { id:"caste", label:"SC / ST / OBC certificate" },
  { id:"ews", label:"EWS certificate" },
  { id:"domicile", label:"Domicile certificate" },
  { id:"pwd", label:"Disability / PwD certificate" },
  { id:"other", label:"Other supporting record" },
] as const;
export type DocKind = (typeof DOC_KINDS)[number]["id"];
export type FieldKind = "name"|"date"|"number"|"category"|"gender"|"text"|"last4"|"year";
export type FieldSpec = {
  key: string; label: string; type: FieldKind;
  sources: readonly DocKind[]; labels: readonly string[];
  optional?: boolean;
};
/** Compare only fields for which an appropriate supporting document exists.
 * These names are suggestions, never guaranteed labels for every agency. */
export const SCRUTINY_FIELDS: readonly FieldSpec[] = [
  {key:"fullName",label:"Candidate full name",type:"name",sources:["class10","class12","aadhaar","diploma","graduation","other"],labels:["candidate name","applicant name","full name","student name","name of candidate","name of applicant","name as per matric","name"]},
  {key:"dob",label:"Date of birth",type:"date",sources:["class10","aadhaar","other"],labels:["date of birth","birth date","dob","d.o.b."]},
  {key:"fatherName",label:"Father / guardian name",type:"name",sources:["class10","class12","aadhaar","diploma","other"],labels:["father's name","fathers name","name of father","father name","parent name","parent's name"]},
  {key:"motherName",label:"Mother's name",type:"name",sources:["class10","class12","aadhaar","other"],labels:["mother's name","mothers name","name of mother","mother name"]},
  {key:"gender",label:"Gender",type:"gender",sources:["aadhaar","class10","other"],labels:["gender","sex"]},
  {key:"category",label:"Reservation category",type:"category",sources:["caste","ews"],labels:["caste category","community category","category claimed","reservation category","social category","category"]},
  {key:"aadhaarLast4",label:"Aadhaar last 4 digits",type:"last4",sources:["aadhaar"],labels:["aadhaar number","aadhaar no","aadhar number","aadhar no","uid number","last four digits of aadhaar","aadhaar"]},
  {key:"class10Roll",label:"Class 10 roll number",type:"number",sources:["class10"],labels:["matriculation roll number","matric roll no","10th roll number","class 10 roll number","high school roll number","secondary roll number"]},
  {key:"class10Year",label:"Class 10 passing year",type:"year",sources:["class10"],labels:["matriculation passing year","10th passing year","class 10 passing year","high school passing year"]},
  {key:"class10Board",label:"Class 10 board",type:"text",sources:["class10"],labels:["matriculation board","10th board","class 10 board","high school board"]},
  {key:"class12Roll",label:"Class 12 roll number",type:"number",sources:["class12"],labels:["12th roll number","class 12 roll number","intermediate roll number","higher secondary roll number"]},
  {key:"class12Year",label:"Class 12 passing year",type:"year",sources:["class12"],labels:["12th passing year","class 12 passing year","intermediate passing year"]},
  {key:"diplomaRoll",label:"Diploma roll / enrollment number",type:"number",sources:["diploma"],labels:["diploma roll number","diploma enrollment number","diploma enrolment number"]},
  {key:"diplomaYear",label:"Diploma passing year",type:"year",sources:["diploma"],labels:["diploma passing year"]},
  {key:"graduationYear",label:"Graduation passing year",type:"year",sources:["graduation"],labels:["graduation passing year","degree passing year"]},
  {key:"domicileState",label:"Domicile state",type:"text",sources:["domicile"],labels:["domicile state","state of domicile","domicile"]},
  {key:"pwdStatus",label:"Disability / PwD claim",type:"text",sources:["pwd"],labels:["p w d status","pwd status","person with benchmark disability","disability status","disability"]},
  {key:"ewsStatus",label:"EWS claim",type:"text",sources:["ews"],labels:["ews status","economically weaker section","ews claim","ews"]},
  {key:"email",label:"Email address (manual review)",type:"text",sources:[],labels:["email address","e-mail id","email id","email"],optional:true},
  {key:"mobile",label:"Mobile number (manual review)",type:"text",sources:[],labels:["mobile number","phone number","contact number","mobile"],optional:true},
] as const;

export type Values = Record<string,string>;
export interface ScrutinyRecord {
  id:string; kind:DocKind|"form"; label:string;
  values:Values; confirmed:boolean; extracted?:boolean;
}
export type ScrutinyStatus = "match"|"mismatch"|"review"|"unchecked";
export interface ScrutinyResult {
  key:string; label:string; status:ScrutinyStatus;
  submitted:string; evidence:string;
  sources:string[]; explanation:string;
}
export function blankScrutinyValues():Values {
  return Object.fromEntries(SCRUTINY_FIELDS.map(f=>[f.key,""]));
}
const scrub = (text:string)=>text.replace(/\s+/g," ").trim().slice(0,130);
const escapeRx=(s:string)=>s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
const isAadhaar=(key:string)=>key==="aadhaarLast4";
export function safeValue(key:string,value:string):string {
  if(isAadhaar(key)) {
    const last=value.replace(/\D/g,"").slice(-4);
    return last.length===4 ? "XXXX-XXXX-"+last : "";
  }
  return scrub(value);
}
export function normalizeScrutinyValue(field:FieldSpec,value:string):string {
  const raw=scrub(value).normalize("NFKC");
  if(field.type==="date")return parseSuggestedDate(raw)||"";
  if(field.type==="last4")return raw.replace(/\D/g,"").slice(-4);
  if(field.type==="number")return raw.toUpperCase().replace(/[\s/-]/g,"");
  if(field.type==="year")return /^\d{4}$/.test(raw)?raw:raw.toUpperCase();
  if(field.type==="category"){
    const category=raw.toUpperCase().replace(/[^A-Z]/g,"");
    if(["SC","SCHEDULEDCASTE"].includes(category))return "SC";
    if(["ST","SCHEDULEDTRIBE"].includes(category))return "ST";
    if(["OBC","OTHERBACKWARDCLASS","OTHERBACKWARDCLASSES","OBCNCL"].includes(category))return "OBC";
    if(["GENERAL","UNRESERVED","UR","GEN"].includes(category))return "UR";
    if(["EWS","ECONOMICALLYWEAKERSECTION"].includes(category))return "EWS";
    return category;
  }
  if(field.type==="gender"){
    const g=raw.toUpperCase().replace(/[^A-Z]/g,"");
    if(["M","MALE"].includes(g))return "MALE";
    if(["F","FEMALE"].includes(g))return "FEMALE";
    return g;
  }
  return raw.toLocaleUpperCase("en").replace(/[^\p{L}\p{N}]+/gu," ").trim().replace(/\s+/g," ");
}

/** Conservative label-led extraction. Never guess a name from an unrelated paragraph. */
export function suggestScrutinyValues(text:string):Values {
  const found=blankScrutinyValues();
  const rows=text.slice(0,100_000).split(/\r?\n/).map(scrub).filter(Boolean);
  for(let i=0;i<rows.length;i++){
    const line=rows[i];
    if(line.length>240)continue;
    for(const field of SCRUTINY_FIELDS){
      if(found[field.key])continue;
      for(const alias of [...field.labels].sort((a,b)=>b.length-a.length)){
        // The label must start the line, or follow an ordinary form-row prefix.
        const re=new RegExp("^(?:[0-9]{1,3}[.)]\\s*)?"+escapeRx(alias).replace(/\\ /g,"\\s+")+"\\s*(?:[:：=–-]\\s*|\\s{2,})(.*)$","i");
        const m=line.match(re);
        if(!m)continue;
        let candidate=m[1]?.trim()||"";
        if(!candidate && i+1<rows.length && rows[i+1].length<=100)candidate=rows[i+1];
        candidate=candidate.replace(/\s+(?:father(?:'?s)? name|mother(?:'?s)? name|dob|date of birth)\s*[:=].*$/i,"").trim();
        if(candidate.length<1 || candidate.length>105)continue;
        if(field.type==="date")candidate=parseSuggestedDate(candidate.match(/\d{4}-\d{1,2}-\d{1,2}|\d{1,2}[\/.-]\d{1,2}[\/.-]\d{4}/)?.[0]?.replace(/\./g,"/")||"")||"";
        if(field.type==="last4")candidate=safeValue(field.key,candidate);
        if(field.type==="year")candidate=candidate.match(/\b(?:19|20)\d{2}\b/)?.[0]||"";
        if(field.key==="mobile")candidate=candidate.replace(/[^\d+]/g,"").slice(0,16);
        if(field.key==="email")candidate=candidate.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/)?.[0]||"";
        if(candidate)found[field.key]=scrub(candidate);
        break;
      }
    }
  }
  return found;
}
export function classifyScrutinyDocument(name:string):DocKind {
  const n=name.toLowerCase();
  if(/aadhaar|aadhar|uid/.test(n))return "aadhaar";
  if(/10th|class.?10|matric|high.?school|ssc.?mark/.test(n))return "class10";
  if(/12th|class.?12|intermediate|hssc/.test(n))return "class12";
  if(/diploma|polytechnic/.test(n))return "diploma";
  if(/degree|graduat|btech|b\.tech|bsc|b\.sc/.test(n))return "graduation";
  if(/caste|community|obc|scheduled.?caste|scheduled.?tribe/.test(n))return "caste";
  if(/ews/.test(n))return "ews";
  if(/domicile|residen/.test(n))return "domicile";
  if(/disability|pwd|udid/.test(n))return "pwd";
  return "other";
}
export function compareScrutiny(form:ScrutinyRecord,documents:ScrutinyRecord[]):ScrutinyResult[] {
  return SCRUTINY_FIELDS.map(field=>{
    const raw=scrub(form.values[field.key]||"");
    const submitted=safeValue(field.key,raw);
    if(!form.confirmed || !raw)return {
      key:field.key,label:field.label,status:"unchecked",submitted,evidence:"",
      sources:[],explanation:raw?"Confirm the extracted application value before checking.":"Application value not detected or provided; inspect the preview manually.",
    };
    const relevant=documents.filter(d=>field.sources.includes(d.kind as DocKind));
    if(!relevant.length)return {
      key:field.key,label:field.label,status:"unchecked",submitted,evidence:"",
      sources:[],explanation:field.optional?"No independent supporting-document check is available for this field. Verify on the original application screen.":"No relevant supporting document uploaded. This field was NOT checked.",
    };
    if(relevant.some(d=>!d.confirmed))return {
      key:field.key,label:field.label,status:"unchecked",submitted,evidence:"",
      sources:relevant.map(d=>d.label),explanation:"Confirm all relevant certificate values before comparison; OCR suggestions alone are not evidence.",
    };
    const populated=relevant.filter(d=>scrub(d.values[field.key]||""));
    if(!populated.length)return {
      key:field.key,label:field.label,status:"unchecked",submitted,evidence:"",
      sources:relevant.map(d=>d.label),explanation:"Relevant document uploaded but this field was not readable/confirmed. Check it manually.",
    };
    const expected=populated.map(d=>normalizeScrutinyValue(field,d.values[field.key]));
    const actual=normalizeScrutinyValue(field,raw);
    const evidence=populated.map(d=>safeValue(field.key,d.values[field.key])).join(" / ");
    const sources=populated.map(d=>d.label);
    if ((field.type==="date" && (!actual || expected.some(v=>!v))) ||
        (field.type==="last4" && (actual.length!==4 || expected.some(v=>v.length!==4)))) return {
      key:field.key,label:field.label,status:"review",submitted,evidence,sources,
      explanation:"Invalid or incomplete date/identifier detected. Inspect the original record; this cannot be marked as matched.",
    };
    if(new Set(expected).size>1)return {
      key:field.key,label:field.label,status:"review",submitted,evidence,sources,
      explanation:"Supporting records disagree with each other. Check originals and the examination-specific instructions before making changes.",
    };
    if(expected[0]===actual)return {
      key:field.key,label:field.label,status:"match",submitted,evidence,sources,
      explanation:"Confirmed text matches after normalisation. This does not prove document authenticity or portal acceptance.",
    };
    if(field.type==="name"){
      const result=compareField(field.key==="dob"?"dateOfBirth":field.key==="fatherName"?"fatherName":field.key==="motherName"?"motherName":"fullName",populated[0].values[field.key],raw);
      if(result.kind==="review"||result.kind==="formatting")return {
        key:field.key,label:field.label,status:"review",submitted,evidence,sources,
        explanation:result.explanation,
      };
    }
    return {
      key:field.key,label:field.label,status:"mismatch",submitted,evidence,sources,
      explanation:"Confirmed application entry differs from the supporting record. Verify both originals and correct the form if necessary.",
    };
  });
}
export function scrutinySummary(rows:ScrutinyResult[]){
  return {
    matches: rows.filter(r=>r.status==="match").length,
    mismatches: rows.filter(r=>r.status==="mismatch").length,
    review: rows.filter(r=>r.status==="review").length,
    unchecked: rows.filter(r=>r.status==="unchecked").length,
  };
}
