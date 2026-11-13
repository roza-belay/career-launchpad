import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Copy, RotateCcw } from "lucide-react";
import { usePrefs } from "@/lib/i18n";
import { aiTask } from "@/lib/ai/tasks.functions";
import { completedAnswers, EMPTY_CONTEXT, type AiContext, type AiTurn } from "@/lib/ai/contracts";
import { useAiSessionGuard } from "@/lib/ai/use-session";
import { useKeyedMutation } from "@/lib/data";
import { supabase } from "@/integrations/supabase/client";
import { AiContextPicker } from "./AiContextPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

type Practice = { question: string; answer: string; feedback: string; saved: boolean };
export function InterviewSession() {
  const { t, lang } = usePrefs();
  const run = useServerFn(aiTask);
  const [context, setContext] = useState<AiContext>(EMPTY_CONTEXT);
  const [consent, setConsent] = useState(false);
  const [role, setRole] = useState("");
  const [focus, setFocus] = useState<"mixed" | "technical" | "behavioral">("mixed");
  const [turns, setTurns] = useState<AiTurn[]>([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [practices, setPractices] = useState<Practice[]>([]);
  const [next, setNext] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [summary, setSummary] = useState("");
  const [ended, setEnded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const locked = useRef(false);
  const count = completedAnswers(turns);
  useAiSessionGuard(!!question || !!answer || !!summary);
  const save = useKeyedMutation(
    "interview",
    async (p: Practice) =>
      supabase.from("interview_questions").insert({
        question: p.question,
        answer: p.answer,
        category: focus === "technical" ? "JAVASCRIPT" : "HR",
        status: "PRACTICING",
      }),
    "ai.saved",
  );
  async function request(operation: "interview" | "summary", list: AiTurn[]) {
    if (locked.current || !consent) return;
    locked.current = true;
    setBusy(true);
    setError("");
    try {
      const r = await run({
        data: { operation, lang, context, role, focus, text: "", turns: list },
      });
      if (r.kind === "summary") {
        setSummary(r.value.summary);
        setEnded(true);
      } else if (r.kind === "interview") {
        if (!list.length) {
          if (!r.value.question.trim()) throw new Error("failed");
          setQuestion(r.value.question);
          setTurns([{ role: "assistant", text: r.value.question }]);
        } else {
          setTurns(list);
          setPractices((p) => [
            ...p,
            { question, answer, feedback: r.value.feedback, saved: false },
          ]);
          setNext(r.value.question);
          setReviewing(true);
        }
      } else setError(t(r.kind === "error" && r.error === "credits" ? "ai.credits" : "ai.failed"));
    } catch {
      setError(t("ai.failed"));
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  return (
    <div className="space-y-5">
      <AiContextPicker
        value={context}
        onChange={setContext}
        consent={consent}
        onConsent={setConsent}
        disabled={busy || !!question}
      />
      <p className="text-xs text-muted-foreground">{t("ai.privacy")}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>{t("ai.role")}</Label>
          <Input
            aria-label={t("ai.role")}
            value={role}
            maxLength={150}
            disabled={busy || !!question}
            onChange={(e) => setRole(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>{t("ai.focus")}</Label>
          <Select
            value={focus}
            disabled={busy || !!question}
            onValueChange={(v) =>
              setFocus(
                v === "technical" ? "technical" : v === "behavioral" ? "behavioral" : "mixed",
              )
            }
          >
            <SelectTrigger aria-label={t("ai.focus")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(["mixed", "technical", "behavioral"] as const).map((f) => (
                <SelectItem key={f} value={f}>
                  {t(`ai.${f}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        {!question && (
          <Button
            disabled={busy || !consent || !role.trim()}
            onClick={() => request("interview", [])}
          >
            {t(busy ? "ai.thinking" : "ai.start")}
          </Button>
        )}
        <Button
          size="icon"
          variant="ghost"
          disabled={busy}
          title={t("ai.reset")}
          aria-label={t("ai.reset")}
          onClick={() => {
            if (window.confirm(t("ai.discard"))) {
              setQuestion("");
              setAnswer("");
              setTurns([]);
              setPractices([]);
              setReviewing(false);
              setSummary("");
              setEnded(false);
              setError("");
              setConsent(false);
            }
          }}
        >
          <RotateCcw />
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {question && (
        <>
          <Progress
            value={(count / 5) * 100}
            aria-label={t("ai.questionProgress", { n: Math.min(count + 1, 5) })}
          />
          {!ended && !reviewing && count < 5 && (
            <section className="space-y-4 border-y py-5">
              <p className="text-xs font-semibold text-primary">
                {t("ai.questionProgress", { n: count + 1 })}
              </p>
              <h2 className="text-lg font-semibold">{question}</h2>
              <Textarea
                autoFocus
                aria-label={t("ai.answer")}
                placeholder={t("ai.answer")}
                maxLength={6000}
                rows={7}
                value={answer}
                disabled={busy}
                onChange={(e) => setAnswer(e.target.value)}
              />
              <Button
                disabled={busy || !answer.trim() || !consent}
                onClick={() => request("interview", [...turns, { role: "user", text: answer }])}
              >
                {t(busy ? "ai.thinking" : "ai.send")}
              </Button>
            </section>
          )}
          {reviewing && !ended && count < 5 && (
            <Button
              disabled={busy || !next.trim()}
              onClick={() => {
                setQuestion(next);
                setTurns((list) => [...list, { role: "assistant", text: next }]);
                setAnswer("");
                setReviewing(false);
              }}
            >
              {t("ai.next")}
            </Button>
          )}
          {count >= 5 && !ended && (
            <p className="text-sm text-muted-foreground">{t("ai.summaryReady")}</p>
          )}
          {!ended && count > 0 && (
            <Button
              variant="outline"
              disabled={busy || !consent}
              onClick={() => request("summary", turns)}
            >
              {t(busy ? "ai.thinking" : "ai.end")}
            </Button>
          )}
        </>
      )}
      {summary && (
        <section className="space-y-3 border-y py-5">
          <Label>{t("ai.summary")}</Label>
          <Textarea
            aria-label={t("ai.summary")}
            rows={10}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />
          <Button
            size="icon"
            variant="ghost"
            title={t("ai.copy")}
            aria-label={t("ai.copy")}
            onClick={() => navigator.clipboard.writeText(summary)}
          >
            <Copy />
          </Button>
        </section>
      )}
      <div className="space-y-5">
        {practices.map((p, i) => (
          <article key={i} className="space-y-3 rounded-lg border bg-card p-4">
            <h3 className="font-semibold">{p.question}</h3>
            <Label>{t("ai.answer")}</Label>
            <Textarea
              aria-label={`${t("ai.answer")} ${i + 1}`}
              value={p.answer}
              disabled={p.saved}
              rows={4}
              onChange={(e) =>
                setPractices((list) =>
                  list.map((x, j) => (j === i ? { ...x, answer: e.target.value } : x)),
                )
              }
            />
            <Label>{t("ai.feedback")}</Label>
            <Textarea
              aria-label={`${t("ai.feedback")} ${i + 1}`}
              rows={7}
              value={p.feedback}
              onChange={(e) =>
                setPractices((list) =>
                  list.map((x, j) => (j === i ? { ...x, feedback: e.target.value } : x)),
                )
              }
            />
            <Button
              variant="outline"
              disabled={save.isPending || p.saved || !p.answer.trim()}
              onClick={() =>
                save.mutate(p, {
                  onSuccess: () =>
                    setPractices((list) =>
                      list.map((x, j) => (j === i ? { ...x, saved: true } : x)),
                    ),
                })
              }
            >
              {t(p.saved ? "ai.saved" : "ai.saveAnswer")}
            </Button>
          </article>
        ))}
      </div>
    </div>
  );
}
