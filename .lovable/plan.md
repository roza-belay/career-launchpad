# Career Launchpad audit and phased development plan

## Decision summary

Keep the existing application, email/password authentication, private account records, Swedish/English switching, and Pearl Sapphire / Midnight Chrome design. Extend working features rather than rebuild them. No application, database, authentication, storage, repository connection, or deployment changes were made during this audit.

The app is a substantial personal career-management platform with one AI feedback feature—not yet a complete AI career platform. Prioritize reliability and reusable AI foundations before adding more AI screens.

## What already works

### Existing features
- Job Application Tracker: application forms, search/filter/sort, table and Kanban views, status updates, salary/recruiter details, notes and demo-data handling.
- Follow-ups: due dates, history and message templates; the seven-day rule has helper tests and a database trigger.
- Job Opportunities: manually saved vacancies, filters and linking/moving to applications with duplicate-matching logic.
- Daily Planner: daily tasks, completions and weekly goals.
- CV & Documents: privately saved structured Swedish/English CV versions, editing, tailored copies, preview and browser print-to-PDF. This is not automated CV optimization or a general PDF/DOCX import feature.
- Portfolio & Projects: private project records, screenshots, links and recruiter-readiness checklist. The ready-to-publish flag does not publish a portfolio.
- Interview Preparation: question bank, tips, editable answers, practice status and AI feedback on a saved answer. Feedback is currently transient.
- Skills Development: self-assessed progress, categories, learning goals and recent updates—not an objective proficiency assessment.
- Career Growth Hub: six planning areas, completion progress and suggested next actions.
- Career profile: editable headline, summary and preferred roles.

### Verified in this audit
- All **44 tests passed across 10 test files** on 13 November 2026.
- All 11 main private pages opened in the owner's authenticated preview without page errors.
- No page-level horizontal overflow at 390px width, checked at 844px and 667px heights. This does not establish usability of every form/dialog or long user-entered value.
- Career Growth Hub rendered in English/light and Swedish/dark; saved Swedish/dark preferences survived reload in the test browser.
- Current database inventory reports **13 tables with RLS enabled**.
- Basic and deep security scans completed on 13 November 2026 with no findings. The separate available dependency-scan result has no findings but is marked out of date.
- Screenshot storage is private, with a 5 MiB bucket limit. Its allowed MIME-type list is unset.
- All five selected export screenshots are tracked: four Career Launchpad and one owner-supplied POS image. There are 163 tracked files in total.
- Authentication Site URL and allowed redirects currently target Lovable preview addresses.

### Verification boundaries
- Browser checks were read-only: no account records were created, edited or deleted, and no AI request was made to conserve credits.
- These checks used an authorized preview session; they did not test password sign-in, email confirmation, password recovery or a second user's isolation.
- No fresh production build was run. A successful production build was reported in the prior conversation, but current deployment notes still contain older results. No current build report was available. Live hosting remains unverified and nothing is published.

## What needs improvement

### Priority 1: avoid lost work and misleading results
1. **Read failures can appear as empty data.** Several pages default failed queries to empty arrays rather than showing an error and retry action. A connection failure can look like missing applications, CVs or progress.
2. **Multi-step saves can partly succeed.** Follow-up confirmation inserts history before updating the application; moving a vacancy creates an application before linking it. Failure between requests can leave inconsistent records.
3. **Screenshot cleanup is fragile.** Storage removal errors are ignored on some paths; uploads followed by failed record updates can leave orphan files. Add explicit recovery rather than treating those operations as complete.
4. **CV changes can be discarded.** Switching CV versions remounts the editor without an unsaved-change confirmation.
5. **Short-phone navigation is clipped.** At 390×667, Sign out extends below the visible menu (bottom 712px); the menu has no internal scrolling. At 390×844 it is visible.
6. **Growth items cannot edit title, notes or date after creation.** They support adding, status changes and deletion; add editing before presenting this as a mature planning tool.

