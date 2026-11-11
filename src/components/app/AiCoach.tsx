import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { coachFeedback } from "@/lib/coach.functions";
import { usePrefs } from "@/lib/i18n";

export function AiCoach({ question, answer }: { question: string; answer: string | null }) {
  const { t, lang } = usePrefs();
  const run = useServerFn(coachFeedback);
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<string | null>(null);
  if (!answer?.trim()) return null;
  async function go() {
    setBusy(true); setOut(null);
    try {
      const r = await run({ data: { question, answer: answer!, lang: lang === "sv" ? "sv" : "en" } });
      setOut("feedback" in r && r.feedback ? r.feedback : t(r && "error" in r && r.error === "credits" ? "coach.credits" : "coach.failed"));
    } catch { setOut(t("coach.failed")); } finally { setBusy(false); }
  }
  return (
    <div className="space-y-2">
      <Button size="sm" variant="outline" onClick={go} disabled={busy}><Sparkles className="size-4" />{busy ? t("coach.thinking") : t("coach.ask")}</Button>
      {out && <div className="whitespace-pre-line rounded-xl bg-primary-soft p-3 text-sm">{out}</div>}
    </div>
  );
}
