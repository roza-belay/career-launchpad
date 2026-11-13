# Phase 1 reliability and security review — 13 November 2026

## Scope and completed verification

No application logic, dependencies, authentication, database schema, policies, settings, or storage records were changed. No publication, deployment, repository connection, or remote repository operation was performed. This report and the roadmap record the review.

- Existing suite: **11 test files, 46 tests passed, 0 failed**, Vitest 4.1.11, 08:37 UTC.
- Signed-in browser checks simulated HTTP 503 reads for Growth Hub, Applications, CV Documents and Skills. Each displayed the appropriate translated warning; clicking Retry after restoring requests cleared the warning. Zero browser page errors in these four checks.
- Language/theme coverage: Growth Hub English/light desktop; Applications Swedish/dark at 1023×727; CV Documents English/dark desktop; Skills Swedish/light at 390×667. Element screenshots confirmed the warning and retry button fit.
- Warnings appeared after approximately 36–37 seconds and 16 failed requests, reflecting nested automatic retries. This delay is a remaining usability risk; no retry timing was changed.
- Untested: other individual pages, genuine network loss, expired-session recovery, failed writes, screenshot compensation failures, concurrent accounts, cross-tab writes, and recovery across reloads. These checks are not a full regression or penetration test.

## Dependency advisories

The fresh production-dependency scan checked 54 packages and returned **12 dependency-path rows**, representing **6 distinct advisory descriptions across 4 vulnerable packages**. Repeated dependency paths are not additional unique vulnerabilities. Development-only dependencies are excluded by this scanner.

| Vulnerable package/version | Severity and advisory | First patched version | Dependency paths/impact |
| --- | --- | --- | --- |
| source-map-js 1.2.1 | High: event-loop denial of service through indexed source-map offsets | 1.2.2 | Via @tailwindcss/vite 4.3.3; primarily source-map processing/build tooling. Exploitability was not demonstrated. |
| js-yaml 4.3.0 | High: quadratic CPU consumption in `!!omap` resolution; CVE-2026-59870 fix not backported | 4.3.1 | Via @tanstack/react-start 1.168.60; YAML processing. No app-authored YAML endpoint identified. |
| js-yaml 4.3.0 | High: empty merge sources bypass maxTotalMergeKeys CPU protection | 4.3.2 | Same dependency path; use at least 4.3.2 to address both advisories. A separate patched nested copy does not fix this copy. |
| zod 3.25.76 and nested 4.6.5 | High: memory exhaustion validating oversized constrained collections | 4.6.6 | Direct Zod and via Start/router-plugin. Moving direct Zod from v3 to v4 is a major compatibility change affecting validation/resolvers; do not blindly apply the scanner command. |
| seroval 1.6.8 | Moderate: code injection via a typed array's own constructor property | 1.6.11 | Via Router 1.170.41, Start 1.168.60 and router-plugin 1.168.42; potentially relevant to server/client serialization. |
| seroval 1.6.8 | Moderate: script injection via RegExp sources in serialized output | 1.6.10 | Same three paths; use at least 1.6.11 to address both. App exploitability was not demonstrated. |

No upgrades or suppressions were applied. Approval should cover scoped patched dependency resolution and compatibility testing, especially coordinated framework dependencies and the direct Zod major-version change. Do not replace framework versions or force overrides without checking compatibility.

## Git tracking and private files

- `.env` is currently tracked. Its entries were checked without printing values and contain only expected public connection configuration names. The current tracked text scan found no recognizable private-key, private backend-key, GitHub-token or JWT patterns.
- No tracked PDFs or upload/private/backup directory files were found. CV renderer/source tests and the CV schema migration are code, not private CV records. No literal CV insert was found in tracked SQL. The five intentionally selected export images remain tracked.
- The existing `.gitignore` does **not** exclude `.env`/`.env.*`, private exports, private key files or arbitrary personal uploads. Lovable refused an attempted edit because it manages this file; no part of that attempted patch was applied.
- There is no repository-local pre-commit hook. Pattern scanning is not a guarantee against arbitrary passwords, personal text, future files, forced additions or secrets already in Git history. A complete historical scan was not performed.
- **Accidental secret/personal-file commits cannot currently be guaranteed to be blocked.** Do not place secrets or account exports in the source tree. Secrets belong in the managed Secrets store. Owner/platform action is needed for managed exclusions; approved portable staged-file checks and provider-side secret protection would provide additional layers. Existing tracked environment files require a separate approved tracking decision; an ignore rule alone cannot untrack them.

