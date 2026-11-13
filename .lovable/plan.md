# Career Launchpad — premium AI roadmap

## Scope and approval
Build only **AI Career Coach, AI CV Optimizer and AI Interview Simulator** after approval. Keep all current pages, email/password authentication, account records, Swedish/English support, Light/Dark Mode and Pearl Sapphire / Midnight Chrome styling. No publication, deployment or repository connection changes.

Resolved preferences: **single-session coaching and interview conversations, without saved history**, and **PDF + DOCX CV import**. Accepted goals and reviewed CV versions remain privately saved using existing account features; conversations, feedback and imported source files are not persisted.

Approval of this plan authorizes the three feature implementations and the specifically described dependency additions below. It does **not** authorize database, authentication, RLS or storage changes, security-package upgrades, major upgrades to existing dependencies, or Phase 2 work. If dependency compatibility cannot be established within this scope, stop and request a revised approval rather than substituting silently.

## Existing foundations to reuse
| Existing feature | Reuse |
|---|---|
| Private authenticated app shell | Navigation, account gate, short-screen menu and shared query-error/retry warning |
| Career profile, skills and learning goals | Optional, user-selected context for coaching; progress is self-reported, not measured employability |
| Career Growth Hub | Save reviewed action items into its existing roadmap area and track their actual completion |
| CV & Documents | Structured CV JSON, `CvEditor`, `CvSheet`, Swedish main/English international versions, tailored-copy saving and browser print-to-PDF |
| Saved Job Opportunities | Select an existing advertisement or paste one; no job-board integration or automatic URL fetching |
| Interview Preparation | Keep question bank, editable answers, practice status and existing single-answer AI feedback intact |
| AI Gateway integration | Installed SDK, generated model declarations, authenticated server boundary and existing bearer attachment |
| Shared design and translations | Existing controls, semantic colors, Sora/Manrope, dialogs, locale/date helpers and translation coverage tests |

Current code already has most data and editing foundations. It does not yet have CV file import, job-specific optimization, a career conversation or multi-turn simulated interviews. Previous dependency advisories and Git-exclusion concerns remain unresolved; this roadmap does not imply they are fixed.

## Phase 1 — build after approval

### 1. AI Career Coach
- Add a private **Career Coach** page at `/career-coach`; no duplicate dashboard or redesign.
- A single-session conversation helps clarify ambitions, constraints, preferred roles and next steps. Users preview/select which profile, skills and existing goals to share; absent information prompts questions rather than assumptions.
- Stream replies with a visible pending state, Stop control and preserved input/partial output on failure. Reset requires confirmation when conversation content would be lost.
- Show actionable suggestions as editable drafts. Users individually review and save chosen steps to existing Growth Hub roadmap records, then update status/dates through existing controls. No automatic record changes.
- Display progress from accepted goals only. No invented success probabilities, proficiency scores or guarantees.
- Warn before leaving a conversation with unsaved content. Reload/sign-out clears the session; no localStorage conversation history.

### 2. AI CV Optimizer
- Extend **CV & Documents** with import and an optimizer view, retaining its editor, preview, version controls and exports.
- Choose a saved CV, edit it, or import PDF/DOCX. Extract text locally in the browser, show it for correction, and request confirmation before sending it to AI or saving a structured version. Never treat extracted text as verified facts.
- Proposed import bounds: 5 MiB per file; PDF maximum 20 pages; bounded DOCX decompression/text extraction; extracted text maximum 60,000 characters. Encrypted, corrupt, oversized or unsupported files show actionable errors. Scanned/image-only PDFs require text to be pasted; OCR is not included.
- Imported source files are not uploaded to Cloud storage. Only the reviewed structured CV is saved when requested. No imported HTML rendering or active document content.
- Choose a saved vacancy or paste an advertisement. Analyze readability, sections, relevance and keywords, separating **supported evidence**, **missing/unknown evidence** and **possible learning needs**.
- Each wording suggestion identifies the original source and proposed replacement. Missing qualifications are questions or learning suggestions, never asserted experience.
- Review/edit changes before applying them to a draft; preserve names, dates, qualifications and factual statements. Save accepted edits as a new tailored CV, never overwrite the Swedish master or English international version automatically.
- Reuse PDF export. No ATS score claims, automatic applications or standalone Skills Gap Analysis in this phase.

