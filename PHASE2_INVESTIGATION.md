# Limited Phase 2 investigation — 13 November 2026

## Completed work (investigation only)

Reviewed installed dependency manifests, published npm patch availability, existing signup functions/triggers and migration declarations, prior live read-only RLS findings, recovery code and Git safeguards. Ran the complete existing suite and exercised actual language/theme controls with reload persistence. No dependency installs, database writes, permission changes, authentication changes, Git index removals, repository connections or deployment occurred. Only documentation and roadmap changed.

### Dependency compatibility assessment

Six advisory descriptions remain outstanding; see PHASE1_SECURITY_REVIEW.md for severity and full descriptions. Published patch targets exist. Installed dependency ranges admit the following changes **without changing the direct framework versions**:

| Package | Proposed target | Installed consumers/ranges | Assessment |
| --- | --- | --- | --- |
| source-map-js 1.2.1 | 1.2.2 | PostCSS and @tailwindcss/node: `^1.2.1` | Patch satisfies existing ranges; addresses indexed-source-map denial of service. |
| js-yaml 4.3.0 | 4.3.2 | xmlbuilder2: `^4.1.1`; @eslint/eslintrc: `^4.3.0`; @redocly/openapi-core already pins 4.3.2 | Patch satisfies discovered ranges; covers both YAML CPU advisories. |
| seroval 1.6.8 | 1.6.11 | Router core, Start server/client/plugin core: `^1.6.7` | Patch satisfies existing ranges; covers both serialization injection advisories. Serialization compatibility still needs regression testing. |
| nested zod 4.6.5 | 4.6.6 | Router plugin/generator and Start plugin core: `^4.5.4` | Same-major patch satisfies existing ranges. Must target v4 consumers only, not force all Zod copies to v4. |
| direct zod 3.25.76 | No published newer stable v3 found | Project: `^3.25.76`; resolvers peer supports `^3.25.0 || ^4.0.0` | The scanner's 4.6.6 target is a major upgrade; explicitly deferred. No app-authored Zod imports were found in src, but resolver/library compatibility and package exports still require validation. Removal of an unused direct dependency is a separate option, not an automatic fix. |

This is a **manifest/registry compatibility assessment**, not proof that patched code passes production execution. No installed version changed. Proposed low-risk batch: resolve only the first four patch targets, retain React, Tailwind, Router/Start/plugin direct versions and direct Zod v3, inspect lockfile changes, run tests and a production build in a permitted environment, then rescan. Reject unrelated churn. Prefer targeted package resolution over global forced overrides; any scoped override must preserve each consumer's major version. Residual direct-Zod advisory remains until a separately approved v4 move or audited removal.

## Git security proposal — not applied

The tracked `.env` currently contains public connection configuration, not detected private keys. Existing tracked files have no PDF/account-upload directory exports. This does not prove the Git history or arbitrary personal text is clean.

Safest sequence, after explicit tracking approval and confirmation of Lovable's managed behavior:

1. Establish managed `.env`/`.env.*`, private-export directory and key-file exclusions. Lovable blocks agent edits to `.gitignore`; do not bypass through shell edits or local-only Git metadata.
2. Preserve necessary connection configuration in managed configuration and provide a **value-free** `.env.example` naming required variables.
3. Untrack `.env` with `git rm --cached -- .env` in an approved checkout, retaining the local working file. This stages removal from future commits, not deletion of the backend or credentials. Review the staged change before committing; don't use broad removal commands.
4. Verify ignored-path checks and verify the tracked file list no longer includes `.env`. Confirm Lovable will not restore managed tracked configuration on the next sync. Until that is verified, persistent untracking cannot be promised.
5. Add portable staged-file checks plus provider-side/CI checks for environment files, key material, tokens and private export paths. Local hooks are optional per checkout and bypassable; CI may run only after a push, so neither alone guarantees prevention. Do not blanket-exclude source files merely named CV or exclude the five approved export images.
6. Keep all personal files out of the source tree. Scan history without printing matches; if an actual credential was committed, rotate it first. History rewriting is not authorized and is not necessary for the current public-only configuration.

No exclusions or untracking were applied. No check can reliably identify every arbitrary password or personal document; use layered safeguards and review.

## Signup execution warnings — cause and proposed correction

Four linter warnings represent **two functions × two audiences**. `seed_new_user()` and `seed_skills_new_user()` return trigger and use SECURITY DEFINER for managed signup seeding. PostgreSQL grants new functions EXECUTE to PUBLIC by default; their declarations did not revoke that default. PUBLIC grants can make both anonymous and authenticated execution checks true even without explicit grants to those roles.

These trigger functions cannot be used as ordinary UUID-taking RPC functions; the warnings do not by themselves establish arbitrary-user write access. The UUID-taking seed helpers already have execution revoked from PUBLIC, anon and authenticated.

Safest proposed correction is narrowly revoke unnecessary execution on the **two trigger entry functions** from PUBLIC, anon and authenticated, while retaining bodies, owner, SECURITY DEFINER, triggers, helper permissions and required managed execution privileges. **Do not switch to SECURITY INVOKER**, which can break seeding writes. Before applying: inspect effective ACLs and trigger/function owners; verify expected managed-role access; test signup on an isolated backend. PostgreSQL documents EXECUTE as required to create/replace a trigger; preserve that capability for the managed role. Do not assume revocation is safe solely because triggers already exist.

