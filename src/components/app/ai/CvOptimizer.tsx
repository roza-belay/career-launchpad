import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { usePrefs } from "@/lib/i18n";
import { aiTask } from "@/lib/ai/tasks.functions";
import { applySuggestion, EMPTY_CONTEXT, privateCv, type AiContext } from "@/lib/ai/contracts";
import type { CvContent } from "@/lib/cv";
import { useCvMutation } from "@/lib/data";
import { supabase } from "@/integrations/supabase/client";
import { AiContextPicker } from "./AiContextPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { z } from "zod";
import type { optimizationSchema } from "@/lib/ai/contracts";

type Analysis = z.infer<typeof optimizationSchema>;
export function CvOptimizer({
  cv,
  language,
  onChange,
  onCreated,
}: {
  cv: CvContent;
  language: string;
  onChange: (v: CvContent) => void;
  onCreated: (id: string) => void;
}) {
  const { t, lang } = usePrefs();
  const run = useServerFn(aiTask);
  const [context, setContext] = useState<AiContext>(EMPTY_CONTEXT);
  const [consent, setConsent] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [applied, setApplied] = useState<number[]>([]);
  const locked = useRef(false);
  const save = useCvMutation(async () => {
    const r = await supabase
      .from("cv_documents")
      .insert({ name: name.trim(), language, kind: "tailored", content: cv })
      .select("id")
      .single();
    if (!r.error && r.data) onCreated(r.data.id);
    return r;
  }, "ai.saved");
  async function analyze() {
    if (locked.current || !consent) return;
    locked.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await run({
        data: {
          operation: "optimize",
          lang,
          context: { ...context, cvId: undefined },
          source: cv,
          text: "",
          role: "",
          focus: "mixed",
          turns: [],
        },
      });
      if (result.kind === "optimize") {
        setAnalysis(result.value);
        setApplied([]);
      } else
        setError(
          t(result.kind === "error" && result.error === "credits" ? "ai.credits" : "ai.failed"),
        );
    } catch {
      setError(t("ai.failed"));
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  return (
    <section className="space-y-5 border-y py-5">
      <h2 className="text-lg font-semibold">{t("ai.optimizer")}</h2>
      <p className="text-sm text-muted-foreground">{t("ai.reviewFacts")}</p>
      <details>
        <summary className="cursor-pointer text-sm font-medium">{t("ai.source")}</summary>
        <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words bg-muted p-3 text-xs">
          {JSON.stringify(privateCv(cv), null, 2)}
        </pre>
      </details>
      <AiContextPicker
        value={context}
        onChange={setContext}
        consent={consent}
        onConsent={setConsent}
        disabled={busy}
      />
      <Button
        disabled={busy || !consent || (!context.vacancyId && !context.jobText.trim())}
        onClick={analyze}
      >
        {t(busy ? "ai.thinking" : "ai.analyze")}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {analysis && (
        <>
          <h3 className="font-semibold">{t("ai.analysis")}</h3>
          <Textarea
            aria-label={t("ai.analysis")}
            value={analysis.analysis}
            rows={6}
            onChange={(e) => setAnalysis({ ...analysis, analysis: e.target.value })}
          />
          <div className="grid gap-4 md:grid-cols-3">
            {(["supported", "missing", "learning"] as const).map((k) => (
              <section key={k} className="space-y-2">
                <h3 className="text-sm font-semibold">{t(`ai.${k}`)}</h3>
                {analysis[k].map((item, i) => (
                  <p key={i} className="text-sm text-muted-foreground">
                    • {item}
                  </p>
                ))}
              </section>
            ))}
          </div>
          <h3 className="font-semibold">{t("ai.review")}</h3>
          {!analysis.suggestions.length && <p>{t("ai.noSuggestions")}</p>}
          <div className="space-y-4">
            {analysis.suggestions.map((s, i) => (
              <article key={`${s.path}-${i}`} className="space-y-3 rounded-lg border bg-card p-4">
                <Badge variant="secondary">{s.path}</Badge>
                <p className="text-sm text-muted-foreground">{s.reason}</p>
                <div className="grid gap-3 lg:grid-cols-2">
                  <div>
                    <Label>{t("ai.original")}</Label>
                    <p className="mt-2 whitespace-pre-wrap break-words text-sm">{s.original}</p>
                  </div>
                  <div>
                    <Label>{t("ai.replacement")}</Label>
                    <Textarea
                      aria-label={`${t("ai.replacement")} ${i + 1}`}
                      rows={5}
                      value={s.replacement}
                      disabled={applied.includes(i)}
                      onChange={(e) =>
                        setAnalysis({
                          ...analysis,
                          suggestions: analysis.suggestions.map((x, j) =>
                            j === i ? { ...x, replacement: e.target.value } : x,
                          ),
                        })
                      }
                    />
                  </div>
                </div>
                <Button
                  variant="outline"
                  disabled={applied.includes(i) || !s.replacement.trim()}
                  onClick={() => {
                    try {
                      onChange(applySuggestion(cv, s.path, s.original, s.replacement));
                      setApplied((a) => [...a, i]);
                    } catch {
                      toast.error(t("ai.stale"));
                    }
                  }}
                >
                  {t(applied.includes(i) ? "ai.applied" : "ai.apply")}
                </Button>
              </article>
            ))}
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              <Label>{t("ai.version")}</Label>
              <Input
                aria-label={t("ai.version")}
                value={name}
                maxLength={200}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <Button
              disabled={!name.trim() || save.isPending}
              onClick={() => save.mutate(undefined)}
            >
              {t("ai.saveCv")}
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
