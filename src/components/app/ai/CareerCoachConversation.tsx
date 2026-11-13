import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import type { UIMessage } from "ai";
import { Copy, RotateCcw } from "lucide-react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useKeyedMutation } from "@/lib/data";
import { aiTask } from "@/lib/ai/tasks.functions";
import { EMPTY_CONTEXT, type AiContext, type AiTurn } from "@/lib/ai/contracts";
import { readResponseText, useAiSessionGuard } from "@/lib/ai/use-session";
import { usePrefs } from "@/lib/i18n";
import { AiContextPicker } from "./AiContextPicker";
import coachIdentity from "@/assets/career-compass.png";

export function CareerCoachConversation() {
  const { t, lang } = usePrefs();
  const task = useServerFn(aiTask);
  const [context, setContext] = useState<AiContext>(EMPTY_CONTEXT);
  const [consent, setConsent] = useState(false);
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState<"ready" | "submitted" | "streaming">("ready");
  const [error, setError] = useState("");
  const [actions, setActions] = useState<
    { title: string; details: string; due: string; saved: boolean }[]
  >([]);
  const [planning, setPlanning] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const busy = status !== "ready" || planning;
  const locked = useRef(false);
  useAiSessionGuard(messages.length > 0 || draft.length > 0);
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    if (!busy && !document.querySelector('[role="dialog"]')) textarea.current?.focus();
  }, [busy]);
  const turns = (list = messages): AiTurn[] =>
    list
      .map((m): AiTurn => ({
        role: m.role === "user" ? "user" : "assistant",
        text: m.parts
          .filter((p) => p.type === "text")
          .map((p) => p.text)
          .join(""),
      }))
      .filter((m) => m.text.trim());
  const save = useKeyedMutation(
    "growth",
    async (a: (typeof actions)[number]) =>
      supabase.from("growth_items").insert({
        hub: "ROADMAP",
        title: a.title.trim(),
        details: a.details.trim() || null,
        target_date: a.due || null,
      }),
    "ai.saved",
  );
  async function send() {
    if (!draft.trim() || !consent || locked.current) return;
    locked.current = true;
    const text = draft;
    const userMessage: UIMessage = {
      id: crypto.randomUUID(),
      role: "user",
      parts: [{ type: "text", text }],
    };
    const next = [...messages, userMessage];
    const assistantId = crypto.randomUUID();
    setMessages([
      ...next,
      { id: assistantId, role: "assistant", parts: [{ type: "text", text: "" }] },
    ]);
    setDraft("");
    setError("");
    setStatus("submitted");
    const abort = new AbortController();
    controller.current = abort;
    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session) throw new Error("failed");
      const response = await fetch("/api/public/career-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.data.session.access_token}`,
        },
        body: JSON.stringify({ context, lang, turns: turns(next) }),
        signal: abort.signal,
      });
      await readResponseText(response, abort.signal, (delta) => {
        setStatus("streaming");
        setMessages((list) =>
          list.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  parts: [
                    {
                      type: "text",
                      text:
                        m.parts
                          .filter((p) => p.type === "text")
                          .map((p) => p.text)
                          .join("") + delta,
                    },
                  ],
                }
              : m,
          ),
        );
      });
    } catch (e) {
      setDraft(text);
      setError(
        t(
          e instanceof Error && e.message === "credits"
            ? "ai.credits"
            : e instanceof Error && (e.name === "AbortError" || e.message === "incomplete")
              ? "ai.incomplete"
              : "ai.failed",
        ),
      );
    } finally {
      controller.current = null;
      locked.current = false;
      setStatus("ready");
      textarea.current?.focus();
    }
  }
  async function propose() {
    if (locked.current || !consent) return;
    locked.current = true;
    setPlanning(true);
    setError("");
    try {
      const r = await task({
        data: {
          operation: "actions",
          context,
          lang,
          text: turns()
            .map((m) => `${m.role}: ${m.text}`)
            .join("\n"),
          role: "",
          focus: "mixed",
          turns: [],
        },
      });
      if (r.kind === "actions")
        setActions(r.value.actions.map((a) => ({ ...a, due: "", saved: false })));
      else setError(t(r.kind === "error" && r.error === "credits" ? "ai.credits" : "ai.failed"));
    } catch {
      setError(t("ai.failed"));
    } finally {
      locked.current = false;
      setPlanning(false);
    }
  }
  return (
    <div className="space-y-5">
      <AiContextPicker
        career
        value={context}
        onChange={setContext}
        consent={consent}
        onConsent={setConsent}
        disabled={busy}
      />
      <p className="text-xs text-muted-foreground">{t("ai.privacy")}</p>
      <div className="flex items-center gap-3">
        <img src={coachIdentity} alt="" className="size-10" />
        <span className="font-display font-semibold">{t("ai.coach")}</span>
        <Button
          size="icon"
          variant="ghost"
          className="ml-auto"
          aria-label={t("ai.reset")}
          title={t("ai.reset")}
          disabled={busy}
          onClick={() => {
            if (window.confirm(t("ai.discard"))) {
              setMessages([]);
              setActions([]);
              setDraft("");
              setError("");
            }
          }}
        >
          <RotateCcw />
        </Button>
      </div>
      <Conversation className="h-[420px] min-h-64 rounded-lg border">
        <ConversationContent>
          {!messages.length && <p className="text-muted-foreground">{t("ai.coachPrompt")}</p>}
          {messages.map((m) => (
            <Message key={m.id} from={m.role}>
              <MessageContent
                className={
                  m.role === "user"
                    ? "group-[.is-user]:bg-primary group-[.is-user]:text-primary-foreground"
                    : ""
                }
              >
                {m.parts.map((p, i) =>
                  p.type === "text" ? (
                    m.role === "assistant" ? (
                      <MessageResponse key={i} rehypePlugins={[]} plugins={{}}>
                        {p.text}
                      </MessageResponse>
                    ) : (
                      <p key={i} className="whitespace-pre-wrap break-words">
                        {p.text}
                      </p>
                    )
                  ) : null,
                )}
              </MessageContent>
              {m.role === "assistant" && !busy && (
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={t("ai.copy")}
                  title={t("ai.copy")}
                  onClick={() =>
                    navigator.clipboard.writeText(
                      m.parts
                        .filter((p) => p.type === "text")
                        .map((p) => p.text)
                        .join(""),
                    )
                  }
                >
                  <Copy />
                </Button>
              )}
            </Message>
          ))}
          {status === "submitted" && <Shimmer>{t("ai.thinking")}</Shimmer>}
        </ConversationContent>
        <ConversationScrollButton aria-label={t("ai.next")} />
      </Conversation>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <PromptInput maxFiles={0} onSubmit={send}>
        <PromptInputTextarea
          ref={textarea}
          aria-label={t("ai.message")}
          placeholder={t("ai.message")}
          maxLength={6000}
          disabled={busy}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <PromptInputFooter className="justify-end">
          <PromptInputSubmit
            status={status}
            aria-label={t(status === "ready" ? "ai.send" : "ai.stop")}
            disabled={status === "ready" && (!draft.trim() || !consent || planning)}
            onStop={() => controller.current?.abort()}
          />
        </PromptInputFooter>
      </PromptInput>
      <Button
        variant="outline"
        disabled={busy || !consent || !messages.some((m) => m.role === "assistant")}
        onClick={propose}
      >
        {planning ? t("ai.thinking") : t("ai.actions")}
      </Button>
      <div className="grid gap-4 sm:grid-cols-2">
        {actions.map((a, i) => (
          <article key={i} className="space-y-3 rounded-lg border bg-card p-4">
            <Label>{t("ai.action")}</Label>
            <Input
              aria-label={t("ai.title")}
              value={a.title}
              disabled={a.saved}
              maxLength={200}
              onChange={(e) =>
                setActions((list) =>
                  list.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)),
                )
              }
            />
            <Textarea
              aria-label={t("ai.details")}
              value={a.details}
              disabled={a.saved}
              maxLength={2000}
              onChange={(e) =>
                setActions((list) =>
                  list.map((x, j) => (j === i ? { ...x, details: e.target.value } : x)),
                )
              }
            />
            <Input
              type="date"
              aria-label={t("ai.due")}
              value={a.due}
              disabled={a.saved}
              onChange={(e) =>
                setActions((list) =>
                  list.map((x, j) => (j === i ? { ...x, due: e.target.value } : x)),
                )
              }
            />
            <Button
              disabled={save.isPending || a.saved || !a.title.trim()}
              onClick={() =>
                save.mutate(a, {
                  onSuccess: () =>
                    setActions((list) => list.map((x, j) => (j === i ? { ...x, saved: true } : x))),
                })
              }
            >
              {t(a.saved ? "ai.saved" : "ai.accept")}
            </Button>
          </article>
        ))}
      </div>
    </div>
  );
}