### Priority 2: consistent reporting and scalable loading
- Most account collections load every column with no pagination; filters, totals and charts run in the browser. Large accounts can become slow or have incomplete totals if the service caps results. No live row-cap issue was reproduced.
- Project detail downloads the project collection to find one project; CV lists download full CV content. Fetch summaries and load details on demand.
- Demo records are included in dashboard metrics but excluded from one planner metric. Weekly date bounds and UTC/local “today” also differ across views.
- Consolidate duplicated mutation wrappers only when touching the affected feature; do not undertake a broad refactor.
- Add focused integration tests. Existing tests mostly protect pure helper rules, not authentication, failed saves, storage lifecycle, AI calls or PDF output.

### Design system
The shared semantic light/dark tokens, Sora headings, Manrope body, sapphire accents and pastel status colors are established. Keep them. Dark mode already reads as Midnight Chrome; light mode retains a pale lavender/pearl background. Premium quality should come from clearer states, trustworthy data and polished workflows—not another redesign. Later verify contrast, keyboard navigation, focus management, long text, short-screen menus and modal layouts in both themes.

## What is missing relative to your priorities

| Priority | Current foundation | Missing capability |
|---|---|---|
| AI Career Coach | Career profile, skills, goals and Growth Hub | Profile-aware conversation and actionable suggestions |
| AI CV Optimizer | Structured CVs, tailored copies and PDF export | Job-specific analysis, factual suggestions and reviewed edits |
| Job Application Tracker | Already implemented | Reliability improvements, document links and consistent metrics |
| AI Interview Simulator | Questions, answers and single-answer feedback | Multi-turn sessions, adaptive follow-ups and session summaries |
| Skills Gap Analysis | Self-assessed skills and vacancy descriptions | Requirement comparison with evidence, unknowns and linked goals |
| AI Cover Letter | Application details and CV facts | Draft generation, editing, saved versions and export |
| Career Progress Dashboard | Existing application dashboard and separate progress views | Unified career milestones and historical trends |

Voice interviews, automated job-board ingestion, subscriptions and payment plans are outside this proposed first development sequence.

## Security, files and GitHub

**Security status:** basic and deep scans completed with no findings. This is not a guarantee of security; the separate dependency result is out of date, and cross-account isolation was not exercised in this audit.

- Owner-scoped policies are present in the supplied schema, and live metadata confirms RLS is enabled. Second-account read/write isolation and linked-record ownership remain untested in this audit.
- CVs are structured account records, not a general uploaded-document library. Only the private project-screenshot bucket was found. There is no dedicated PDF/DOCX CV import workflow to validate yet.
- Screenshot upload code applies image/size checks, but the bucket has no MIME allow-list. Before adding CV upload, define allowed formats, server-side content validation, ownership, processing limits, deletion and retention. These are review requirements, not confirmed exploit findings.
- AI interview answers are sent to an AI service, although feedback is not saved by the app. Before expanding to full CVs, establish explicit disclosure/consent, minimal input sharing and retention expectations. Lack of local persistence is not proof of provider-side deletion.
- **Correction to earlier guidance:** the current `.gitignore` does **not** list `.env` or `.env.*`, and `.env` is tracked. Its supplied contents are public connection settings, not private API credentials. After approval, exclude future local secret files and remove the settings file from tracking without breaking managed configuration. This does not remove historical commits. The completed security scans did not report private-key exposure.
- The existing AI call runs through an authenticated server function; private AI credentials must remain server-side. Before wider rollout, verify request quotas, duplicate suppression, safe failures and budget controls.
- GitHub sync, repository privacy, GitHub App repository restrictions and remote file completeness cannot be read or changed by this agent. Verify these in **Project settings → Git** and on GitHub. Local tracked files do not prove remote synchronization.
- Leave the original `career-launchpad` repository untouched. Do not delete, rename, reconnect or create repositories as an audit workaround.

## Deployment and hosting readiness

The app is not static-only; hosting must serve its server entry and assets. Current configuration preserves the existing Lovable stack. No rebuild or framework replacement is needed.