Proposed SQL for review only, not executed:

```sql
REVOKE EXECUTE ON FUNCTION public.seed_new_user()
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.seed_skills_new_user()
  FROM PUBLIC, anon, authenticated;
```

After separate approval: apply through the supported database change workflow, verify ACLs/linter, test signup and seeded rows in isolation, and retain a narrowly scoped rollback restoring only prior required permissions. No live signup or record changes were performed.

## Data integrity and recovery proposal — not applied

- Existing RLS restricts each row's user_id, but single-column foreign keys do not enforce equal parent/child ownership. Prior read-only checks found zero current mismatches. Propose composite owner-aware foreign keys where supported: child `(parent_id, user_id)` references parent `(id, user_id)` after adding parent uniqueness and prechecking existing rows. Carefully preserve current CASCADE/SET NULL behavior: nullable links must not clear required user_id. Do not apply a generic SET NULL replacement. A narrowly scoped validation trigger is an alternative. No RLS changes proposed in this phase.
- Follow-up confirmation should eventually be one owner-scoped transactional operation: authenticate caller, validate application ownership, insert history, update last-contact, and let the existing date trigger run. Add durable request idempotency to prevent duplicates after ambiguous timeouts/reloads.
- Vacancy conversion should eventually atomically validate vacancy ownership, select/create an owner-scoped application with a concurrency-safe deduplication rule, and link it. Define normalization/uniqueness semantics before adding constraints; company/title matching can conflate legitimate repeat applications.
- Keep `resumableWrite` as a current in-session aid, not a transaction guarantee. Its state disappears on unmount/reload and cannot reconcile uncertain committed responses.
- Storage and relational metadata do not share a database transaction. Propose owner-scoped pending-operation records, validated upload attachment and durable reconciliation. For removals, record intent and retire metadata coherently before retryable file cleanup; do not irreversibly delete originals based on an ambiguous metadata response. This requires separate database/storage design approval.

## Privacy: two-account isolation test plan

**Plan only. Do not test against another real user's account or records.** No foreign session was minted, no second account was inspected, and no private records were accessed.

1. Obtain explicit approval for two dedicated synthetic test identities A/B in an isolated draft/test backend. Do not clone or import production private account data; schema-only setup and synthetic fixtures must be separately approved.
2. Create minimal synthetic rows for each of the 13 app tables and one synthetic image per test account. Record only test IDs in a temporary test manifest; sessions/tokens stay secret and origin-scoped.
3. Establish positive controls: A can read/update/delete A fixtures; B can access B fixtures. Test both UI and direct caller-scoped requests; bypassing hidden UI is essential.
4. Attempt only known synthetic cross-account IDs: SELECT/by-id/list must return no foreign rows; UPDATE/DELETE must affect zero foreign rows; INSERT/ownership reassignment must fail. Check synthetic parent-link attempts for the four relationships separately, as current parent existence checks may allow them even when foreign reads remain blocked.
5. Verify private storage list/download/sign/upload/delete denies another account's paths. Treat a deliberately issued still-valid signed URL as bearer access, not an RLS failure; don't persist or log it.
6. Repeat the synthetic requests anonymously. Exercise sign-out then account switching in separate contexts and ensure no prior-account cache appears. Never use real CVs, application notes or screenshots.
7. After separately approved fixes, inject second-step failures, refresh and concurrent requests; assert single synthetic result, correct ownership and consistent storage metadata. Signup tests must use dedicated disposable identities only.
8. Clean up only manifest-listed synthetic rows/files/identities with approval. Report pass/fail and counts, not personal data, credentials or signed URLs. Stop if unexpected real data is encountered.

## Verification and remaining risks

- Fresh existing suite at **08:46 UTC: 11 files, 46 passed, 0 failed**, Vitest 4.1.11.
- Real controls verified Swedish + dark, then English + light at **1023×727**; both preferences survived reload. Screenshots confirmed readable Pearl Sapphire/Midnight Chrome presentation; zero browser page errors. Combined with Phase 1 checks this is useful coverage, not every page/theme/language combination.
- No production build was run or deployment attempted; manual builds remain prohibited here.
- Dependencies remain vulnerable until installed patch validation. Managed exclusions remain unavailable; .env remains tracked. Database ownership/recovery and trigger-permission corrections remain proposals. Two-account privacy tests remain unexecuted.
- No GitHub connection, repository permissions, remote receipt or remote files were inspected or changed. GitHub synchronization remains unverified.

## Separate approvals requested before implementation

1. Same-major targeted patch batch (source-map-js, js-yaml, seroval, nested Zod v4 only), retaining direct Zod v3 and current framework versions.
2. Managed exclusions/approved `.env` untracking and staged-file safeguards, once platform compatibility is confirmed.
3. Narrow signup-trigger EXECUTE revocations after isolated signup verification; no authentication redesign.
4. Isolated synthetic two-account test environment/fixtures, then a separate ownership/transaction/idempotency/storage-reconciliation database plan. No production account data.
5. Direct Zod v4 or dependency removal only as a separate explicit decision after patch-batch validation.

References: npm package metadata at https://registry.npmjs.org/ ; PostgreSQL function security at https://www.postgresql.org/docs/current/sql-createfunction.html ; trigger creation privileges at https://www.postgresql.org/docs/current/sql-createtrigger.html .