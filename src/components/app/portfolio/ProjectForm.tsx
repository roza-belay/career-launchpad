import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useProjectMutation } from "@/lib/data";
import { usePrefs } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/messages";
import { listFromText, normalizeUrl, PROJECT_STATUSES, type Project, type ProjectInput } from "@/lib/portfolio";
import { projectStatusKey } from "./ProjectBits";

type Form = Record<"title" | "short_description" | "description" | "category" | "technologies" | "role" | "start_date" | "end_date" | "status" | "github_url" | "demo_url" | "docs_url" | "features" | "challenges", string> & { is_public: boolean };

const toForm = (p?: Project): Form => ({
  title: p?.title ?? "", short_description: p?.short_description ?? "", description: p?.description ?? "", category: p?.category ?? "",
  technologies: p?.technologies.join(", ") ?? "", role: p?.role ?? "", start_date: p?.start_date ?? "", end_date: p?.end_date ?? "",
  status: p?.status ?? "PLANNED", github_url: p?.github_url ?? "", demo_url: p?.demo_url ?? "", docs_url: p?.docs_url ?? "",
  features: p?.features.join("\n") ?? "", challenges: p?.challenges ?? "", is_public: p?.is_public ?? false,
});
const orNull = (s: string) => s.trim() || null;

export function ProjectForm({ open, onOpenChange, project, onSaved }: { open: boolean; onOpenChange: (o: boolean) => void; project?: Project; onSaved?: (id: string) => void }) {
  const { t } = usePrefs();
  const [f, setF] = useState<Form>(toForm(project));
  const [errors, setErrors] = useState<Partial<Record<keyof Form, MessageKey>>>({});
  useEffect(() => { if (open) { setF(toForm(project)); setErrors({}); } }, [open, project]);
  const set = (k: keyof Form) => (e: { target: { value: string } }) => setF((p) => ({ ...p, [k]: e.target.value }));

  const save = useProjectMutation(async (values: ProjectInput) => {
    const r = project
      ? await supabase.from("projects").update({ ...values, updated_at: new Date().toISOString() }).eq("id", project.id).select("id").single()
      : await supabase.from("projects").insert(values).select("id").single();
    if (r.error?.code === "23505") { setErrors({ title: "pf.f.duplicate" }); return { error: null }; }
    if (r.data) { onSaved?.(r.data.id); onOpenChange(false); }
    return r;
  }, undefined);

  function submit() {
    const e: typeof errors = {};
    if (!f.title.trim()) e.title = "common.required";
    const urls = { github_url: normalizeUrl(f.github_url), demo_url: normalizeUrl(f.demo_url), docs_url: normalizeUrl(f.docs_url) };
    for (const k of ["github_url", "demo_url", "docs_url"] as const) if (f[k].trim() && !urls[k]) e[k] = "pf.f.badUrl";
    if (f.start_date && f.end_date && f.end_date < f.start_date) e.end_date = "pf.f.endBeforeStart";
    setErrors(e);
    if (Object.keys(e).length) return;
    save.mutate({
      title: f.title.trim(), short_description: orNull(f.short_description), description: orNull(f.description), category: orNull(f.category),
      technologies: listFromText(f.technologies, /,/), role: orNull(f.role), start_date: f.start_date || null, end_date: f.end_date || null,
      status: f.status, ...urls, features: listFromText(f.features, /\n/), challenges: orNull(f.challenges), is_public: f.is_public,
    });
  }

  const field = (k: keyof Form, label: MessageKey, opts: { area?: boolean; type?: string; hint?: MessageKey; rows?: number } = {}) => (
    <div className="space-y-1.5">
      <Label htmlFor={`pf-${k}`}>{t(label)}</Label>
      {opts.area
        ? <Textarea id={`pf-${k}`} rows={opts.rows ?? 3} value={f[k] as string} onChange={set(k)} />
        : <Input id={`pf-${k}`} type={opts.type ?? "text"} value={f[k] as string} onChange={set(k)} aria-invalid={!!errors[k]} />}
      {opts.hint && <p className="text-xs text-muted-foreground">{t(opts.hint)}</p>}
      {errors[k] && <p className="text-xs font-medium text-destructive">{t(errors[k])}</p>}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>{t(project ? "pf.edit" : "pf.add")}</DialogTitle></DialogHeader>
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); submit(); }}>
          <div className="sm:col-span-2">{field("title", "pf.f.title")}</div>
          <div className="sm:col-span-2">{field("short_description", "pf.f.short")}</div>
          <div className="sm:col-span-2">{field("description", "pf.f.description", { area: true, rows: 4 })}</div>
          {field("category", "pf.f.category")}
          <div className="space-y-1.5">
            <Label>{t("pf.f.status")}</Label>
            <Select value={f.status} onValueChange={(v) => setF((p) => ({ ...p, status: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{PROJECT_STATUSES.map((s) => <SelectItem key={s} value={s}>{t(projectStatusKey(s))}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">{field("technologies", "pf.f.tech", { hint: "pf.f.techHint" })}</div>
          <div className="sm:col-span-2">{field("role", "pf.f.role", { area: true })}</div>
          {field("start_date", "pf.f.start", { type: "date" })}
          {field("end_date", "pf.f.end", { type: "date" })}
          <div className="sm:col-span-2">{field("github_url", "pf.f.github", { type: "text" })}</div>
          {field("demo_url", "pf.f.demo", { type: "text" })}
          {field("docs_url", "pf.f.docs", { type: "text" })}
          <div className="sm:col-span-2">{field("features", "pf.f.features", { area: true, rows: 5, hint: "pf.f.featuresHint" })}</div>
          <div className="sm:col-span-2">{field("challenges", "pf.f.challenges", { area: true, rows: 4 })}</div>
          <div className="flex items-start gap-3 sm:col-span-2">
            <Switch id="pf-public" checked={f.is_public} onCheckedChange={(v) => setF((p) => ({ ...p, is_public: v }))} />
            <div><Label htmlFor="pf-public">{t("pf.f.public")}</Label><p className="text-xs text-muted-foreground">{t("pf.f.publicHint")}</p></div>
          </div>
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
            <Button type="submit" disabled={save.isPending}>{save.isPending ? t("common.saving") : t("common.save")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