Before release: verify the current production build through supported build diagnostics, Git sync, production secrets, published-origin auth redirects, sign-in/recovery, private reads/writes, upload/display, PDF output and AI feedback. Update deployment documentation with the actual verified release state. Do not replay historical migrations against the existing database. Publishing and database migration require separate authorization.

## Recommended database changes — proposals only

1. **Harden existing workflows first:** transactional, owner-scoped follow-up confirmation and vacancy linking; idempotency/uniqueness where appropriate. Preserve every existing record and the seven-day rule. Review actual query plans/indexes before adding indexes.
2. **Shared AI run records:** proposed `ai_runs` with owner, operation, source IDs/version, request key, status, model/prompt version and bounded usage metadata. Avoid storing raw CV text or full prompts by default; retention must be decided before persistence.
3. **Career conversations:** proposed owner-scoped conversation/message records only when persistent Career Coach history is approved.
4. **Reviewed generated documents:** retain `cv_documents`; add lineage/application links for tailored versions and an owner-scoped cover-letter store. Never overwrite the master CV automatically.
5. **Interview sessions/turns:** add only when building the simulator; separate simulated sessions from existing question-bank answers.
6. **Gap-analysis results:** link owner-scoped results to the relevant vacancy/CV version and existing learning goals. Mark absent evidence as unknown, not a fabricated skill score.
7. **CV file metadata/private bucket:** add only if PDF/DOCX import is approved, with format/size controls and lifecycle rules.
8. **Historical progress:** derive the first unified dashboard from existing records; introduce snapshots/events only when historical metrics actually require them.

Every new table must have owner-scoped RLS, explicit grants, tested cross-account isolation and ownership-safe references. Additive migrations only; no destructive migration or live data cleanup is approved.

## Phased implementation plan and credit-efficient order

### Phase 1 — reliability and release foundations
Refresh the out-of-date dependency check, then resolve secret-file exclusions, short-phone navigation, error/retry states, unsaved CV protection, growth editing and partial-save handling. Consolidate only duplicated code needed for these changes. Verify each flow and rerun affected tests. No redesign.

### Phase 2 — Skills Gap Analysis + shared AI foundation
Start with explicit vacancy requirements and existing skill/CV evidence; use deterministic comparison where sufficient and AI only for interpreting ambiguous text. Provide evidence and unknowns, then let the user create existing learning goals. Add a shared authenticated AI boundary with validation, bounded requests and agreed usage controls.

### Phase 3 — AI CV Optimizer, then AI Cover Letter
Reuse the same vacancy/CV context, editor and export patterns. Show suggestions/differences for review; save accepted CV changes as a new tailored version. Generate an editable letter from confirmed facts. Validate Swedish/English output against a small agreed sample set before expanding.

### Phase 4 — AI Interview Simulator
Extend existing questions and feedback into text-based sessions with adaptive follow-ups and a summary. Reuse shared AI controls; add voice only after the text experience is proven and separately approved.

### Phase 5 — AI Career Coach
Use the now-reliable profile, gap analysis, goals, applications and interview results as optional context. Offer suggestions, not automatic changes to personal records. Add saved conversation history only with an agreed retention policy.

### Phase 6 — integrated Career Progress Dashboard
Extend the existing dashboard rather than build another. Unify applications, learning goals, interview practice and roadmap milestones with consistent demo/date rules. Do not label self-reported progress as objective employability.

**Why this order:** reliability prevents rework; gap analysis establishes reusable job/skill context; CV optimization and cover letters share document logic; the simulator reuses existing interview feedback; the broader coach then has meaningful context. Most dashboard metrics can reuse existing data without new AI calls. No numerical credit-savings claim is made because workload and usage have not been measured.

## Approval scope

Approval should authorize **Phase 1 only**. The completed deep scan reported no findings; refresh the separate dependency check before choosing any package updates. Each later phase receives its own small plan and approval. Approval does not authorize changing authentication, publishing, broad GitHub access, deleting data or rebuilding existing pages.