import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Circle, Pencil, Plus, Target, Trash2, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/app/AppShell";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useKeyedMutation, useSkills, type LearningGoal, type Skill } from "@/lib/data";
import { toISODate } from "@/lib/followup";
import { usePrefs } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/messages";
import { SKILL_CATEGORIES, SKILL_LEVELS, averageProgress, clampProgress, progressByCategory, recentlyUpdated } from "@/lib/skills";
import { cn } from "@/lib/utils";

const META = "Track your frontend, tools and web security skills with progress bars, notes and learning goals.";
export const Route = createFileRoute("/_authenticated/skills")({
  head: () => ({ meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { title: "Skills Development — Career Launchpad" }, { name: "description", content: META }, { property: "og:title", content: "Skills Development" }, { property: "og:description", content: META }] }),
  component: SkillsPage,
});
const catKey = (c: string) => `sk.cat.${c}` as MessageKey;
const lvlKey = (l: string | null) => (l ? (`sk.lvl.${l}` as MessageKey) : "sk.lvl.none");

function SkillsPage() {
  const { t, date } = usePrefs();
  const { data } = useSkills();
  const skills = data?.skills ?? [];
  const goals = data?.goals ?? [];
  const [editing, setEditing] = useState<Skill | null | undefined>(undefined);
  const [goalEdit, setGoalEdit] = useState<LearningGoal | null | undefined>(undefined);
  const improving = skills.filter((s) => s.improving);
  const recent = recentlyUpdated(skills);
  const overall = averageProgress(skills);

  return (
    <>
      <PageHeader title={t("nav.skills")} subtitle={t("sk.subtitle")} action={<Button onClick={() => setEditing(null)}><Plus className="size-4" />{t("sk.add")}</Button>} />
      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <section className="card-soft p-5">
          <h2 className="text-sm font-semibold text-muted-foreground">{t("sk.overall")}</h2>
          <p className="mt-1 text-4xl font-bold text-primary">{overall}%</p>
          <Progress value={overall} className="mt-3 h-3" aria-label={t("sk.overall")} />
          <p className="mt-2 text-xs text-muted-foreground">{t("sk.count", { n: skills.length })}</p>
          <h3 className="mt-5 text-sm font-semibold">{t("sk.byCategory")}</h3>
          <ul className="mt-2 space-y-2">
            {progressByCategory(skills).map((c) => (
              <li key={c.category}><div className="flex justify-between text-xs"><span>{t(catKey(c.category))}</span><span className="font-semibold">{c.progress}%</span></div><Progress value={c.progress} className="mt-1" /></li>
            ))}
          </ul>
        </section>
        <section className="card-soft p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold"><TrendingUp className="size-4 text-primary" />{t("sk.improving")}</h2>
          <MiniList items={improving.map((s) => ({ id: s.id, label: s.name, sub: s.goal ?? t(lvlKey(s.level)), value: s.progress, onClick: () => setEditing(s) }))} />
          <h2 className="mt-5 text-sm font-semibold">{t("sk.recent")}</h2>
          <MiniList items={recent.map((s) => ({ id: s.id, label: s.name, sub: t("sk.updated", { d: date(s.updated_at) }), value: s.progress, onClick: () => setEditing(s) }))} />
        </section>
        <section className="card-soft p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-semibold"><Target className="size-4 text-primary" />{t("sk.goals")}</h2>
            <Button size="sm" variant="secondary" onClick={() => setGoalEdit(null)}><Plus className="size-4" />{t("sk.addGoal")}</Button>
          </div>
          {goals.length > 0 && <p className="mt-1 text-xs text-muted-foreground">{t("sk.goalsDone", { d: goals.filter((g) => g.done).length, t: goals.length })}</p>}
          <ul className="mt-3 space-y-2">
            {goals.length === 0 && <li className="text-sm text-muted-foreground">{t("sk.none")}</li>}
            {goals.map((g) => <GoalRow key={g.id} g={g} skill={skills.find((s) => s.id === g.skill_id)} onEdit={() => setGoalEdit(g)} />)}
          </ul>
        </section>
      </div>

      {SKILL_CATEGORIES.map((c) => {
        const list = skills.filter((s) => s.category === c);
        if (!list.length) return null;
        return (
          <section key={c} className="mb-6">
            <h2 className="mb-3 text-lg font-semibold">{t(catKey(c))}</h2>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{list.map((s) => <SkillCard key={s.id} s={s} onEdit={() => setEditing(s)} />)}</div>
          </section>
        );
      })}
      <SkillForm open={editing !== undefined} onOpenChange={(o) => !o && setEditing(undefined)} skill={editing ?? undefined} />
      <GoalForm open={goalEdit !== undefined} onOpenChange={(o) => !o && setGoalEdit(undefined)} goal={goalEdit ?? undefined} skills={skills} />
    </>
  );
}

