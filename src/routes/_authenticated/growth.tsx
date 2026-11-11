import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useKeyedMutation } from "@/lib/data";
import { GROWTH_HUBS, GROWTH_STATUSES, growthProgress, nextSteps, type GrowthHub } from "@/lib/growth";
import { usePrefs } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils";

const META = "Career change, strengths, LinkedIn, salary growth, entrepreneurship and a personal career roadmap.";
export const Route = createFileRoute("/_authenticated/growth")({
  head: () => ({ meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { title: "Career Growth Hub — Career Launchpad" }, { name: "description", content: META }, { property: "og:title", content: "Career Growth Hub" }, { property: "og:description", content: META }] }),
  component: GrowthPage,
});

const LINKS = [
  { to: "/documents", k: "gr.link.cv" }, { to: "/interview", k: "gr.link.interview" },
  { to: "/skills", k: "gr.link.skills" }, { to: "/opportunities", k: "gr.link.jobs" },
] as const;
const hk = (h: string, s: string) => `gr.${h}.${s}` as MessageKey;

function useGrowth() {
  return useQuery({ queryKey: ["growth"], queryFn: async () => {
    const { data, error } = await supabase.from("growth_items").select("*").order("created_at");
    if (error) throw error; return data;
  } });
}

function GrowthPage() {
  const { t, date } = usePrefs();
  const { data: items = [] } = useGrowth();
  const [hub, setHub] = useState<GrowthHub>("ROADMAP");
  const today = new Date().toISOString().slice(0, 10);
  const steps = nextSteps(items, today);
  const shown = items.filter((i) => i.hub === hub);
  const [title, setTitle] = useState(""); const [details, setDetails] = useState(""); const [due, setDue] = useState("");
  const add = useKeyedMutation("growth", async () => supabase.from("growth_items").insert({ hub, title: title.trim(), details: details.trim() || null, target_date: due || null }), "gr.added");
  const upd = useKeyedMutation("growth", async (v: { id: string; status: string }) => supabase.from("growth_items").update({ status: v.status, updated_at: new Date().toISOString() }).eq("id", v.id));
  const del = useKeyedMutation("growth", async (id: string) => supabase.from("growth_items").delete().eq("id", id), "common.deleted");

  return (
    <>
      <PageHeader title={t("nav.growth")} subtitle={t("gr.subtitle")} />
      <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <section className="card-soft p-5">
          <div className="flex justify-between text-sm"><span className="font-semibold">{t("gr.overall")}</span><span className="font-bold text-primary">{growthProgress(items)}%</span></div>
          <Progress value={growthProgress(items)} className="mt-2 h-3" aria-label={t("gr.overall")} />
          <h2 className="mt-4 text-sm font-semibold">{t("gr.next")}</h2>
          <ul className="mt-2 space-y-1.5 text-sm">
            {steps.length === 0 && <li className="text-muted-foreground">{t("gr.allGood")}</li>}
            {steps.map((s) => (
              <li key={s.kind + s.hub}><button className="text-left hover:text-primary" onClick={() => setHub(s.hub)}>
                → {t(s.kind === "start" ? "gr.step.start" : "gr.step.overdue", { h: t(hk(s.hub, "name")) })}</button></li>
            ))}
          </ul>
        </section>
        <section className="grid gap-3 sm:grid-cols-2">
          {LINKS.map((l) => (
            <Link key={l.to} to={l.to} className="card-soft flex items-center justify-between p-4 text-sm font-medium hover:border-primary/50">
              {t(l.k)}<ArrowRight className="size-4 text-primary" />
            </Link>
          ))}
        </section>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5" role="tablist">
        {GROWTH_HUBS.map((h) => (
          <button key={h} role="tab" aria-selected={hub === h} onClick={() => setHub(h)}
            className={cn("rounded-full px-3 py-1.5 text-sm font-medium transition", hub === h ? "bg-primary text-primary-foreground" : "border border-border hover:border-primary/50")}>
            {t(hk(h, "name"))}</button>
        ))}
      </div>
      <section className="card-soft mb-4 space-y-3 p-5">
        <p className="text-sm text-muted-foreground">{t(hk(hub, "intro"))}</p>
        <div className="grid gap-2 sm:grid-cols-[1fr_180px]">
          <Input placeholder={t(hk(hub, "ph"))} value={title} onChange={(e) => setTitle(e.target.value)} aria-label={t("gr.title")} />
          <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} aria-label={t("gr.due")} />
        </div>
        <Textarea rows={2} placeholder={t("gr.details")} value={details} onChange={(e) => setDetails(e.target.value)} aria-label={t("gr.details")} />
        <Button disabled={!title.trim() || add.isPending} onClick={() => add.mutate(undefined, { onSuccess: () => { setTitle(""); setDetails(""); setDue(""); } })}><Plus className="size-4" />{t("gr.add")}</Button>
      </section>
      <div className="grid gap-3 md:grid-cols-2">
        {shown.length === 0 && <p className="text-sm text-muted-foreground">{t("gr.empty")}</p>}
        {shown.map((i) => (
          <article key={i.id} className="card-soft space-y-2 p-4">
            <div className="flex items-start justify-between gap-2">
              <h3 className={cn("font-semibold", i.status === "DONE" && "line-through opacity-70")}>{i.title}</h3>
              <Button size="icon" variant="ghost" aria-label={t("common.delete")} onClick={() => del.mutate(i.id)}><Trash2 className="size-4" /></Button>
            </div>
            {i.details && <p className="whitespace-pre-line text-sm text-muted-foreground">{i.details}</p>}
            {i.target_date && <p className={cn("text-xs", i.status !== "DONE" && i.target_date < today ? "font-semibold text-destructive" : "text-muted-foreground")}>{t("gr.due")}: {date(i.target_date)}</p>}
            <div className="flex gap-1.5">
              {GROWTH_STATUSES.map((s) => (
                <button key={s} aria-pressed={i.status === s} onClick={() => upd.mutate({ id: i.id, status: s })}
                  className={cn("rounded-full px-3 py-1 text-xs font-semibold", i.status === s ? "bg-primary text-primary-foreground" : "border border-border")}>{t(`gr.st.${s}` as MessageKey)}</button>
              ))}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
