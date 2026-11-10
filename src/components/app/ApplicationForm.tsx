import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STATUSES, computeFollowUp } from "@/lib/followup";
import { usePrefs } from "@/lib/i18n";
import { arrKey, statusKey } from "@/components/app/StatusBadge";
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
  const { t } = usePrefs();

  useEffect(() => { if (open) { setF({ ...toForm(application), ...(application ? {} : (defaults ?? {})) } as F); setErrors({}); } }, [open, application]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k: Field) => (e: { target: { value: string } }) => setF((p) => ({ ...p, [k]: e.target.value }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const err: Partial<Record<Field, string>> = {};
    if (!f.company.trim()) err.company = t("common.required");
    if (!f.title.trim()) err.title = t("common.required");
    if (!isUrl(f.website)) err.website = t("form.badUrl");
    if (!isUrl(f.job_url)) err.job_url = t("form.badUrl");
    if (f.recruiter_email && !/^\S+@\S+\.\S+$/.test(f.recruiter_email)) err.recruiter_email = t("form.badEmail");
    if (f.salary_min && f.salary_max && Number(f.salary_min) > Number(f.salary_max)) err.salary_max = t("form.badSalary");
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
        <DialogHeader><DialogTitle>{t(application ? "form.edit" : "form.new")}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            {field("company", t("form.company"))}
            {field("title", t("form.title"))}
            {field("website", t("form.website"), "url", { placeholder: "https://" })}
            {field("job_url", t("form.jobUrl"), "url", { placeholder: "https://" })}
            {field("location", t("form.location"), "text", { placeholder: "Stockholm" })}
            <div className="space-y-1.5">
              <Label>{t("form.arrangement")}</Label>
              <Select value={f.arrangement} onValueChange={(v) => setF((p) => ({ ...p, arrangement: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["Remote", "Hybrid", "On-site"].map((x) => <SelectItem key={x} value={x}>{t(arrKey(x))}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {field("salary_min", t("form.salaryMin"), "number", { min: 0 })}
            {field("salary_max", t("form.salaryMax"), "number", { min: 0 })}
            <div className="space-y-1.5">
              <Label>{t("form.status")}</Label>
              <Select value={f.status} onValueChange={(v) => setF((p) => ({ ...p, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((x) => <SelectItem key={x} value={x}>{t(statusKey(x))}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {field("applied_date", t("form.applied"), "date")}
            {field("last_contact_date", t("form.lastContact"), "date")}
            <div className="space-y-1.5">
              {field("next_follow_up", t("form.nextFollow"), "date")}
              <p className="text-xs text-muted-foreground">{t("form.nextHint")}</p>
            </div>
            {field("interview_date", t("form.interview"), "datetime-local")}
            {field("cv_version", t("form.cv"))}
            {field("recruiter_name", t("form.recName"))}
            {field("recruiter_email", t("form.recEmail"), "email")}
            {field("recruiter_phone", t("form.recPhone"), "tel")}
          </div>
          <div className="space-y-1.5"><Label htmlFor="cover_letter">{t("form.cover")}</Label><Textarea id="cover_letter" rows={3} value={f.cover_letter} onChange={set("cover_letter")} /></div>
          <div className="space-y-1.5"><Label htmlFor="notes">{t("form.notes")}</Label><Textarea id="notes" rows={3} value={f.notes} onChange={set("notes")} /></div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
            <Button type="submit" disabled={save.isPending}>{save.isPending ? t("common.saving") : t("common.save")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
