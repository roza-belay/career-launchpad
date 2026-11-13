# AI CV Optimizer verification

Date: 13 November 2026. Verification only; no application source, dependencies, authentication, policies, schema, storage configuration, repository connections, deployment or publishing changes.

## Verified

- Signed-in browser upload of generated, fictional PDF and DOCX documents. Both extracted all 466 expected text characters, including React, TypeScript, dates 2024–2026 and 400 YH credits. No POST requests occurred during extraction before consent. Files were parsed in the browser.
- DOCX-extracted text was explicitly approved and structured by a real AI request. The reviewed fictional CV saved through the existing owner-scoped browser client, reopened after reload, and retained the candidate name and education.
- Real AI CV analysis used a short attributed excerpt from Effektify's Junior Frontend Developer advertisement: https://effektify.com/karriar/junior-frontend-developer/ . This is a real sample, not confirmation the vacancy remains open. Requirements included React, TypeScript, Next.js, APIs, usability, performance, collaboration and 0–2 years of experience.
- English analysis correctly separated supported React/TypeScript student-project experience from unproven Next.js, API integration, usability, performance and collaboration. Learning suggestions were conditional, not inserted qualifications.
- A reviewed profile wording suggestion was applied; a new tailored version saved and reopened after reload. Candidate identity and 400 YH credits remained intact. Original personal CV versions were not edited.
- Swedish AI analysis returned Swedish feedback. UI controls worked in English/light, English/dark, Swedish/light and Swedish/dark; language and theme persistence were checked after reload. Screenshots reviewed for English/light and Swedish/dark analysis. Browser page errors in the final verification script: zero.
- Live read-only policy inspection confirmed CV SELECT/INSERT/UPDATE/DELETE owner policies use auth.uid() = user_id, including write checks. RLS is enabled for CVs and selected career context tables. Context server reads also explicitly filter user_id.
- Newly created fictional saved rows were checked as belonging to the signed-in account, then removed using exact IDs and owner checks through the browser client. No other user's private rows were accessed. No pre-existing CV rows were removed.
- Anonymous browser CV reads were denied; the anonymous career AI streaming endpoint returned HTTP 401. Source inspection confirmed the CV AI task uses the existing authenticated middleware.
- Existing screenshot bucket remains private. No uploaded test document was stored in a file bucket.
- Full suite: **13 test files passed; 59 tests passed; 0 failed**, run at 10:26:19 UTC. Includes CV identity/date preservation, contact-field removal before AI sharing, request/file bounds, stream behavior, translations and existing career functions.

## Remaining issues and unverified claims

- No finite set of AI tests proves that it will **never** invent facts. No invented qualification, employer or paid experience was observed in the reviewed sample outputs. Prompts prohibit invention, but there is no semantic factual verifier. Editable profile/description/bullet replacements can still contain unsupported claims; date guards and protected structured fields alone do not prove factual correctness. User review remains necessary. Therefore the requested absolute non-invention guarantee has not passed.
- Privacy is not fully proven by one-account and anonymous checks. A controlled two-account test with synthetic records remains unperformed; no access to another user's information was attempted.
- Live privilege checks show anon, authenticated and service_role have table-level SELECT/INSERT/UPDATE/DELETE grants on CVs. Anonymous access is nevertheless blocked by enabled RLS and authenticated-only owner policies, as tested for reads. The anonymous grants are broader than needed; anonymous writes were not tested, and no grants or policies were changed.
- The optimizer's context picker displays a CV-version selector, but the request overrides cvId to undefined and uses the open CV draft. Selecting another version can make the sharing preview disagree with the actual request. No correction was made during this verification-only task.
- Optimization strips contact fields server-side before calling AI, not before the browser sends its request to the app server. Uploaded text can contain contact details and is sent to AI after consent without automatic redaction. Free-text personal information is not automatically removed; the interface warns users to review it.
- Contact fields deliberately blanked for AI are interpreted by the model as missing CV information in the sample analysis. This is misleading advisory feedback, not a missing-field change to the saved CV.
- The Swedish analysis offered Swedish replacement wording for an English-language CV. Applying such suggestions could mix document languages; tested Swedish output was not applied.
- PDF extraction and DOCX extraction both passed, but only DOCX-extracted text was separately structured and saved. PDF-specific structuring/save was not independently repeated after extraction because both formats feed the same reviewed-text pipeline.
- Scanned PDFs/OCR, encrypted documents, complex multi-column layouts, every malformed archive, cancellation/failure recovery and mobile/tablet layouts were not comprehensively browser-tested in this task. Existing bounds tests passed; these are not equivalent to every real-file scenario.
- Earlier browser-script failures were selector assumptions and a post-reload wait, not observed save failures. Corrected tests verified the actual save/reopen and preference flows. No app fixes were needed for those scripts.

## Conclusion

Core sampled import, analysis and private save/reopen flows are verified, with all existing tests passing. **CV functionality is not claimed fully verified**: universal factual accuracy, two-account isolation and the listed context/privacy/language limitations remain. No new development was started.