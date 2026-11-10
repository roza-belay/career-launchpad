import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STATUSES, computeFollowUp } from "@/lib/followup";
import { useSaveApplication, type Application, type ApplicationInput } from "@/lib/data";

const FIELDS = ["company","title","website","job_url","location","arrangement","salary_min","salary_max","applied_date","last_contact_date","next_follow_up","status","recruiter_name","recruiter_email","recruiter_phone","notes","cv_version","cover_letter","interview_date"] as const;
type Field = (typeof FIELDS)[number];
type F = Record<Field, string>;

function toForm(a?: Application | null): F {
  const f = {} as F;
  for (const k of FIELDS) {
    const v = a ? (a as Record<string, unknown>)[k] : undefined;
    f[k] = v == null ? "" : String(v);
  }
  if (f.interview_date) f.interview_date = f.interview_date.slice(0, 16);
  if (!a) { f.status = "SAVED"; f.arrangement = "Hybrid"; }
  return f;
}

const isUrl = (s: string) => !s || /^https?:\/\/\S+\.\S+/.test(s);

export function ApplicationForm({ open, onOpenChange, application, defaults }: {
  open: boolean; onOpenChange: (o: boolean) => void; application?: Application | null; defaults?: Partial<F>;
}) {
  const [f, setF] = useState<F>(toForm(application));
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const save = useSaveApplication();

  useEffect(() => { if (open) { setF({ ...toForm(application), ...(application ? {} : (defaults ?? {})) } as F); setErrors({}); } }, [open, application]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k: Field) => (e: { target: { value: string } }) => setF((p) => ({ ...p, [k]: e.target.value }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const err: Partial<Record<Field, string>> = {};
    if (!f.company.trim()) err.company = "Required";
    if (!f.title.trim()) err.title = "Required";
    if (!isUrl(f.website)) err.website = "Use a full URL (https://…)";
    if (!isUrl(f.job_url)) err.job_url = "Use a full URL (https://…)";
    if (f.recruiter_email && !/^\S+@\S+\.\S+$/.test(f.recruiter_email)) err.recruiter_email = "Invalid email";
    if (f.salary_min && f.salary_max && Number(f.salary_min) > Number(f.salary_max)) err.salary_max = "Must be ≥ minimum";
    setErrors(err);
    if (Object.keys(err).length) return;
    const n = (s: string) => (s ? Number(s) : null);
    const s = (v: string) => (v.trim() ? v.trim() : null);
    const values: ApplicationInput = {
      company: f.company.trim(), title: f.title.trim(), website: s(f.website), job_url: s(f.job_url), location: s(f.location),
      arrangement: f.arrangement, salary_min: n(f.salary_min), salary_max: n(f.salary_max), applied_date: s(f.applied_date),
      last_contact_date: s(f.last_contact_date), next_follow_up: s(f.next_follow_up) ?? computeFollowUp(s(f.last_contact_date)),
      status: f.status as NonNullable<ApplicationInput["status"]>, recruiter_name: s(f.recruiter_name), recruiter_email: s(f.recruiter_email),
      recruiter_phone: s(f.recruiter_phone), notes: s(f.notes), cv_version: s(f.cv_version), cover_letter: s(f.cover_letter),
      interview_date: f.interview_date ? new Date(f.interview_date).toISOString() : null,
    };
    save.mutate({ ...(application ? { id: application.id } : {}), values }, { onSuccess: () => onOpenChange(false) });
  }

  const field = (k: Field, label: string, type = "text", props: Record<string, unknown> = {}) => (
    <div className="space-y-1.5">
      <Label htmlFor={k}>{label}</Label>
      <Input id={k} type={type} value={f[k]} onChange={set(k)} {...props} />
      {errors[k] && <p className="text-xs text-destructive">{errors[k]}</p>}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>{application ? "Edit application" : "New application"}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            {field("company", "Company name *")}
            {field("title", "Job title *")}
            {field("website", "Company website", "url", { placeholder: "https://" })}
            {field("job_url", "Job advertisement URL", "url", { placeholder: "https://" })}
            {field("location", "Location", "text", { placeholder: "Stockholm" })}
            <div className="space-y-1.5">
              <Label>Work arrangement</Label>
              <Select value={f.arrangement} onValueChange={(v) => setF((p) => ({ ...p, arrangement: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["Remote", "Hybrid", "On-site"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {field("salary_min", "Salary min (SEK / month)", "number", { min: 0 })}
            {field("salary_max", "Salary max (SEK / month)", "number", { min: 0 })}
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={f.status} onValueChange={(v) => setF((p) => ({ ...p, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {field("applied_date", "Application date", "date")}
            {field("last_contact_date", "Last contact date", "date")}
            <div className="space-y-1.5">
              {field("next_follow_up", "Next follow-up", "date")}
              <p className="text-xs text-muted-foreground">Leave empty to set 7 days after last contact.</p>
            </div>
            {field("interview_date", "Interview date", "datetime-local")}
            {field("cv_version", "CV version used")}
            {field("recruiter_name", "Recruiter name")}
            {field("recruiter_email", "Recruiter email", "email")}
            {field("recruiter_phone", "Recruiter phone", "tel")}
          </div>
          <div className="space-y-1.5"><Label htmlFor="cover_letter">Cover letter</Label><Textarea id="cover_letter" rows={3} value={f.cover_letter} onChange={set("cover_letter")} /></div>
          <div className="space-y-1.5"><Label htmlFor="notes">Notes</Label><Textarea id="notes" rows={3} value={f.notes} onChange={set("notes")} /></div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
