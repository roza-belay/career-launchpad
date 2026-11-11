import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, CalendarClock, Check, Copy, History, Mail } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/AppShell";
import { DemoBadge, StatusBadge } from "@/components/app/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { followUpState, toISODate } from "@/lib/followup";
import { useApplications, useConfirmFollowUp, useFollowUps, useUpdateApplication, type Application } from "@/lib/data";
import { cn } from "@/lib/utils";
import { usePrefs } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/follow-ups")({
  head: () => ({ meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { title: "Follow-ups — Career Launchpad" }, { name: "description", content: "Upcoming and overdue follow-ups." }, { property: "og:title", content: "Follow-ups" }, { property: "og:description", content: "Upcoming and overdue follow-ups." }] }),
  component: FollowUpsPage,
});

const TEMPLATES = [["tpl.t1", "tpl.b1"], ["tpl.t2", "tpl.b2"], ["tpl.t3", "tpl.b3"]] as const;

function FollowUpsPage() {
  const { data: apps = [] } = useApplications();
  const { data: history = [] } = useFollowUps();
  const { t, date } = usePrefs();
  const [confirm, setConfirm] = useState<Application | null>(null);
  const [template, setTemplate] = useState<Application | null>(null);

  const active = apps.map((a) => ({ a, s: followUpState(a) })).filter((x) => x.s !== "none").sort((x, y) => (x.a.next_follow_up! < y.a.next_follow_up! ? -1 : 1));
  const overdue = active.filter((x) => x.s === "overdue" || x.s === "today");
  const upcoming = active.filter((x) => x.s === "upcoming");
  const byId = new Map(apps.map((a) => [a.id, a]));

  return (
    <>
      <PageHeader title={t("fu.title")} subtitle={t("fu.subtitle")} />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat icon={AlertTriangle} label={t("fu.attention")} value={overdue.length} tone="warn" />
        <Stat icon={CalendarClock} label={t("fu.upcoming")} value={upcoming.length} />
        <Stat icon={History} label={t("fu.sent")} value={history.length} />
      </div>
      <Tabs defaultValue="due">
        <TabsList>
          <TabsTrigger value="due">{t("fu.tabDue", { n: overdue.length })}</TabsTrigger>
          <TabsTrigger value="upcoming">{t("fu.tabUpcoming", { n: upcoming.length })}</TabsTrigger>
          <TabsTrigger value="history">{t("fu.tabHistory")}</TabsTrigger>
        </TabsList>
        <TabsContent value="due" className="mt-4 space-y-3">
          {overdue.length === 0 ? <EmptyNote text={t("fu.caughtUp")} /> :
            overdue.map(({ a, s }) => <Row key={a.id} a={a} state={s} onConfirm={() => setConfirm(a)} onTemplate={() => setTemplate(a)} />)}
        </TabsContent>
        <TabsContent value="upcoming" className="mt-4 space-y-3">
          {upcoming.length === 0 ? <EmptyNote text={t("fu.noUpcoming")} /> :
            upcoming.map(({ a, s }) => <Row key={a.id} a={a} state={s} onConfirm={() => setConfirm(a)} onTemplate={() => setTemplate(a)} />)}
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          {history.length === 0 ? <EmptyNote text={t("fu.noHistory")} /> : (
            <div className="card-soft divide-y">
              {history.map((h) => { const a = byId.get(h.application_id); return (
                <div key={h.id} className="flex flex-wrap items-center gap-3 p-4 text-sm">
                  <Check className="size-4 text-status-offer-fg" />
                  <span className="font-semibold">{a?.company ?? t("fu.deletedApp")}</span>
                  <span className="text-muted-foreground">{a?.title}</span>
                  <span className="ml-auto text-muted-foreground">{date(h.followed_up_on)}</span>
                  {h.note && <p className="w-full pl-7 text-muted-foreground">{h.note}</p>}
                </div>
              ); })}
            </div>
          )}
        </TabsContent>
      </Tabs>
      <ConfirmDialog app={confirm} onClose={() => setConfirm(null)} />
      <TemplateDialog app={template} onClose={() => setTemplate(null)} />
    </>
  );
}