## Isolation and security findings

- All 13 application tables have RLS enabled. Current authenticated policies constrain both visible rows and writes to `auth.uid() = user_id`. Table privileges also allow anonymous SELECT, but there are no anonymous application SELECT policies: RLS remains the boundary. Narrowing grants is optional defense-in-depth and was not performed.
- The screenshot bucket is private, limited to 5 MiB, with SELECT/INSERT/DELETE restricted to the authenticated user's first folder segment. The bucket has no server-side MIME allowlist. Browser MIME/size checks can be bypassed and are not content verification. Signed URLs last one hour and can be used by anyone possessing a still-valid link.
- The database linter returned four warnings: anonymous and authenticated execution grants on two SECURITY DEFINER signup functions (`seed_new_user`, `seed_skills_new_user`). Both return trigger, not ordinary RPC results; the warnings alone do not demonstrate a callable arbitrary-user write endpoint. The ordinary UUID-taking seed helpers are not executable by anon/authenticated. Consider revoking unnecessary trigger-function execution grants after approval and signup testing.
- Foreign keys between follow-ups/applications, vacancies/applications, learning goals/skills and task completions/tasks enforce parent existence, **not equal ownership**. Current owner policies constrain the child row but do not explicitly check the referenced parent's owner. Read-only checks found **zero existing ownership mismatches** across all four relationships. This is a structural write-integrity risk, not demonstrated cross-user reading. Fixing it requires separate database authorization and negative two-account tests.
- Fresh basic checks and the completed deep code scan reported no findings. This does not erase the independently reported dependency advisories or linter warnings; stored supply-chain scan results were older than this review.
- Two-account adversarial RLS tests were not performed, and authentication provider/settings behavior was not changed or reconfigured.

## Recovery still missing

`resumableWrite` retains a successful first step only while its browser component/hook remains mounted. Its two unit tests verify second-step retry without duplicate creation and concurrent-call deduplication in that scope.

- Follow-up history insertion and application last-contact update remain separate requests. The follow-up date trigger handles only the application row; it does not make both requests atomic.
- Vacancy application creation and vacancy linking remain separate requests. There is no durable idempotency key, transaction, or concurrency-safe application uniqueness guarantee; component reload/unmount and stale parallel requests can lose recovery state or race.
- Screenshot storage and project metadata are separate systems. Cleanup attempts can fail; deleting a file before a failed metadata update can leave a stale reference, and upload/link ambiguity can produce orphaned objects. There is no durable reconciliation job or recovery journal.
- Owner-checked database operations for atomic relational writes, durable idempotency, and storage reconciliation need a separately approved design. No database changes were attempted.

## Build and GitHub status — separate results

- `lovable build status --json` confirms the saved hosted **preview** build succeeded at **08:31:49 UTC**, serving commit `739c0f1`, in sync with the saved tip at the time checked. That is preview-build synchronization, **not GitHub synchronization**.
- A **fresh production build was not run**: this environment prohibits manually running project builds and exposes build-status/diagnostics but no production-build trigger. A successful preview build and passing tests do not prove production deployment readiness. Run `bun run build` in an approved external checkout, without deploying, to complete this requirement.
- GitHub connection, selected-repository permissions and remote commit receipt are **unverified**. Check Project settings → Git and the latest commit in the already-authorized repository. Do not disconnect/reconnect, create another repository, or alter the original `career-launchpad` repository.

## Approval/action required

1. Scoped dependency patch plan, with validation/framework compatibility review before installation.
2. Managed Git exclusion/tracking changes and optional staged-file/provider safeguards. No claim of universal secret prevention.
3. Database ownership checks, atomic relational writes and durable recovery/reconciliation design; current authorization explicitly excludes these changes.
4. Optional shorter automatic-retry policy: tested warnings currently take roughly 36–37 seconds.
5. External production-build verification and owner confirmation of existing GitHub sync/permissions. Neither requires publication.