### 3. AI Interview Simulator
- Add a private **Interview Simulator** page at `/interview-simulator`, linked from Interview Preparation; preserve the existing question bank and feedback.
- Select target role, Swedish/English, interview focus and optional reviewed CV/job context. Use a short text-based session of five questions by default, with clear progress and an explicit end action.
- Generate realistic questions; each submitted answer receives strengths, improvement points and a stronger outline grounded in the answer/context. Follow-up questions adapt to the response.
- Feedback drafts are editable/copyable. End-of-session summary identifies practiced topics and suggested next practice actions, not an objective hiring-readiness score.
- Users may explicitly save selected questions and their own reviewed answers to the existing question bank. AI feedback and the complete simulated session are not stored.
- Voice, video, recordings and persistent interview history are excluded.

## Pages and focused components
Technical details are proposals, not files to create before approval.
- New protected routes: `src/routes/_authenticated/career-coach.tsx` and `interview-simulator.tsx`.
- Extend `documents.tsx` and add focused `CvImport`, `CvOptimizer`, `CvSuggestionReview`, `CareerCoachConversation`, `CareerActionReview` and `InterviewSession` components.
- Shared AI consent/context preview, safe status/error presentation and native-stream adapter; no duplicate auth gate or broad mutation refactor.
- Reuse existing Button, form/dialog controls and tokens. Use AI Elements transcript/message/composer primitives for conversations, themed to match the app; keep their generated primitives scoped and preserve existing shared components.
- Every added content route receives its own title, description and social metadata. New UI and warnings are fully translated; user-entered content is never silently translated.

## Data, authentication and dependency approval
**No database schema, authentication, RLS or storage changes are proposed.** Existing owner-scoped `career_profiles`, `growth_items`, `cv_documents`, `vacancies`, `skills`, `learning_goals` and `interview_questions` suffice. Saving reviewed goals/CVs/questions creates ordinary private account records only after a user action; no demo backfill or migration.

**Dependency additions requiring approval:**
- Browser PDF extraction using `pdfjs-dist` and DOCX plain-text extraction using `mammoth` (browser build). Published candidates observed: 6.5.438 and 1.13.0. These add document parsers and transitive ZIP/XML dependencies; inspect advisories, browser compatibility, worker loading, extraction bounds and bundle cost before installation. They must not run as Node-only server parsers.
- AI Elements conversation, message, prompt-input and loading primitives. Registry inspection reports new supporting packages including `ai`, `use-stick-to-bottom`, `streamdown` and its rendering plugins, `nanoid`, and `motion`, plus local UI primitives. Audit the resolved versions before installation, decline shared-file overwrites and avoid unused additions where registry composition permits.
- Reuse the installed AI Gateway SDK; generate contracts for the selected model rather than editing generated types manually. No Vercel model-provider calls, alternate API keys or SDK swap.

These additions increase bundle size and dependency surface. Validate lazy loading of document parsers and chat-specific rendering. Any required upgrade to existing framework packages, incompatible dependency resolution or newly identified unmitigated parser risk needs another approval.

## AI integration and estimated requirements
- Use authenticated server functions for bounded CV analysis and structured results. Use authenticated server streaming routes for conversational responses; verify bearer identity inside every handler, since public API route prefixes alone provide no access protection.
- Use the current workspace default **`openai/gpt-6-astra` on Responses**. Catalog lookup confirmed workspace availability and zero-retention eligibility for that surface; no inference was run during planning. Preserve existing interview-feedback behavior during unrelated edits.
- Fetch selected saved records with the caller's RLS-scoped client and verify owner access before sending them. Treat pasted content as untrusted data. Never use an admin client to read ordinary user context.
- One explicit AI request per submitted coach message, CV analysis or interview turn; summaries require an explicit final request. Five interview answers plus initial question generation and final summary are approximately seven requests.
- Current catalog rates below 272,000 input tokens: **0.04 credits / 1,000 input tokens** and **0.20 credits / 1,000 output tokens**. Illustrative text-only request: 2,000 input + 1,000 output ≈ **0.28 credits**; 8,000 input + 2,000 output ≈ **0.72 credits**. Actual usage includes conversation/context and potentially billed reasoning; these are examples, not quotes or session caps.
- Bound accepted text/context, send only relevant sections, and do not regenerate on edits, navigation or background timers. No new embedding/search/image/voice services.
- Disable concurrent duplicate submissions; SDK safe retry behavior remains authoritative. Unknown outcomes are not automatically resent. Stop clears loading and retains partial output but does not promise remote cancellation or zero billing.
- No database-free implementation can promise durable cross-session deduplication or an account-wide spending cap. If durable quotas become necessary, propose their design separately before any schema change.

