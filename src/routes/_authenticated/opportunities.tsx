import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { resumableWrite } from "@/lib/recovery";
import { ArrowRightLeft, Briefcase, CalendarClock, CheckCircle2, ExternalLink, MapPin, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/AppShell";
import { StatusBadge, arrKey } from "@/components/app/StatusBadge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CAREER_ROLES, matchesCareerRoles, toggleCareerRole } from "@/lib/career";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useApplications, useCareerProfile, useVacancies, useVacancyMutation, type Application } from "@/lib/data";
import { toISODate } from "@/lib/followup";
import { usePrefs } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/messages";
import { listFromText, normalizeUrl } from "@/lib/portfolio";
import { ARRANGEMENTS, EMPLOYMENT_TYPES, VACANCY_FILTERS, daysUntil, findExistingApplication, matchesVacancy, vacancyToApplication, type Vacancy, type VacancyInput } from "@/lib/vacancies";
import { cn } from "@/lib/utils";

const META = "Save vacancies from LinkedIn and career pages, filter them and move them into My Applications.";
export const Route = createFileRoute("/_authenticated/opportunities")({
  head: () => ({ meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { title: "Job Opportunities — Career Launchpad" }, { name: "description", content: META }, { property: "og:title", content: "Job Opportunities" }, { property: "og:description", content: META }] }),
  component: OpportunitiesPage,
});
const etKey = (s: string) => `vac.et.${s}` as MessageKey;

function OpportunitiesPage() {
  const { t } = usePrefs();
  const { data: vacancies = [], isLoading } = useVacancies();
  const { data: apps = [] } = useApplications();
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const { data: profile } = useCareerProfile();
  const [editing, setEditing] = useState<Vacancy | null | undefined>(undefined);
  const shown = vacancies.filter((v) => matchesVacancy(v, q, filters) && matchesCareerRoles(v, roles));
  const toggle = (k: string) => setFilters((f) => (f.includes(k) ? f.filter((x) => x !== k) : [...f, k]));

  return (
    <>
      <PageHeader title={t("nav.opportunities")} subtitle={t("vac.subtitle")} action={<Button onClick={() => setEditing(null)}><Plus className="size-4" />{t("vac.add")}</Button>} />
      <div className="card-soft mb-6 space-y-3 p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder={t("vac.search")} aria-label={t("vac.search")} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {VACANCY_FILTERS.map((f) => (
            <button key={f.key} type="button" aria-pressed={filters.includes(f.key)} onClick={() => toggle(f.key)}
              className={cn("rounded-full border px-3 py-1 text-xs font-semibold transition", filters.includes(f.key) ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/50")}>
              {t(f.label)}
            </button>
          ))}
          {(filters.length > 0 || roles.length > 0) && <Button size="sm" variant="ghost" onClick={() => { setFilters([]); setRoles([]); }}>{t("vac.clear")}</Button>}
          <span className="ml-auto text-xs text-muted-foreground">{t("vac.count", { n: shown.length, t: vacancies.length })}</span>
        </div>
        <details>
          <summary className="cursor-pointer text-sm font-medium">{t("career.filter")} {roles.length > 0 && `(${roles.length})`}</summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CAREER_ROLES.map((role) => <label key={role} className="flex items-start gap-2 text-sm"><Checkbox checked={roles.includes(role)} onCheckedChange={() => setRoles((r) => toggleCareerRole(r, role))} />{t(`career.role.${role}`)}</label>)}
          </div>
          <Button className="mt-3" size="sm" variant="secondary" disabled={!profile?.preferred_roles.length} onClick={() => setRoles(profile?.preferred_roles ?? [])}>{t("career.preferred")}</Button>
        </details>
      </div>
      <p className="mb-4 text-xs text-muted-foreground">{t("vac.manualNote")}</p>

      {!isLoading && shown.length === 0 && (
        <div className="card-soft flex flex-col items-center p-12 text-center">
          <Briefcase className="size-8 text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">{t(vacancies.length ? "vac.noMatch" : "vac.empty")}</p>
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        {shown.map((v) => <VacancyCard key={v.id} v={v} apps={apps} onEdit={() => setEditing(v)} />)}
      </div>
      <VacancyForm open={editing !== undefined} onOpenChange={(o) => !o && setEditing(undefined)} vacancy={editing ?? undefined} />
    </>
  );
}

