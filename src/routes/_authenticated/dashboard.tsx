import { createFileRoute, Link, useRouteContext } from "@tanstack/react-router";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Bookmark, Send, CalendarDays, Trophy, BellRing, ArrowRight, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/app/AppShell";
import { DemoBadge, StatusBadge, STATUS_DOT } from "@/components/app/StatusBadge";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { STATUSES, addDays, followUpState, toISODate, weekStart } from "@/lib/followup";
import { useApplications, usePlanner, usePlannerMutation } from "@/lib/data";
import { cn } from "@/lib/utils";
import { usePrefs } from "@/lib/i18n";
import { statusKey } from "@/components/app/StatusBadge";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Career Launchpad" }, { name: "description", content: "Your job search at a glance." }, { property: "og:title", content: "Dashboard" }, { property: "og:description", content: "Your job search at a glance." }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useRouteContext({ from: "/_authenticated" });
  const { data: apps = [] } = useApplications();
  const { t, locale, date, dateTime } = usePrefs();
  const today = toISODate(new Date());
  const week = weekStart();
  const { data: planner } = usePlanner(today, week);
  const name = (user.user_metadata?.["full_name"] as string | undefined) || user.email?.split("@")[0] || t("dash.there");

  const count = (s: string) => apps.filter((a) => a.status === s).length;
  const followDue = apps.filter((a) => ["overdue", "today"].includes(followUpState(a)));
  const interviews = apps.filter((a) => a.interview_date && a.interview_date >= new Date().toISOString()).sort((a, b) => a.interview_date!.localeCompare(b.interview_date!));
  const weeks = Array.from({ length: 6 }, (_, i) => addDays(week, -7 * (5 - i)));
  const chart = weeks.map((w) => ({
    week: new Date(w + "T00:00").toLocaleDateString(locale, { day: "numeric", month: "short" }),
    value: apps.filter((a) => a.applied_date && a.applied_date >= w && a.applied_date < addDays(w, 7)).length,
  }));

  const tasks = planner?.tasks ?? [];
  const done = new Set((planner?.completions ?? []).filter((c) => c.done_on === today).map((c) => c.task_id));
  const toggle = usePlannerMutation(async ({ id, d }: { id: string; d: boolean }) =>
    d ? supabase.from("task_completions").delete().eq("task_id", id).eq("done_on", today) : supabase.from("task_completions").insert({ task_id: id, done_on: today }));
  const hour = new Date().getHours();
  const greet = t(hour < 10 ? "dash.morning" : hour < 18 ? "dash.hello" : "dash.evening");

  return (
    <>
      <div className="relative mb-8 overflow-hidden rounded-3xl bg-hero p-7 text-hero-foreground shadow-soft sm:p-9">
        <Sparkles className="absolute -right-4 -top-4 size-32 opacity-15" />
        <p className="text-sm font-medium opacity-90">{greet}, {name} 👋</p>
        <h1 className="mt-1 max-w-xl text-2xl font-semibold sm:text-3xl">{t("dash.headline")}</h1>
        <p className="mt-2 text-sm opacity-90">{followDue.length ? t(followDue.length > 1 ? "dash.dueMany" : "dash.dueOne", { n: followDue.length }) : t("dash.noneDue")}</p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Kpi icon={Bookmark} label={t("dash.saved")} value={count("SAVED")} />
        <Kpi icon={Send} label={t("dash.sent")} value={apps.filter((a) => a.status !== "SAVED").length} />
        <Kpi icon={CalendarDays} label={t("dash.interviews")} value={interviews.length} />
        <Kpi icon={Trophy} label={t("dash.offers")} value={count("OFFER")} />
        <Kpi icon={BellRing} label={t("dash.followDue")} value={followDue.length} warn={followDue.length > 0} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card-soft p-6 lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">{t("dash.pipeline")}</h2>
          <div className="flex h-3 overflow-hidden rounded-full bg-muted">
            {STATUSES.map((s) => apps.length ? <div key={s} className={STATUS_DOT[s]} style={{ width: `${(count(s) / apps.length) * 100}%` }} /> : null)}
          </div>
          <div className="mt-4 grid grid-cols-5 gap-2">
            {STATUSES.map((s) => (
              <Link key={s} to="/applications" className="rounded-xl bg-muted/60 p-3 text-center hover:bg-muted">
                <div className="text-xl font-semibold">{count(s)}</div>
                <div className="text-[10px] font-bold tracking-wide text-muted-foreground sm:text-xs">{t(statusKey(s))}</div>
              </Link>
            ))}
          </div>
          <h3 className="mb-2 mt-7 text-sm font-semibold text-muted-foreground">{t("dash.weekly")}</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart}>
                <XAxis dataKey="week" tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} width={24} stroke="var(--muted-foreground)" />
                <Tooltip cursor={{ fill: "var(--muted)" }} contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--popover)", color: "var(--popover-foreground)" }} />
                <Bar dataKey="value" name={t("dash.chartSeries")} fill="var(--chart-1)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card-soft p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t("dash.goals")}</h2>
            <span className="text-sm text-muted-foreground">{done.size}/{tasks.length}</span>
          </div>
          <ul className="space-y-1">
            {tasks.map((t) => (
              <li key={t.id} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/60">
                <Checkbox checked={done.has(t.id)} onCheckedChange={() => toggle.mutate({ id: t.id, d: done.has(t.id) })} aria-label={t.label} />
                <span className={cn("text-sm", done.has(t.id) && "text-muted-foreground line-through")}>{t.label}</span>
              </li>
            ))}
          </ul>
          <Link to="/planner" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">{t("dash.openPlanner")} <ArrowRight className="size-4" /></Link>
        </section>

        <section className="card-soft p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t("dash.attention")}</h2>
            <Link to="/follow-ups" className="text-sm font-medium text-primary">{t("dash.allFollow")}</Link>
          </div>
          {followDue.length === 0 ? <p className="text-sm text-muted-foreground">{t("dash.nothingOverdue")}</p> : (
            <ul className="divide-y">
              {followDue.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center gap-2 py-3 text-sm">
                  <span className="font-semibold">{a.company}</span> <span className="text-muted-foreground">{a.title}</span> {a.is_demo && <DemoBadge />}
                  <span className="ml-auto font-medium text-destructive">{t("dash.due", { d: date(a.next_follow_up) })}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card-soft p-6">
          <h2 className="mb-4 text-lg font-semibold">{t("dash.upcoming")}</h2>
          {interviews.length === 0 ? <p className="text-sm text-muted-foreground">{t("dash.noInterviews")}</p> : (
            <ul className="space-y-3">
              {interviews.slice(0, 4).map((a) => (
                <li key={a.id} className="rounded-xl bg-status-interviewing/50 p-3 text-sm">
                  <div className="flex items-center justify-between font-semibold">{a.company} <StatusBadge status={a.status} /></div>
                  <div className="text-muted-foreground">{dateTime(a.interview_date!)}</div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

function Kpi({ icon: Icon, label, value, warn }: { icon: typeof Send; label: string; value: number; warn?: boolean }) {
  return (
    <div className="card-soft p-5">
      <span className={cn("flex size-10 items-center justify-center rounded-xl", warn ? "bg-warning text-warning-foreground" : "bg-primary-soft text-primary")}><Icon className="size-5" /></span>
      <div className="mt-3 text-2xl font-semibold">{value}</div>
      <div className="text-xs text-muted-foreground sm:text-sm">{label}</div>
    </div>
  );
}