function MiniList({ items }: { items: { id: string; label: string; sub: string; value: number; onClick: () => void }[] }) {
  const { t } = usePrefs();
  if (!items.length) return <p className="mt-2 text-sm text-muted-foreground">{t("sk.none")}</p>;
  return (
    <ul className="mt-2 space-y-2">
      {items.map((i) => (
        <li key={i.id}><button className="w-full text-left" onClick={i.onClick}>
          <div className="flex justify-between text-sm"><span className="font-medium">{i.label}</span><span className="text-xs font-semibold">{i.value}%</span></div>
          <p className="truncate text-xs text-muted-foreground">{i.sub}</p>
        </button></li>
      ))}
    </ul>
  );
}

function SkillCard({ s, onEdit }: { s: Skill; onEdit: () => void }) {
  const { t } = usePrefs();
  const [value, setValue] = useState(s.progress);
  const [delOpen, setDelOpen] = useState(false);
  useEffect(() => setValue(s.progress), [s.progress]);
  const upd = useKeyedMutation("skills", async (progress: number) => supabase.from("skills").update({ progress, updated_at: new Date().toISOString() }).eq("id", s.id));
  const del = useKeyedMutation("skills", async () => supabase.from("skills").delete().eq("id", s.id), "common.deleted");
  return (
    <article className="card-soft flex flex-col gap-2 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold leading-tight">{s.name}</h3>
          <p className={cn("text-xs", s.level ? "font-medium text-primary" : "text-muted-foreground")}>{t(lvlKey(s.level))}{s.improving && <> · <TrendingUp className="inline size-3" /></>}</p>
        </div>
        <span className="flex">
          <Button size="icon" variant="ghost" aria-label={t("sk.edit")} onClick={onEdit}><Pencil className="size-4" /></Button>
          <Button size="icon" variant="ghost" aria-label={t("common.delete")} onClick={() => setDelOpen(true)}><Trash2 className="size-4" /></Button>
        </span>
      </div>
      <div className="flex items-center gap-3">
        <Slider value={[value]} max={100} step={5} onValueChange={([v]) => setValue(v ?? 0)} onValueCommit={([v]) => upd.mutate(v ?? 0)} aria-label={`${s.name} %`} />
        <span className="w-10 text-right text-sm font-semibold">{value}%</span>
      </div>
      {s.goal && <p className="text-xs"><Target className="mr-1 inline size-3 text-primary" />{s.goal}</p>}
      {s.notes && <p className="line-clamp-2 whitespace-pre-line text-xs text-muted-foreground">{s.notes}</p>}
      <AlertDialog open={delOpen} onOpenChange={setDelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{t("sk.deleteTitle")}</AlertDialogTitle><AlertDialogDescription>{t("sk.deleteText", { n: s.name })}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel><AlertDialogAction onClick={() => del.mutate(undefined)}>{t("common.delete")}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </article>
  );
}

function SkillForm({ open, onOpenChange, skill }: { open: boolean; onOpenChange: (o: boolean) => void; skill?: Skill | undefined }) {
  const { t } = usePrefs();
  const init = () => ({ name: skill?.name ?? "", category: skill?.category ?? "FRONTEND", level: skill?.level ?? "", progress: skill?.progress ?? 0, notes: skill?.notes ?? "", goal: skill?.goal ?? "", improving: skill?.improving ?? false });
  const [f, setF] = useState(init);
  const [err, setErr] = useState<MessageKey | null>(null);
  useEffect(() => { if (open) { setF(init()); setErr(null); } }, [open, skill]); // eslint-disable-line react-hooks/exhaustive-deps
  const save = useKeyedMutation("skills", async () => {
    const values = { name: f.name.trim(), category: f.category, level: f.level || null, progress: clampProgress(f.progress), notes: f.notes.trim() || null, goal: f.goal.trim() || null, improving: f.improving };
    const r = skill ? await supabase.from("skills").update({ ...values, updated_at: new Date().toISOString() }).eq("id", skill.id) : await supabase.from("skills").insert(values);
    if (r.error?.code === "23505") { setErr("sk.duplicate"); return { error: null }; }
    if (!r.error) onOpenChange(false);
    return r;
  }, "sk.saved");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>{t(skill ? "sk.edit" : "sk.add")}</DialogTitle></DialogHeader>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (!f.name.trim()) return setErr("common.required"); save.mutate(undefined); }}>
          <div className="space-y-1.5"><Label htmlFor="sk-name">{t("sk.f.name")}</Label><Input id="sk-name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />{err && <p className="text-xs font-medium text-destructive">{t(err)}</p>}</div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>{t("sk.f.category")}</Label>
              <Select value={f.category} onValueChange={(v) => setF({ ...f, category: v })}><SelectTrigger aria-label={t("sk.f.category")}><SelectValue /></SelectTrigger><SelectContent>{SKILL_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{t(catKey(c))}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>{t("sk.f.level")}</Label>
              <Select value={f.level || "none"} onValueChange={(v) => setF({ ...f, level: v === "none" ? "" : v })}><SelectTrigger aria-label={t("sk.f.level")}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">{t("sk.lvl.none")}</SelectItem>{SKILL_LEVELS.map((l) => <SelectItem key={l} value={l}>{t(lvlKey(l))}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <div className="space-y-2"><Label>{t("sk.f.progress", { n: f.progress })}</Label><Slider value={[f.progress]} max={100} step={5} onValueChange={([v]) => setF({ ...f, progress: v ?? 0 })} aria-label={t("sk.f.progress", { n: f.progress })} /></div>
          <div className="space-y-1.5"><Label htmlFor="sk-goal">{t("sk.f.goal")}</Label><Input id="sk-goal" value={f.goal} onChange={(e) => setF({ ...f, goal: e.target.value })} /></div>
          <div className="space-y-1.5"><Label htmlFor="sk-notes">{t("sk.f.notes")}</Label><Textarea id="sk-notes" rows={4} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></div>
          <label className="flex items-center gap-2 text-sm"><Checkbox checked={f.improving} onCheckedChange={(c) => setF({ ...f, improving: c === true })} />{t("sk.f.improving")}</label>
          <DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button><Button type="submit" disabled={save.isPending}>{save.isPending ? t("common.saving") : t("common.save")}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function GoalRow({ g, skill, onEdit }: { g: LearningGoal; skill?: Skill | undefined; onEdit: () => void }) {
  const { t, date } = usePrefs();
  const toggle = useKeyedMutation("skills", async () => supabase.from("learning_goals").update({ done: !g.done }).eq("id", g.id));
  const del = useKeyedMutation("skills", async () => supabase.from("learning_goals").delete().eq("id", g.id), "common.deleted");
  const overdue = !g.done && g.target_date && g.target_date < toISODate(new Date());
  return (
    <li className="flex items-start gap-2">
      <button aria-label={t(g.done ? "sk.g.done" : "sk.g.open")} aria-pressed={g.done} onClick={() => toggle.mutate(undefined)} className="mt-0.5 text-primary">{g.done ? <CheckCircle2 className="size-4" /> : <Circle className="size-4" />}</button>
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm", g.done && "text-muted-foreground line-through")}>{g.title}</p>
        <p className={cn("text-xs text-muted-foreground", overdue && "text-destructive")}>{[skill?.name, g.target_date && t("sk.g.due", { d: date(g.target_date) }), overdue && t("sk.g.overdue")].filter(Boolean).join(" · ")}</p>
      </div>
      <Button size="icon" variant="ghost" className="size-7" aria-label={t("sk.editGoal")} onClick={onEdit}><Pencil className="size-3.5" /></Button>
      <Button size="icon" variant="ghost" className="size-7" aria-label={t("common.delete")} onClick={() => del.mutate(undefined)}><Trash2 className="size-3.5" /></Button>
    </li>
  );
}

function GoalForm({ open, onOpenChange, goal, skills }: { open: boolean; onOpenChange: (o: boolean) => void; goal?: LearningGoal | undefined; skills: Skill[] }) {
  const { t } = usePrefs();
  const init = () => ({ title: goal?.title ?? "", target_date: goal?.target_date ?? "", skill_id: goal?.skill_id ?? "", done: goal?.done ?? false });
  const [f, setF] = useState(init);
  const [err, setErr] = useState(false);
  useEffect(() => { if (open) { setF(init()); setErr(false); } }, [open, goal]); // eslint-disable-line react-hooks/exhaustive-deps
  const save = useKeyedMutation("skills", async () => {
    const values = { title: f.title.trim(), target_date: f.target_date || null, skill_id: f.skill_id || null, done: f.done };
    const r = goal ? await supabase.from("learning_goals").update(values).eq("id", goal.id) : await supabase.from("learning_goals").insert(values);
    if (!r.error) onOpenChange(false);
    return r;
  }, "sk.goalSaved");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{t(goal ? "sk.editGoal" : "sk.addGoal")}</DialogTitle></DialogHeader>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (!f.title.trim()) return setErr(true); save.mutate(undefined); }}>
          <div className="space-y-1.5"><Label htmlFor="g-title">{t("sk.g.title")}</Label><Input id="g-title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />{err && <p className="text-xs font-medium text-destructive">{t("common.required")}</p>}</div>
          <div className="space-y-1.5"><Label htmlFor="g-date">{t("sk.g.target")}</Label><Input id="g-date" type="date" value={f.target_date} onChange={(e) => setF({ ...f, target_date: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>{t("sk.g.skill")}</Label>
            <Select value={f.skill_id || "none"} onValueChange={(v) => setF({ ...f, skill_id: v === "none" ? "" : v })}><SelectTrigger aria-label={t("sk.g.skill")}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">{t("sk.g.noSkill")}</SelectItem>{skills.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
          <label className="flex items-center gap-2 text-sm"><Checkbox checked={f.done} onCheckedChange={(c) => setF({ ...f, done: c === true })} />{t("sk.g.done")}</label>
          <DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button><Button type="submit" disabled={save.isPending}>{save.isPending ? t("common.saving") : t("common.save")}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
