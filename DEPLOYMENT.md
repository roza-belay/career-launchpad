# Career Launchpad — deployment preparation

## Status and GitHub

Intended repository: https://github.com/roza-belay/career-launchpad

The existing app is preserved. No database migrations, auth changes, new databases or deployments were performed. The POS image supplied and identified by the owner is attached to its existing private project. Selected export images are in `screenshots/`; CV records and other personal uploads remain in Cloud storage.

Git synchronization cannot be connected or verified by this agent. Check **Project settings → Git** in Lovable. If the intended repository is already connected, saved commits synchronize through Lovable. If it is not connected, Lovable cannot link an existing repository: connecting creates a new private repository. Do not disconnect an existing connection as a troubleshooting step; reconnecting creates another repository. No direct GitHub API writes or pushes were made.

## Source versus private data

Source includes `src/`, UI components, routes, translations, styles, dependency manifests and lockfile, Vite configuration, tests, and existing migrations and metadata in `drizzle/`. Dependencies and generated build output are not source deliverables. Install dependencies from the lockfile.

Database records and stored files are **not** inside Git. The app depends on the existing Lovable Cloud PostgreSQL database, account authentication, Data API, per-user RLS and private `project-screenshots` bucket. CVs, applications, career profiles, learning progress and answers remain private account records. Do not export signed image URLs or session tokens.

## Environment variables

Configure these through the external host, not committed local environment files. Values are intentionally omitted.

| Name | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL` | Build-time public backend endpoint used by the browser |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Build-time public publishable key; RLS remains mandatory |
| `SUPABASE_URL` | Server runtime endpoint of the same backend |
| `SUPABASE_PUBLISHABLE_KEY` | Server runtime publishable key |
| `VITE_SUPABASE_PROJECT_ID`, `SUPABASE_PROJECT_ID` | Existing integration metadata; preserve where the host requires it |

An unused generated privileged-client helper references `SUPABASE_SERVICE_ROLE_KEY`; current app pages do not use it. This credential is unavailable to export from Lovable Cloud and is not required for the existing owner-scoped browser flows. Never put a privileged key in a `VITE_` variable.

`LOVABLE_DB_MIGRATION_URL` is a migration/development credential, not an app runtime requirement. Do not replay migrations against the existing backend. The generated cron helper references `LOVABLE_CRON_SECRET` and `LOVABLE_CRON_SECRET_PREVIOUS`; no current app schedule endpoint uses it.

## External hosting and existing backend

The app can continue using its existing Lovable Cloud backend with the existing public connection configuration. Keep the Cloud project active and preserve its RLS and storage policies. External-host sign-in, password-reset and storage testing remains necessary. Confirmation/reset links need the deployment origin allowed in backend auth URL configuration; no settings were changed here.

This is a TanStack Start server-rendered app with a Worker-targeted build, not a static-only React site. Use hosting that serves the generated server entry and static assets. Do not upload only a static `dist` directory or replace the router. The configuration uses `@lovable.dev/vite-tanstack-config` and Nitro's Cloudflare target. Host-specific Worker bindings, asset serving, environment settings and domain configuration still need to be supplied after choosing a host. Inspect a fresh production build for its actual output paths before uploading.

Typical preparation in an external checkout:

```sh
bun install --frozen-lockfile
bun run test
bun run build
```

Lovable's automatic build diagnostics reported **build OK** at 2026-11-11 16:47:30 UTC. All **42 tests passed**. No manual production build was run in this sandbox; a production build and external-host execution remain **unverified**. The owner-confirmed POS image persisted after reload and loaded at its original 1344×768 dimensions. No browser page errors occurred in the screenshot capture flow. No deployment was performed.

## Security and outstanding verification

The existing tracked `.env` contains public backend connection configuration only, not private keys. Lovable manages `.gitignore` and refused changes to it, so exclusion of future local environment files could not be added here. Do not add private credentials to that tracked file. For an external checkout, exclude `.env` and `.env.*` before adding any local secrets. No account sessions, passwords, private CV records or signed storage URLs are included in the selected export files. A tracked-source scan found no recognizable private-key, secret-backend-key, GitHub-token or JWT patterns; this is a limited pattern check, not a full historical security audit.

Before deployment: verify Git sync and the latest commit in the intended repository, confirm `screenshots/` appears there, configure the host, inspect a successful production build, and test sign-in, password reset, private reads/writes, screenshot upload/display and CV PDF export on the chosen origin. Existing migrations document the schema; they must not be replayed on the live backend for this export.