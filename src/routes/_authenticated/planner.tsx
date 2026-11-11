import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";
import { PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { addDays, toISODate, weekStart } from "@/lib/followup";
import { usePrefs } from "@/lib/i18n";
import { useApplications, usePlanner, usePlannerMutation } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/planner")({
  head: () => ({ meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { title: "Daily Planner — Career Launchpad" }, { name: "description", content: "Daily job search checklist and weekly goals." }, { property: "og:title", content: "Daily Planner" }, { property: "og:description", content: "Daily job search checklist and weekly goals." }] }),
  component: PlannerPage,
});

function PlannerPage() {
  const today = toISODate(new Date());
  const week = weekStart();
  const { data } = usePlanner(today, week);
  const { data: apps = [] } = useApplications();
  const { t, locale } = usePrefs();
  const tasks = data?.tasks ?? [];
  const completions = data?.completions ?? [];
  const goals = data?.goals ?? [];
  const doneToday = new Set(completions.filter((c) => c.done_on === today).map((c) => c.task_id));

  const toggle = usePlannerMutation(async ({ id, done }: { id: string; done: boolean }) =>
    done ? supabase.from("task_completions").delete().eq("task_id", id).eq("done_on", today) : supabase.from("task_completions").insert({ task_id: id, done_on: today }));
  const addTask = usePlannerMutation(async (label: string) => supabase.from("planner_tasks").insert({ label, position: tasks.length + 1 }));
  const renameTask = usePlannerMutation(async ({ id, label }: { id: string; label: string }) => supabase.from("planner_tasks").update({ label }).eq("id", id));
  const delTask = usePlannerMutation(async (id: string) => supabase.from("planner_tasks").delete().eq("id", id));
  const addGoal = usePlannerMutation(async (label: string) => supabase.from("weekly_goals").insert({ label, week_start: week }));
  const toggleGoal = usePlannerMutation(async ({ id, done }: { id: string; done: boolean }) => supabase.from("weekly_goals").update({ done }).eq("id", id));
  const delGoal = usePlannerMutation(async (id: string) => supabase.from("weekly_goals").delete().eq("id", id));

  const days = Array.from({ length: 7 }, (_, i) => addDays(week, i));
  const appliedThisWeek = apps.filter((a) => !a.is_demo && a.applied_date && a.applied_date >= week).length;
  const pct = tasks.length ? Math.round((doneToday.size / tasks.length) * 100) : 0;

  return (
    <>
      <PageHeader title={t("plan.title")} subtitle={new Date().toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" })} />
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card-soft p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t("plan.checklist")}</h2>
            <span className="text-sm text-muted-foreground">{t("plan.done", { d: doneToday.size, n: tasks.length })}</span>
          </div>
          <Progress value={pct} className="mb-5" />
          <ul className="space-y-2">
            {tasks.map((t) => <TaskRow key={t.id} label={t.label} done={doneToday.has(t.id)}
              onToggle={() => toggle.mutate({ id: t.id, done: doneToday.has(t.id) })}
              onRename={(label) => renameTask.mutate({ id: t.id, label })} onDelete={() => delTask.mutate(t.id)} />)}
            {tasks.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">{t("plan.noTasks")}</p>}
          </ul>
          <AddInput placeholder={t("plan.addTask")} onAdd={(v) => addTask.mutate(v)} />
        </section>

        <section className="card-soft p-6">
          <h2 className="mb-4 text-lg font-semibold">{t("plan.summary")}</h2>
          <div className="grid grid-cols-7 gap-1.5">
            {days.map((d) => {
              const n = completions.filter((c) => c.done_on === d).length;
              const r = tasks.length ? n / tasks.length : 0;
              return (
                <div key={d} className="text-center">
                  <div className="mx-auto flex h-20 w-full items-end overflow-hidden rounded-lg bg-muted">
                    <div className="w-full rounded-lg bg-primary" style={{ height: `${Math.max(r * 100, n ? 8 : 0)}%` }} />
                  </div>
                  <div className={`mt-1 text-[11px] ${d === today ? "font-bold text-primary" : "text-muted-foreground"}`}>
                    {new Date(d + "T00:00").toLocaleDateString(locale, { weekday: "narrow" })}
                  </div>
                </div>
              );
            })}
          </div>
          <dl className="mt-5 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">{t("plan.tasksWeek")}</dt><dd className="font-semibold">{completions.length}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">{t("plan.appsWeek")}</dt><dd className="font-semibold">{appliedThisWeek}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">{t("plan.goalsReached")}</dt><dd className="font-semibold">{goals.filter((g) => g.done).length}/{goals.length}</dd></div>
          </dl>
        </section>

        <section className="card-soft p-6 lg:col-span-3">
          <h2 className="mb-4 text-lg font-semibold">{t("plan.goals")}</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {goals.map((g) => (
              <li key={g.id} className="flex items-center gap-3 rounded-xl bg-muted/60 px-3 py-2.5">
                <Checkbox checked={g.done} onCheckedChange={() => toggleGoal.mutate({ id: g.id, done: !g.done })} />
                <span className={g.done ? "text-muted-foreground line-through" : ""}>{g.label}</span>
                <Button size="icon" variant="ghost" className="ml-auto size-8" onClick={() => delGoal.mutate(g.id)} aria-label={t("plan.deleteGoal")}><Trash2 className="size-4" /></Button>
              </li>
            ))}
          </ul>
          {goals.length === 0 && <p className="text-sm text-muted-foreground">{t("plan.goalHint")}</p>}
          <AddInput placeholder={t("plan.addGoal")} onAdd={(v) => addGoal.mutate(v)} />
        </section>
      </div>
    </>
  );
}

function TaskRow({ label, done, onToggle, onRename, onDelete }: { label: string; done: boolean; onToggle: () => void; onRename: (v: string) => void; onDelete: () => void }) {
  const [edit, setEdit] = useState(false);
  const [v, setV] = useState(label);
  const { t } = usePrefs();
  return (
    <li className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-muted/60">
      <Checkbox checked={done} onCheckedChange={onToggle} aria-label={label} />
      {edit ? (
        <form className="flex flex-1 gap-2" onSubmit={(e) => { e.preventDefault(); if (v.trim()) { onRename(v.trim()); setEdit(false); } }}>
          <Input value={v} onChange={(e) => setV(e.target.value)} autoFocus />
          <Button size="icon" variant="ghost" type="submit" aria-label={t("common.save")}><Check className="size-4" /></Button>
          <Button size="icon" variant="ghost" type="button" onClick={() => setEdit(false)} aria-label={t("common.cancel")}><X className="size-4" /></Button>
        </form>
      ) : (
        <>
          <span className={`flex-1 ${done ? "text-muted-foreground line-through" : ""}`}>{label}</span>
          <Button size="icon" variant="ghost" className="size-8" onClick={() => setEdit(true)} aria-label={t("plan.editTask")}><Pencil className="size-4" /></Button>
          <Button size="icon" variant="ghost" className="size-8" onClick={onDelete} aria-label={t("plan.deleteTask")}><Trash2 className="size-4" /></Button>
        </>
      )}
    </li>
  );
}

function AddInput({ placeholder, onAdd }: { placeholder: string; onAdd: (v: string) => void }) {
  const [v, setV] = useState("");
  const { t } = usePrefs();
  return (
    <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (v.trim()) { onAdd(v.trim()); setV(""); } }}>
      <Input value={v} onChange={(e) => setV(e.target.value)} placeholder={placeholder} maxLength={120} />
      <Button type="submit" variant="secondary"><Plus className="size-4" /> {t("common.add")}</Button>
    </form>
  );
}
