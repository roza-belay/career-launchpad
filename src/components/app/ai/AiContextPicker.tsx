import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCareerProfile, useCvDocuments, useSkills, useVacancies } from "@/lib/data";
import { privateCv, type AiContext } from "@/lib/ai/contracts";
import { supabase } from "@/integrations/supabase/client";
import { usePrefs } from "@/lib/i18n";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function AiContextPicker({
  value,
  onChange,
  consent,
  onConsent,
  disabled = false,
  career = false,
  hideCv = false,
}: {
  value: AiContext;
  onChange: (v: AiContext) => void;
  consent: boolean;
  onConsent: (v: boolean) => void;
  disabled?: boolean;
  career?: boolean;
  hideCv?: boolean;
}) {
  const { t } = usePrefs();
  const { data: cvs = [] } = useCvDocuments();
  const { data: jobs = [] } = useVacancies();
  const { data: profile } = useCareerProfile();
  const { data: skills } = useSkills();
  const { data: goals = [] } = useQuery({
    queryKey: ["growth"],
    queryFn: async () => {
      const r = await supabase.from("growth_items").select("*").order("created_at");
      if (r.error) throw r.error;
      return r.data;
    },
  });
  const [preview, setPreview] = useState(false);
  const change = (patch: Partial<AiContext>) => {
    onChange({ ...value, ...patch });
    onConsent(false);
  };
  const selected: Record<string, unknown> = {};
  if (value.profile)
    selected[t("ai.profile")] = profile
      ? {
          headline: profile.headline,
          summary: profile.summary,
          preferred_roles: profile.preferred_roles,
        }
      : null;
  if (value.skills)
    selected[t("ai.skills")] = skills?.skills.map((s) => ({
      name: s.name,
      level: s.level,
      progress: s.progress,
    }));
  if (value.goals)
    selected[t("ai.goals")] = goals
      .filter((g) => g.hub === "ROADMAP")
      .map((g) => ({
        title: g.title,
        details: g.details,
        status: g.status,
        target_date: g.target_date,
      }));
  const cv = cvs.find((c) => c.id === value.cvId);
  if (cv) selected[t("ai.cv")] = privateCv(cv.content);
  const job = jobs.find((j) => j.id === value.vacancyId);
  if (job)
    selected[t("ai.job")] = { title: job.title, description: job.description, skills: job.skills };
  if (value.jobText) selected[t("ai.jobPaste")] = value.jobText;
  return (
    <section className="space-y-3 border-b pb-5">
      <h2 className="text-sm font-semibold">{t("ai.context")}</h2>
      {career && (
        <div className="flex flex-wrap gap-4">
          {(["profile", "skills", "goals"] as const).map((k) => (
            <Label key={k} className="flex items-center gap-2">
              <Checkbox
                disabled={disabled}
                checked={value[k]}
                onCheckedChange={(v) => change({ [k]: v === true })}
              />
              {t(`ai.${k}`)}
            </Label>
          ))}
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {!hideCv && <div className="space-y-1">
          <Label>{t("ai.cv")}</Label>
          <Select
            disabled={disabled}
            value={value.cvId ?? "none"}
            onValueChange={(v) => change({ cvId: v === "none" ? undefined : v })}
          >
            <SelectTrigger aria-label={t("ai.cv")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t("ai.none")}</SelectItem>
              {cvs.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>}
        <div className="space-y-1">
          <Label>{t("ai.job")}</Label>
          <Select
            disabled={disabled}
            value={value.vacancyId ?? "none"}
            onValueChange={(v) => change({ vacancyId: v === "none" ? undefined : v })}
          >
            <SelectTrigger aria-label={t("ai.job")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t("ai.none")}</SelectItem>
              {jobs.map((j) => (
                <SelectItem key={j.id} value={j.id}>
                  {j.title} — {j.company}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Textarea
        disabled={disabled}
        rows={3}
        maxLength={20000}
        aria-label={t("ai.jobPaste")}
        placeholder={t("ai.jobPaste")}
        value={value.jobText}
        onChange={(e) => change({ jobText: e.target.value })}
      />
      <Button size="sm" variant="ghost" onClick={() => setPreview(!preview)}>
        {t("ai.preview")}
      </Button>
      {preview && (
        <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-md bg-muted p-3 text-xs">
          {Object.keys(selected).length ? JSON.stringify(selected, null, 2) : t("ai.previewEmpty")}
        </pre>
      )}
      <p className="text-xs text-muted-foreground">{t("ai.contactNotice")}</p>
      <Label className="flex items-start gap-2 leading-relaxed">
        <Checkbox
          disabled={disabled}
          checked={consent}
          onCheckedChange={(v) => onConsent(v === true)}
        />
        <span>{t("ai.consent")}</span>
      </Label>
    </section>
  );
}
