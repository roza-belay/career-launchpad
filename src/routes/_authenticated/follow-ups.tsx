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

export const Route = createFileRoute("/_authenticated/follow-ups")({
  head: () => ({ meta: [{ title: "Follow-ups — Career Launchpad" }, { name: "description", content: "Upcoming and overdue follow-ups." }, { property: "og:title", content: "Follow-ups" }, { property: "og:description", content: "Upcoming and overdue follow-ups." }] }),
  component: FollowUpsPage,
});

const TEMPLATES = [
  { name: "After applying (1 week)", body: (a: Application) => `Subject: Following up on my application – ${a.title}\n\nHi ${a.recruiter_name ?? "there"},\n\nI hope you're well. I applied for the ${a.title} position at ${a.company} last week and wanted to follow up to reaffirm my interest. With my background in React, TypeScript and a recent fullstack internship, I'm confident I could contribute to your team.\n\nPlease let me know if you need anything further from me.\n\nBest regards,\nRoza` },
  { name: "After an interview", body: (a: Application) => `Subject: Thank you – ${a.title} interview\n\nHi ${a.recruiter_name ?? "there"},\n\nThank you for taking the time to speak with me about the ${a.title} role at ${a.company}. I enjoyed learning more about the team and I'm even more excited about the opportunity.\n\nI look forward to hearing about the next steps.\n\nKind regards,\nRoza` },
  { name: "Checking on status", body: (a: Application) => `Subject: Status of my application – ${a.title}\n\nHi ${a.recruiter_name ?? "there"},\n\nI wanted to kindly check in on the status of my application for the ${a.title} position at ${a.company}. I remain very interested and would be happy to share more about my projects.\n\nThank you for your time.\n\nBest regards,\nRoza` },
];

function FollowUpsPage() {
  const { data: apps = [] } = useApplications();
  const { data: history = [] } = useFollowUps();
  const [confirm, setConfirm] = useState<Application | null>(null);
  const [template, setTemplate] = useState<Application | null>(null);

  const active = apps.map((a) => ({ a, s: followUpState(a) })).filter((x) => x.s !== "none").sort((x, y) => (x.a.next_follow_up! < y.a.next_follow_up! ? -1 : 1));
  const overdue = active.filter((x) => x.s === "overdue" || x.s === "today");
  const upcoming = active.filter((x) => x.s === "upcoming");
  const byId = new Map(apps.map((a) => [a.id, a]));

  return (
    <>
      <PageHeader title="Follow-ups" subtitle="Follow-ups are set 7 days after your last contact. Nothing is marked as done until you confirm it." />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat icon={AlertTriangle} label="Needs attention" value={overdue.length} tone="warn" />
        <Stat icon={CalendarClock} label="Upcoming" value={upcoming.length} />
        <Stat icon={History} label="Follow-ups sent" value={history.length} />
      </div>
      <Tabs defaultValue="due">
        <TabsList>
          <TabsTrigger value="due">Due & overdue ({overdue.length})</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <TabsContent value="due" className="mt-4 space-y-3">
          {overdue.length === 0 ? <EmptyNote text="You're all caught up — no follow-ups due today." /> :
            overdue.map(({ a, s }) => <Row key={a.id} a={a} state={s} onConfirm={() => setConfirm(a)} onTemplate={() => setTemplate(a)} />)}
        </TabsContent>
        <TabsContent value="upcoming" className="mt-4 space-y-3">
          {upcoming.length === 0 ? <EmptyNote text="No upcoming follow-ups. Add a last-contact date to an application to schedule one." /> :
            upcoming.map(({ a, s }) => <Row key={a.id} a={a} state={s} onConfirm={() => setConfirm(a)} onTemplate={() => setTemplate(a)} />)}
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          {history.length === 0 ? <EmptyNote text="No confirmed follow-ups yet." /> : (
            <div className="card-soft divide-y">
              {history.map((h) => { const a = byId.get(h.application_id); return (
                <div key={h.id} className="flex flex-wrap items-center gap-3 p-4 text-sm">
                  <Check className="size-4 text-status-offer-fg" />
                  <span className="font-semibold">{a?.company ?? "Deleted"}</span>
                  <span className="text-muted-foreground">{a?.title}</span>
                  <span className="ml-auto text-muted-foreground">{h.followed_up_on}</span>
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
  return (
    <div className={cn("card-soft flex flex-wrap items-center gap-4 p-4", state !== "upcoming" && "border-warning-foreground/30 bg-warning/40")}>
      <div className="min-w-48 flex-1">
        <div className="flex flex-wrap items-center gap-2 font-semibold">{a.company} <StatusBadge status={a.status} /> {a.is_demo && <DemoBadge />}</div>
        <div className="text-sm text-muted-foreground">{a.title} · last contact {a.last_contact_date ?? "—"}</div>
      </div>
      <div className="flex items-center gap-2">
        <Label htmlFor={`d-${a.id}`} className="text-xs text-muted-foreground">{state === "overdue" ? "Overdue since" : state === "today" ? "Due today" : "Due"}</Label>
        <Input id={`d-${a.id}`} type="date" className="w-40" value={a.next_follow_up ?? ""} onChange={(e) => e.target.value && update.mutate({ id: a.id, values: { next_follow_up: e.target.value } })} />
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onTemplate}><Mail className="size-4" /> Email template</Button>
        <Button size="sm" onClick={onConfirm}><Check className="size-4" /> I followed up</Button>
      </div>
    </div>
  );
}

function ConfirmDialog({ app, onClose }: { app: Application | null; onClose: () => void }) {
  const [date, setDate] = useState(toISODate(new Date()));
  const [note, setNote] = useState("");
  const m = useConfirmFollowUp();
  return (
    <Dialog open={!!app} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Confirm follow-up with {app?.company}</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">This logs the follow-up, updates last contact and schedules the next one 7 days later.</p>
        <div className="space-y-3">
          <div className="space-y-1.5"><Label htmlFor="fd">Date</Label><Input id="fd" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="fn">Note (optional)</Label><Textarea id="fn" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Sent email to recruiter…" /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button disabled={!date || m.isPending} onClick={() => app && m.mutate({ application_id: app.id, date, note }, { onSuccess: () => { setNote(""); onClose(); } })}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TemplateDialog({ app, onClose }: { app: Application | null; onClose: () => void }) {
  return (
    <Dialog open={!!app} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>Follow-up email templates</DialogTitle></DialogHeader>
        {app && TEMPLATES.map((t) => { const body = t.body(app); return (
          <div key={t.name} className="rounded-xl border p-4">
            <div className="mb-2 flex items-center justify-between"><span className="text-sm font-semibold">{t.name}</span>
              <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(body); toast.success("Copied"); }}><Copy className="size-4" /> Copy</Button></div>
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
