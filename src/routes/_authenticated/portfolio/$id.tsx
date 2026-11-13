import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ArrowLeft, Check, Pencil, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { ProjectForm } from "@/components/app/portfolio/ProjectForm";
import { ProjectLinks, ProjectStatusBadge, ReadyProgress, TechTags } from "@/components/app/portfolio/ProjectBits";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useProjectMutation, useProjects, useScreenshotUrls } from "@/lib/data";
import { usePrefs } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/messages";
import { manualChecks, projectChecklist, SCREENSHOT_BUCKET, type ManualCheck, type Project } from "@/lib/portfolio";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/portfolio/$id")({
  head: () => ({ meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { title: "Project details — Career Launchpad" }, { name: "description", content: "Project details, screenshots, links and recruiter-ready checklist." }, { property: "og:title", content: "Project details" }, { property: "og:description", content: "Project details, screenshots, links and recruiter-ready checklist." }] }),
  component: ProjectPage,
});

function ProjectPage() {
  const { id } = Route.useParams();
  const { t } = usePrefs();
  const { data: projects, isLoading } = useProjects();
  const p = projects?.find((x) => x.id === id);
  const back = <Link to="/portfolio" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"><ArrowLeft className="size-4" />{t("pf.back")}</Link>;
  if (isLoading) return <p className="text-sm text-muted-foreground">{t("common.loading")}</p>;
  if (!p) return <>{back}<p className="card-soft p-6 text-sm text-muted-foreground">{t("pf.notFound")}</p></>;
  return <>{back}<ProjectDetail project={p} /></>;
}

function Section({ title, children }: { title: MessageKey; children: React.ReactNode }) {
  const { t } = usePrefs();
  return <section className="card-soft p-5"><h2 className="mb-3 text-base font-semibold">{t(title)}</h2>{children}</section>;
}

