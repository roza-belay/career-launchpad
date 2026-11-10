<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules
- App pages live under `src/routes/_authenticated/` and read/write via the browser client with per-user RLS; why: private personal data, no server functions needed.
- Follow-up date logic lives in `src/lib/followup.ts` (tested) and a DB trigger mirrors it; why: one rule, enforced on every write.
- New users get demo rows (is_demo = true) from a signup trigger; why: demo data must be clearly separable from real data.
- UI strings live in `src/lib/i18n/messages.ts` (sv must cover every en key, tested) and are read via `usePrefs().t`; language/theme persist in localStorage and apply via a pre-hydration script; why: no i18n dependency, no theme flash.
- CVs are stored as structured JSON per version (`cv_documents.content`, shape in `src/lib/cv.ts`) and exported to PDF via the browser print dialog from a body-level portal copy of `CvSheet`; why: one renderer for preview and PDF, no PDF dependency.
- Portfolio projects live in `projects` (unique per user+title) with screenshots in the private `project-screenshots` bucket under `<user_id>/<project_id>/`, shown via signed URLs; checklist rules in `src/lib/portfolio.ts` (tested); why: private by default, `is_public` only records intent to publish later.
- Saved vacancies live in `vacancies`, entered manually (no job-board integration); moving one links `application_id`, reusing an existing application with the same job URL or company+title; filter/duplicate rules in `src/lib/vacancies.ts` (tested); why: no duplicate applications, status shown from the linked application.
