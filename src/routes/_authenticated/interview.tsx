import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lightbulb, Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/app/AppShell";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useInterviewQuestions, useKeyedMutation, type InterviewQuestion } from "@/lib/data";
import { usePrefs } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/messages";
import { PRACTICE_STATUSES, QUESTION_CATEGORIES, practiceProgress } from "@/lib/skills";
import { cn } from "@/lib/utils";
import { AiCoach } from "@/components/app/AiCoach";

const META = "Practise HTML, CSS, JavaScript, React, TypeScript and HR interview questions with your own answers and practice status.";
export const Route = createFileRoute("/_authenticated/interview")({
  head: () => ({ meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { title: "Interview Preparation — Career Launchpad" }, { name: "description", content: META }, { property: "og:title", content: "Interview Preparation" }, { property: "og:description", content: META }] }),
  component: InterviewPage,
});
const catKey = (c: string) => `iq.cat.${c}` as MessageKey;
const stKey = (s: string) => `iq.st.${s}` as MessageKey;
const stColor: Record<string, string> = { NOT_STARTED: "bg-muted text-muted-foreground", PRACTICING: "bg-primary-soft text-accent-foreground", CONFIDENT: "bg-primary text-primary-foreground" };

function InterviewPage() {
  const { t } = usePrefs();
  const { data: qs = [] } = useInterviewQuestions();
  const [cat, setCat] = useState("ALL");
  const [editing, setEditing] = useState<InterviewQuestion | null | undefined>(undefined);
  const shown = cat === "ALL" ? qs : qs.filter((q) => q.category === cat);
  const pct = practiceProgress(qs);
  return (
    <>
      <PageHeader title={t("nav.interview")} subtitle={t("iq.subtitle")} action={<Button onClick={() => setEditing(null)}><Plus className="size-4" />{t("iq.add")}</Button>} />
      <Button asChild variant="outline" className="mb-5"><Link to="/interview-simulator">{t("ai.simulator")}</Link></Button>
      <section className="card-soft mb-6 p-5">
        <div className="flex justify-between text-sm"><span className="font-semibold">{t("iq.ready")}</span><span className="font-bold text-primary">{pct}%</span></div>
        <Progress value={pct} className="mt-2 h-3" aria-label={t("iq.ready")} />
        <p className="mt-2 text-xs text-muted-foreground">{t("iq.readyText", { c: qs.filter((q) => q.status === "CONFIDENT").length, t: qs.length })}</p>
      </section>
      <div className="mb-4 flex flex-wrap gap-2">
        {["ALL", ...QUESTION_CATEGORIES].map((c) => (
          <button key={c} type="button" aria-pressed={cat === c} onClick={() => setCat(c)}
            className={cn("rounded-full border px-3 py-1 text-xs font-semibold transition", cat === c ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/50")}>
            {c === "ALL" ? t("iq.all") : t(catKey(c))} ({c === "ALL" ? qs.length : qs.filter((q) => q.category === c).length})
          </button>
        ))}
      </div>
      {shown.length === 0 && <p className="card-soft p-8 text-center text-sm text-muted-foreground">{t("iq.empty")}</p>}
      <div className="grid gap-4 lg:grid-cols-2">{shown.map((q) => <QuestionCard key={q.id} q={q} onEdit={() => setEditing(q)} />)}</div>
      <QuestionForm open={editing !== undefined} onOpenChange={(o) => !o && setEditing(undefined)} q={editing ?? undefined} defaultCat={cat === "ALL" ? "HR" : cat} />
    </>
  );
}

function useQuestionText(q?: InterviewQuestion) {
  const { t } = usePrefs();
  return {
    text: q?.question ?? (q?.preset_key ? t(`iq.q.${q.preset_key}` as MessageKey) : ""),
    tip: q?.preset_key ? t(`iq.t.${q.preset_key}` as MessageKey) : null,
  };
}

function QuestionCard({ q, onEdit }: { q: InterviewQuestion; onEdit: () => void }) {
  const { t } = usePrefs();
  const { text, tip } = useQuestionText(q);
  const [delOpen, setDelOpen] = useState(false);
  const setStatus = useKeyedMutation("interview", async (status: string) => supabase.from("interview_questions").update({ status, updated_at: new Date().toISOString() }).eq("id", q.id));
  const del = useKeyedMutation("interview", async () => supabase.from("interview_questions").delete().eq("id", q.id), "common.deleted");
  return (
    <article className="card-soft flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-primary">{t(catKey(q.category))}</span>
          <h2 className="font-semibold leading-snug">{text}</h2>
        </div>
        <span className="flex shrink-0">
          <Button size="icon" variant="ghost" aria-label={t("iq.edit")} onClick={onEdit}><Pencil className="size-4" /></Button>
          <Button size="icon" variant="ghost" aria-label={t("common.delete")} onClick={() => setDelOpen(true)}><Trash2 className="size-4" /></Button>
        </span>
      </div>
      {tip && <p className="flex gap-1.5 text-xs text-muted-foreground"><Lightbulb className="size-3.5 shrink-0 text-primary" /><span><b>{t("iq.tip")}:</b> {tip}</span></p>}
      <p className={cn("whitespace-pre-line text-sm", !q.answer && "italic text-muted-foreground")}>{q.answer || t("iq.noAnswer")}</p>
      <AiCoach question={text} answer={q.answer} />
      <div className="mt-auto flex flex-wrap gap-1.5" role="group" aria-label={t("iq.f.status")}>
        {PRACTICE_STATUSES.map((s) => (
          <button key={s} type="button" aria-pressed={q.status === s} onClick={() => setStatus.mutate(s)}
            className={cn("rounded-full px-3 py-1 text-xs font-semibold transition", q.status === s ? stColor[s] : "border border-border hover:border-primary/50")}>{t(stKey(s))}</button>
        ))}
      </div>
      <AlertDialog open={delOpen} onOpenChange={setDelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{t("iq.deleteTitle")}</AlertDialogTitle><AlertDialogDescription>{t("iq.deleteText")}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel><AlertDialogAction onClick={() => del.mutate(undefined)}>{t("common.delete")}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </article>
  );
}

function QuestionForm({ open, onOpenChange, q, defaultCat }: { open: boolean; onOpenChange: (o: boolean) => void; q?: InterviewQuestion | undefined; defaultCat: string }) {
  const { t } = usePrefs();
  const { text } = useQuestionText(q);
  const init = () => ({ question: text, answer: q?.answer ?? "", category: q?.category ?? defaultCat, status: q?.status ?? "NOT_STARTED" });
  const [f, setF] = useState(init);
  const [err, setErr] = useState(false);
  useEffect(() => { if (open) { setF(init()); setErr(false); } }, [open, q]); // eslint-disable-line react-hooks/exhaustive-deps
  const save = useKeyedMutation("interview", async () => {
    // Keep preset questions translatable unless the wording was actually changed.
    const question = q && q.preset_key && !q.question && f.question.trim() === text ? null : f.question.trim();
    const values = { question, answer: f.answer.trim() || null, category: f.category, status: f.status, updated_at: new Date().toISOString() };
    const r = q ? await supabase.from("interview_questions").update(values).eq("id", q.id) : await supabase.from("interview_questions").insert(values);
    if (!r.error) onOpenChange(false);
    return r;
  }, "iq.saved");
  const sel = (k: "category" | "status", label: MessageKey, opts: readonly string[], key: (s: string) => MessageKey) => (
    <div className="space-y-1.5"><Label>{t(label)}</Label>
      <Select value={f[k]} onValueChange={(v) => setF({ ...f, [k]: v })}><SelectTrigger aria-label={t(label)}><SelectValue /></SelectTrigger><SelectContent>{opts.map((o) => <SelectItem key={o} value={o}>{t(key(o))}</SelectItem>)}</SelectContent></Select></div>
  );
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader><DialogTitle>{t(q ? "iq.edit" : "iq.add")}</DialogTitle></DialogHeader>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (!f.question.trim()) return setErr(true); save.mutate(undefined); }}>
          <div className="space-y-1.5"><Label htmlFor="iq-q">{t("iq.f.question")}</Label><Textarea id="iq-q" rows={2} value={f.question} onChange={(e) => setF({ ...f, question: e.target.value })} />{err && <p className="text-xs font-medium text-destructive">{t("common.required")}</p>}</div>
          <div className="grid gap-4 sm:grid-cols-2">{sel("category", "iq.f.category", QUESTION_CATEGORIES, catKey)}{sel("status", "iq.f.status", PRACTICE_STATUSES, stKey)}</div>
          <div className="space-y-1.5"><Label htmlFor="iq-a">{t("iq.f.answer")}</Label><Textarea id="iq-a" rows={7} value={f.answer} onChange={(e) => setF({ ...f, answer: e.target.value })} /></div>
          <DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button><Button type="submit" disabled={save.isPending}>{save.isPending ? t("common.saving") : t("common.save")}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
