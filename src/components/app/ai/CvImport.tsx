import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { usePrefs } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/messages";
import { aiTask } from "@/lib/ai/tasks.functions";
import { EMPTY_CONTEXT, validateText } from "@/lib/ai/contracts";
import { useAiSessionGuard } from "@/lib/ai/use-session";
import type { CvContent } from "@/lib/cv";
import { CvEditor } from "@/components/app/CvEditor";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCvMutation } from "@/lib/data";
import { supabase } from "@/integrations/supabase/client";

export function CvImport({ onCreated }: { onCreated: (id: string) => void }) {
  const { t, lang } = usePrefs();
  const run = useServerFn(aiTask);
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [cv, setCv] = useState<CvContent | null>(null);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const locked = useRef(false);
  useAiSessionGuard(!!text || !!cv);
  const save = useCvMutation(async () => {
    if (!cv) throw new Error("Missing CV");
    const r = await supabase
      .from("cv_documents")
      .insert({ name: name.trim(), kind: "tailored", language: lang, content: cv })
      .select("id")
      .single();
    if (r.data && !r.error) {
      setText("");
      setCv(null);
      onCreated(r.data.id);
    }
    return r;
  }, "ai.saved");
  async function extract(file: File) {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError("");
    setConsent(false);
    setCv(null);
    try {
      const { extractCv } = await import("@/lib/ai/extract");
      setText(await extractCv(file));
      setName(file.name.replace(/\.(pdf|docx)$/i, ""));
    } catch (e) {
      const code = e instanceof Error ? e.message : "corrupt";
      const keys = ["size", "format", "empty", "pageLimit", "textLimit", "zipLimit", "corrupt"];
      setError(t(keys.includes(code) ? (`ai.${code}` as MessageKey) : "ai.corrupt"));
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  async function structure() {
    if (!consent || locked.current) return;
    locked.current = true;
    setBusy(true);
    setError("");
    try {
      validateText(text);
      const r = await run({
        data: {
          operation: "import",
          context: EMPTY_CONTEXT,
          lang,
          text,
          role: "",
          focus: "mixed",
          turns: [],
        },
      });
      if (r.kind === "import") setCv(r.value);
      else setError(t(r.kind === "error" && r.error === "credits" ? "ai.credits" : "ai.failed"));
    } catch {
      setError(t("ai.failed"));
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  return (
    <section className="space-y-4 border-b pb-6">
      <h2 className="text-lg font-semibold">{t("ai.import")}</h2>
      <p className="text-sm text-muted-foreground">{t("ai.importPrivacy")}</p>
      <Input
        type="file"
        accept=".pdf,.docx"
        disabled={busy}
        aria-label={t("ai.import")}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void extract(file);
          e.target.value = "";
        }}
      />
      <Label>{t("ai.extracted")}</Label>
      <Textarea
        aria-label={t("ai.extracted")}
        rows={10}
        maxLength={60000}
        value={text}
        disabled={busy}
        onChange={(e) => {
          setText(e.target.value);
          setConsent(false);
          setCv(null);
        }}
      />
      <Label className="flex items-start gap-2 leading-relaxed">
        <Checkbox
          checked={consent}
          disabled={busy}
          onCheckedChange={(v) => setConsent(v === true)}
        />
        <span>{t("ai.consent")}</span>
      </Label>
      <Button disabled={busy || !text.trim() || !consent} onClick={structure}>
        {t(busy ? "ai.thinking" : "ai.structure")}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {cv && (
        <>
          <p className="text-sm text-muted-foreground">{t("ai.reviewFacts")}</p>
          <CvEditor cv={cv} onChange={setCv} />
          <Label>{t("ai.version")}</Label>
          <Input
            aria-label={t("ai.version")}
            value={name}
            maxLength={200}
            onChange={(e) => setName(e.target.value)}
          />
          <Button disabled={!name.trim() || save.isPending} onClick={() => save.mutate(undefined)}>
            {t("ai.saveImport")}
          </Button>
        </>
      )}
    </section>
  );
}