function Row({ a, state, onConfirm, onTemplate }: { a: Application; state: string; onConfirm: () => void; onTemplate: () => void }) {
  const update = useUpdateApplication();
  const { t, date } = usePrefs();
  return (
    <div className={cn("card-soft flex flex-wrap items-center gap-4 p-4", state !== "upcoming" && "border-warning-foreground/30 bg-warning/40")}>
      <div className="min-w-48 flex-1">
        <div className="flex flex-wrap items-center gap-2 font-semibold">{a.company} <StatusBadge status={a.status} /> {a.is_demo && <DemoBadge />}</div>
        <div className="text-sm text-muted-foreground">{a.title} · {t("fu.lastContact", { d: date(a.last_contact_date) })}</div>
      </div>
      <div className="flex items-center gap-2">
        <Label htmlFor={`d-${a.id}`} className="text-xs text-muted-foreground">{t(state === "overdue" ? "fu.overdueSince" : state === "today" ? "fu.dueToday" : "fu.due")}</Label>
        <Input id={`d-${a.id}`} type="date" className="w-40" value={a.next_follow_up ?? ""} onChange={(e) => e.target.value && update.mutate({ id: a.id, values: { next_follow_up: e.target.value } })} />
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onTemplate}><Mail className="size-4" /> {t("fu.template")}</Button>
        <Button size="sm" onClick={onConfirm}><Check className="size-4" /> {t("fu.followedUp")}</Button>
      </div>
    </div>
  );
}

function ConfirmDialog({ app, onClose }: { app: Application | null; onClose: () => void }) {
  const [date, setDate] = useState(toISODate(new Date()));
  const [note, setNote] = useState("");
  const m = useConfirmFollowUp();
  const { t } = usePrefs();
  return (
    <Dialog open={!!app} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{t("fu.confirmTitle", { c: app?.company ?? "" })}</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">{t("fu.confirmDesc")}</p>
        <div className="space-y-3">
          <div className="space-y-1.5"><Label htmlFor="fd">{t("fu.date")}</Label><Input id="fd" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="fn">{t("fu.note")}</Label><Textarea id="fn" value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("fu.notePh")} /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>{t("common.cancel")}</Button>
          <Button disabled={!date || m.isPending} onClick={() => app && m.mutate({ application_id: app.id, date, note }, { onSuccess: () => { setNote(""); onClose(); } })}>{t("common.confirm")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TemplateDialog({ app, onClose }: { app: Application | null; onClose: () => void }) {
  const { t } = usePrefs();
  return (
    <Dialog open={!!app} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>{t("fu.templatesTitle")}</DialogTitle></DialogHeader>
        {app && TEMPLATES.map(([nameKey, bodyKey]) => { const body = t(bodyKey, { title: app.title, company: app.company, name: app.recruiter_name ?? t("tpl.there") }).replace(" ,\n", ",\n"); return (
          <div key={nameKey} className="rounded-xl border p-4">
            <div className="mb-2 flex items-center justify-between"><span className="text-sm font-semibold">{t(nameKey)}</span>
              <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(body); toast.success(t("common.copied")); }}><Copy className="size-4" /> {t("common.copy")}</Button></div>
            <pre className="whitespace-pre-wrap font-sans text-sm text-muted-foreground">{body}</pre>
          </div>
        ); })}
      </DialogContent>
    </Dialog>
  );
}

function Stat({ icon: Icon, label, value, tone }: { icon: typeof Check; label: string; value: number; tone?: "warn" }) {
  return (
    <div className="card-soft flex items-center gap-4 p-5">
      <span className={cn("flex size-11 items-center justify-center rounded-xl", tone ? "bg-warning text-warning-foreground" : "bg-primary-soft text-primary")}><Icon className="size-5" /></span>
      <div><div className="text-2xl font-semibold">{value}</div><div className="text-sm text-muted-foreground">{label}</div></div>
    </div>
  );
}
function EmptyNote({ text }: { text: string }) {
  return <div className="card-soft p-10 text-center text-sm text-muted-foreground">{text}</div>;
}