function VacancyCard({ v, apps, onEdit }: { v: Vacancy; apps: Application[]; onEdit: () => void }) {
  const { t, date } = usePrefs();
  const [delOpen, setDelOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const pendingMove = useRef<(() => Promise<void>) | null>(null);
  const linked = v.application_id ? apps.find((a) => a.id === v.application_id) : undefined;
  const days = daysUntil(v.deadline, toISODate(new Date()));

  const del = useVacancyMutation(async () => supabase.from("vacancies").delete().eq("id", v.id), "common.deleted");
  const move = useVacancyMutation(async () => {
    if (!pendingMove.current) {
      pendingMove.current = resumableWrite(async () => {
        const existing = findExistingApplication(v, apps);
        if (existing) return { id: existing.id, existing: true };
        const r = await supabase.from("applications").insert(vacancyToApplication(v, { deadline: t("vac.f.deadline"), type: t(etKey(v.employment_type)), skills: t("vac.f.skills") })).select("id").single();
        if (r.error) throw r.error;
        return { id: r.data.id, existing: false };
      }, async (app) => {
        const r = await supabase.from("vacancies").update({ application_id: app.id }).eq("id", v.id);
        if (r.error) throw new Error(t("common.partialSave"));
        toast.success(t(app.existing ? "vac.linked" : "vac.moved"));
      });
    }
    await pendingMove.current();
    pendingMove.current = null;
    return { error: null };
  });

  return (
    <article className="card-soft flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold leading-tight">{v.title}</h2>
          <p className="text-sm font-medium text-muted-foreground">{v.company}</p>
        </div>
        {linked && <StatusBadge status={linked.status} />}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {v.location && <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" />{v.location}</span>}
        <span>{t(arrKey(v.arrangement))} · {t(etKey(v.employment_type))}</span>
        <span>{t("vac.savedOn", { d: date(v.saved_on) })}</span>
      </div>
      {v.deadline && days !== null && (
        <p className={cn("inline-flex items-center gap-1.5 text-xs font-medium", days !== null && days < 0 ? "text-muted-foreground line-through" : days !== null && days <= 3 ? "text-destructive" : "text-foreground")}>
          <CalendarClock className="size-3.5" />{t("vac.deadline", { d: date(v.deadline) })}
          <span className="no-underline">· {days < 0 ? t("vac.deadlinePassed") : days === 0 ? t("vac.today") : t("vac.daysLeft", { n: days })}</span>
        </p>
      )}
      {v.skills.length > 0 && <div className="flex flex-wrap gap-1.5">{v.skills.map((s) => <span key={s} className="rounded-md bg-primary-soft px-2 py-0.5 text-xs font-medium text-accent-foreground">{s}</span>)}</div>}
      {v.description && (
        <div>
          <p className={cn("whitespace-pre-line text-sm text-muted-foreground", !expanded && "line-clamp-3")}>{v.description}</p>
          {v.description.length > 180 && <button className="mt-1 text-xs font-medium text-primary hover:underline" onClick={() => setExpanded((e) => !e)}>{t(expanded ? "vac.less" : "vac.more")}</button>}
        </div>
      )}
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
        {linked ? (
          <Button asChild size="sm" variant="secondary"><Link to="/applications"><CheckCircle2 className="size-4" />{t("vac.inApps")}</Link></Button>
        ) : (
          <Button size="sm" onClick={() => move.mutate(undefined)} disabled={move.isPending}><ArrowRightLeft className="size-4" />{t("vac.move")}</Button>
        )}
        {v.job_url && <Button asChild size="sm" variant="outline"><a href={v.job_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="size-4" />{t("vac.open")}</a></Button>}
        <span className="ml-auto flex gap-1">
          <Button size="icon" variant="ghost" aria-label={t("vac.edit")} onClick={onEdit}><Pencil className="size-4" /></Button>
          <Button size="icon" variant="ghost" aria-label={t("common.delete")} onClick={() => setDelOpen(true)}><Trash2 className="size-4" /></Button>
        </span>
      </div>
      <AlertDialog open={delOpen} onOpenChange={setDelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{t("vac.deleteTitle")}</AlertDialogTitle><AlertDialogDescription>{t("vac.deleteText", { n: `${v.title} – ${v.company}` })}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => del.mutate(undefined)}>{t("common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </article>
  );
}

type Form = Record<"company" | "title" | "location" | "arrangement" | "employment_type" | "description" | "job_url" | "deadline" | "skills" | "saved_on", string>;
const toForm = (v?: Vacancy): Form => ({
  company: v?.company ?? "", title: v?.title ?? "", location: v?.location ?? "", arrangement: v?.arrangement ?? "Hybrid",
  employment_type: v?.employment_type ?? "FULL_TIME", description: v?.description ?? "", job_url: v?.job_url ?? "",
  deadline: v?.deadline ?? "", skills: v?.skills.join(", ") ?? "", saved_on: v?.saved_on ?? toISODate(new Date()),
});

function VacancyForm({ open, onOpenChange, vacancy }: { open: boolean; onOpenChange: (o: boolean) => void; vacancy?: Vacancy | undefined }) {
  const { t } = usePrefs();
  const [f, setF] = useState<Form>(toForm(vacancy));
  const [errors, setErrors] = useState<Partial<Record<keyof Form, MessageKey>>>({});
  useEffect(() => { if (open) { setF(toForm(vacancy)); setErrors({}); } }, [open, vacancy]);
  const set = (k: keyof Form) => (e: { target: { value: string } }) => setF((p) => ({ ...p, [k]: e.target.value }));

  const save = useVacancyMutation(async (values: VacancyInput) => {
    const r = vacancy
      ? await supabase.from("vacancies").update({ ...values, updated_at: new Date().toISOString() }).eq("id", vacancy.id)
      : await supabase.from("vacancies").insert(values);
    if (!r.error) onOpenChange(false);
    return r;
  }, "vac.saved");

  function submit() {
    const e: typeof errors = {};
    if (!f.company.trim()) e.company = "common.required";
    if (!f.title.trim()) e.title = "common.required";
    const url = normalizeUrl(f.job_url);
    if (f.job_url.trim() && !url) e.job_url = "pf.f.badUrl";
    setErrors(e);
    if (Object.keys(e).length) return;
    save.mutate({
      company: f.company.trim(), title: f.title.trim(), location: f.location.trim() || null, arrangement: f.arrangement,
      employment_type: f.employment_type, description: f.description.trim() || null, job_url: url, deadline: f.deadline || null,
      skills: listFromText(f.skills, /,/), saved_on: f.saved_on || toISODate(new Date()),
    });
  }

  const field = (k: keyof Form, label: MessageKey, o: { type?: string; hint?: MessageKey } = {}) => (
    <div className="space-y-1.5">
      <Label htmlFor={`vac-${k}`}>{t(label)}</Label>
      <Input id={`vac-${k}`} type={o.type ?? "text"} value={f[k]} onChange={set(k)} aria-invalid={!!errors[k]} />
      {o.hint && <p className="text-xs text-muted-foreground">{t(o.hint)}</p>}
      {errors[k] && <p className="text-xs font-medium text-destructive">{t(errors[k])}</p>}
    </div>
  );
  const select = (k: "arrangement" | "employment_type", label: MessageKey, opts: readonly string[], key: (s: string) => MessageKey) => (
    <div className="space-y-1.5">
      <Label>{t(label)}</Label>
      <Select value={f[k]} onValueChange={(v) => setF((p) => ({ ...p, [k]: v }))}>
        <SelectTrigger aria-label={t(label)}><SelectValue /></SelectTrigger>
        <SelectContent>{opts.map((o) => <SelectItem key={o} value={o}>{t(key(o))}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>{t(vacancy ? "vac.edit" : "vac.add")}</DialogTitle></DialogHeader>
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); submit(); }}>
          {field("company", "vac.f.company")}
          {field("title", "vac.f.title")}
          {field("location", "vac.f.location", { hint: "vac.f.locationHint" })}
          {select("arrangement", "vac.f.arrangement", ARRANGEMENTS, arrKey)}
          {select("employment_type", "vac.f.type", EMPLOYMENT_TYPES, etKey)}
          {field("deadline", "vac.f.deadline", { type: "date" })}
          <div className="sm:col-span-2">{field("job_url", "vac.f.url")}</div>
          <div className="sm:col-span-2">{field("skills", "vac.f.skills", { hint: "vac.f.skillsHint" })}</div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="vac-description">{t("vac.f.description")}</Label>
            <Textarea id="vac-description" rows={6} value={f.description} onChange={set("description")} />
          </div>
          {field("saved_on", "vac.f.saved", { type: "date" })}
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
            <Button type="submit" disabled={save.isPending}>{save.isPending ? t("common.saving") : t("common.save")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
