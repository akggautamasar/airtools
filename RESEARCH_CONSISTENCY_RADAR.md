# AirTools opportunity research — Document Consistency Radar (16 Oct 2026)

## Problem people actually report
- A March 2026 Reddit post reports a passport rejection after the candidate's Class 10 marksheet name differed from Aadhaar/PAN. https://www.reddit.com/r/LegalAdviceIndia/comments/1ryijdy/passport_rejected_due_to_name_mismatch_in_10th/
- February 2026 UPSC registration discussion describes mismatched initials versus expanded names between a school record and Aadhaar. https://www.reddit.com/r/UPSCPrelims2026/comments/1rc2v52/name_mismatch_in_upsc_otr_10th_marksheet_vs/
- September 2026 discussions describe names varying across identity records, passports, banks and education certificates. https://www.reddit.com/r/LegalAdviceIndia/comments/1wg4njs/name_mismatch_across_id_proofs/
- A June 2026 SSC community checklist warns that small spelling differences between application and school certificate details may create document-verification issues. https://www.reddit.com/r/ssc/comments/1ty79gk/5_crucial_mistakes_to_avoid_when_filling_out/

## Market reality
- We cannot establish that no similar tool exists. A GitHub prototype describes cross-document name, DOB and gender consistency using OCR and fuzzy matching: https://github.com/Lonekaiser04/Verishield-ai
- Generic document diff and conflict-check tools also exist. The opportunity is a purpose-built, simple, privacy-conscious **user-confirmed** workflow for application records, not a claim of global novelty.
- Quora pages were not accessible due to crawling restrictions, so no Quora testimonials are claimed.

## Product hypothesis
People need help *before* submitting identity/application documents: review a known-authoritative reference (e.g., the certificate specified by the relevant application), compare entered names, DOB, and parent names against other records, distinguish punctuation differences, reordered words, expanded initials, and substantive differences, then prepare a private review report.

## Working MVP design
1. Start from fictional records, files (PDF/DOCX/TXT/image), or fully manual entries.
2. Read selectable PDF/DOCX/TXT text locally; make **suggestions** only from labelled lines. For images, optional local English OCR with a downloadable model.
3. Have the user confirm each field and select the correct reference document.
4. Compare field-by-field with explainable outcomes: exact, formatting only, requires review, different, missing. A similar name is never deemed legally equivalent.
5. Display discrepancies and export TXT/JSON with names/dates omitted by default.

## Honesty, safety and limitations
- No database, no login, no identity records sent to a server by the processor. OCR language assets may download.
- Not a legal identity verifier, not a fraud/forgery detector, not a government portal integration, and not a promise of acceptance.
- The tool cannot tell which source is legally authoritative or prove that two different spellings are the same person.
- Scanned PDFs are not OCRed in this MVP. PDF source suggestion extraction reads only the first 25 pages and only textual parts of source files.
- Filenames, previews and fields exist in the tab's memory; reports can contain personal data if the explicit option is checked.
- Never store user data via analytics. Test with synthetic fixtures, not real Aadhaar/PAN files.

## Follow-up experiments
- Ask volunteers with **synthetic** records to evaluate false matches / false flags and time saved.
- Add Hindi OCR only with clear language and device-performance controls.
- Build supported correction-request template drafting, not legal advice, in a later iteration.
- Consider optional exact portal-specific comparison rules verified against official current notices.