function ProjectDetail({ project: p }: { project: Project }) {
  const { t, date } = usePrefs();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [delOpen, setDelOpen] = useState(false);
  const none = <p className="text-sm text-muted-foreground">{t("pf.nothing")}</p>;
  const text = (s: string | null) => s ? <p className="whitespace-pre-line text-sm leading-relaxed">{s}</p> : none;

  const del = useProjectMutation(async () => {
    if (p.screenshots.length) {
      const { error } = await supabase.storage.from(SCREENSHOT_BUCKET).remove(p.screenshots);
      if (error) throw new Error(t("pf.cleanupFailed"));
    }
    return supabase.from("projects").delete().eq("id", p.id);
  }, "common.deleted");
  const toggle = useProjectMutation(async ({ key, value }: { key: ManualCheck; value: boolean }) =>
    supabase.from("projects").update({ checklist: { ...manualChecks(p.checklist), [key]: value } }).eq("id", p.id));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold sm:text-3xl">{p.title}</h1>
            <ProjectStatusBadge status={p.status} />
            <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">{t(p.is_public ? "pf.toPublish" : "pf.private")}</span>
          </div>
          {p.category && <p className="text-sm font-medium text-muted-foreground">{p.category}</p>}
          {p.short_description && <p className="max-w-2xl text-muted-foreground">{p.short_description}</p>}
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setEditOpen(true)}><Pencil className="size-4" />{t("common.edit")}</Button>
          <Button variant="outline" onClick={() => setDelOpen(true)}><Trash2 className="size-4" />{t("common.delete")}</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-6">
          <Screenshots project={p} />
          <Section title="pf.f.description">{text(p.description)}</Section>
          <Section title="pf.f.features">
            {p.features.length ? <ul className="list-disc space-y-1 pl-5 text-sm">{p.features.map((f) => <li key={f}>{f}</li>)}</ul> : none}
          </Section>
          <Section title="pf.f.role">{text(p.role)}</Section>
          <Section title="pf.f.challenges">{text(p.challenges)}</Section>
        </div>
        <aside className="space-y-6">
          <Section title="pf.checklist">
            <ReadyProgress project={p} />
            <ul className="mt-4 space-y-2.5">
              {projectChecklist(p).map((i) => (
                <li key={i.key} className="flex items-center gap-2.5 text-sm">
                  {i.manual
                    ? <Checkbox id={`ck-${i.key}`} checked={i.done} disabled={!i.enabled || toggle.isPending} onCheckedChange={(v) => toggle.mutate({ key: i.key as ManualCheck, value: v === true })} />
                    : <span className={cn("flex size-4 items-center justify-center rounded-sm border", i.done ? "border-primary bg-primary text-primary-foreground" : "border-input")}>{i.done && <Check className="size-3" />}</span>}
                  <label htmlFor={i.manual ? `ck-${i.key}` : undefined} className={cn(!i.enabled && "text-muted-foreground")}>{t(i.label)}</label>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">{t("pf.checklistHint")}</p>
          </Section>
          <Section title="pf.f.tech">{p.technologies.length ? <TechTags tech={p.technologies} /> : none}</Section>
          <Section title="pf.links">{p.github_url || p.demo_url || p.docs_url ? <ProjectLinks project={p} /> : <p className="text-sm text-muted-foreground">{t("pf.noLinks")}</p>}</Section>
          <Section title="pf.dates">
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <dt className="text-muted-foreground">{t("pf.f.start")}</dt><dd>{date(p.start_date)}</dd>
              <dt className="text-muted-foreground">{t("pf.f.end")}</dt><dd>{date(p.end_date)}</dd>
            </dl>
          </Section>
        </aside>
      </div>

      <ProjectForm open={editOpen} onOpenChange={setEditOpen} project={p} onSaved={() => toast.success(t("pf.saved"))} />
      <AlertDialog open={delOpen} onOpenChange={setDelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{t("pf.deleteTitle")}</AlertDialogTitle><AlertDialogDescription>{t("pf.deleteText", { n: p.title })}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => del.mutate(undefined, { onSuccess: () => navigate({ to: "/portfolio" }) })}>{t("common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Screenshots({ project: p }: { project: Project }) {
  const { t } = usePrefs();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const urls = useScreenshotUrls(p.screenshots);
  const update = useProjectMutation(async (shots: string[]) => supabase.from("projects").update({ screenshots: shots }).eq("id", p.id));

  async function upload(files: FileList | null) {
    if (!files?.length || busy) return;
    setBusy(true);
    const added: string[] = [];
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error(t("common.error"));
      for (const file of Array.from(files)) {
        if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type)) { toast.error(t("pf.notImage", { n: file.name })); continue; }
        if (file.size > 5 * 1024 * 1024) { toast.error(t("pf.tooBig", { n: file.name })); continue; }
        const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
        const path = `${user.id}/${p.id}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from(SCREENSHOT_BUCKET).upload(path, file, { contentType: file.type });
        if (error) toast.error(t("common.error")); else added.push(path);
      }
      if (added.length) {
        try { await update.mutateAsync([...p.screenshots, ...added]); toast.success(t("pf.uploaded")); }
        catch {
          // Keep originals intact; remove only newly uploaded, unattached files.
          const { error } = await supabase.storage.from(SCREENSHOT_BUCKET).remove(added);
          toast.error(t(error ? "pf.uploadSaveFailed" : "common.error"));
        }
      }
    } catch { toast.error(t("common.error")); }
    finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }
  async function remove(path: string) {
    if (busy) return;
    setBusy(true);
    try {
      const { error } = await supabase.storage.from(SCREENSHOT_BUCKET).remove([path]);
      if (error) { toast.error(t("pf.cleanupFailed")); return; }
      await update.mutateAsync(p.screenshots.filter((s) => s !== path));
    } catch { toast.error(t("common.partialSave")); }
    finally { setBusy(false); }
  }

  return (
    <Section title="pf.screenshots">
      {p.screenshots.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {p.screenshots.map((s) => (
            <div key={s} className="group relative aspect-video overflow-hidden rounded-lg border border-border bg-muted">
              {urls.data?.[s] && <a href={urls.data[s]} target="_blank" rel="noopener noreferrer"><img src={urls.data[s]} alt={p.title} className="h-full w-full object-cover object-top" /></a>}
              <Button size="icon" variant="secondary" disabled={busy} className="absolute right-2 top-2 size-7" aria-label={t("pf.removeShot")} onClick={() => remove(s)}><X className="size-4" /></Button>
            </div>
          ))}
        </div>
      ) : <p className="text-sm text-muted-foreground">{t("pf.noShots")}</p>}
      <input ref={input} type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple className="hidden" onChange={(e) => upload(e.target.files)} />
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button variant="outline" disabled={busy} onClick={() => input.current?.click()}><Upload className="size-4" />{t(busy ? "pf.uploading" : "pf.upload")}</Button>
        <span className="text-xs text-muted-foreground">{t("pf.uploadHint")}</span>
      </div>
    </Section>
  );
}