## Security and privacy
- Before the first request and whenever context selection changes, show exactly what categories of information will be sent. Exclude contact details, private links and unrelated records by default.
- Prompts distinguish source facts from suggested wording and ignore instructions embedded in CVs/advertisements. Validate structured responses and reject unexpected/oversized data; render output as safe text/markdown without raw HTML.
- No raw CVs, prompts, answers or model outputs in application logs, repository files, analytics or localStorage. Keep useful non-content request IDs for diagnosis only; verify gateway operational logging/retention before release rather than equating model zero retention with every system log.
- Server-only AI calls and secrets; preserve current CSRF protection and bearer middleware. Public unauthenticated requests cannot generate or read account content.
- Unsaved AI content is cleared on reset/sign-out/unmount; only user-confirmed goals, structured CVs and selected practice answers are persisted under existing owner policies.
- Existing dependency advisories, linked-record ownership concerns and cross-reload recovery limitations remain separate known risks, not resolved by adding these features.

## Testing and acceptance
- Run the full suite; last recorded baseline is **46 tests across 11 files**, to be rerun after changes, not treated as current verification.
- Add focused tests for file-size/page/text bounds, invalid PDF/DOCX, extraction failures, CV factual fields retained, review-only saves, five-question session sequencing, progress based on actual accepted goals, input validation and concurrent-submit guards.
- Test unsupported qualifications and prompt-injection examples; ensure suggestions do not auto-save unverified facts. Human review remains required because tests cannot guarantee factual AI output.
- Authenticated end-to-end flows: coach → edit/save goal → reload/read back; import → correct text → optimize against real sample advertisement → review/save tailored CV → reload/export; target-role interview → five answers/feedback → summary → optionally save reviewed practice answer.
- Verify session history disappears on reload and remains absent from storage. Test AI credit/denial/network/stream errors, cancellation and preservation of user work without automatic inference replay.
- Two-account synthetic fixtures verify existing-table read/write isolation and selected-source ownership; require authorized test accounts or an isolated draft, never access another person's real data.
- Check English/Swedish, both themes, desktop/tablet/short mobile screens, keyboard focus, long content and dialog scrolling. Exercise PDF output and parser worker loading in the actual preview.
- Inspect automatic preview-build diagnostics, run affected tests and lint, and record any production-build limitation honestly. Manual project builds are prohibited in this sandbox; release-build verification needs an authorized external environment. Do not deploy as a substitute.

## Phase 2 — roadmap only, not implemented
| Feature | Later scope | Reuse / prerequisites |
|---|---|---|
| 4. AI Cover Letter | Editable factual draft from reviewed CV + advertisement; private versions/export | CV optimizer context and factual-review controls; storage design needs separate approval |
| 5. Job Application Tracker | Improve the already implemented tracker rather than build another | Existing applications, Kanban, interviews and follow-ups; document linking, consistent metrics and transactional recovery reviewed separately |
| 6. Skills Gap Analysis | Dedicated target-role evidence comparison and prioritized learning goals | Existing skills/goals and CV/job evidence; mark unknowns, never fabricate proficiency |
| 7. Career Progress Dashboard | Extend the existing dashboard with accepted goals, learning and practice activities | Shared metric definitions first; any historical snapshots require a separate schema plan |

## Delivery order and checkpoints
1. Approve this plan and its scoped dependency additions; check resolved compatibility/security before installation.
2. Build shared consent, authenticated AI handling, stream/error states and source validation once.
3. Deliver Career Coach using existing goal tracking; verify the saved-goal flow.
4. Deliver CV import and optimizer; verify factual review, private tailored saves and PDF output.
5. Deliver Interview Simulator using the same context and AI controls; verify full session and optional answer save.
6. Run regression, privacy and multilingual/device checks; report completed work, exact test results and remaining risks. No publishing or Phase 2 work.