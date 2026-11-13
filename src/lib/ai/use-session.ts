import { useEffect } from "react";
import { useBlocker } from "@tanstack/react-router";
import { usePrefs } from "@/lib/i18n";

export function useAiSessionGuard(dirty: boolean) {
  const { t } = usePrefs();
  useBlocker({
    shouldBlockFn: () => dirty && !window.confirm(t("ai.unsaved")),
    enableBeforeUnload: dirty,
  });
  useEffect(() => {
    if (!dirty) return;
    const guard = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [dirty]);
}

export async function readResponseText(
  response: Response,
  signal: AbortSignal,
  onDelta: (delta: string) => void,
) {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error === "credits" ? "credits" : "failed");
  }
  if (!response.body) throw new Error("failed");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let complete = false;
  let length = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (signal.aborted) throw new DOMException("Aborted", "AbortError");
      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");
      if (buffer.length > 1000000) throw new Error("failed");
      let end: number;
      while ((end = buffer.indexOf("\n\n")) !== -1) {
        const frame = buffer.slice(0, end);
        buffer = buffer.slice(end + 2);
        const data = frame
          .split("\n")
          .filter((l) => l.startsWith("data:"))
          .map((l) => l.slice(5).trim())
          .join("\n");
        if (!data || data === "[DONE]") continue;
        const event: { type?: string; delta?: string; error?: { code?: string } } =
          JSON.parse(data);
        if (event.type === "error" || event.type === "response.failed" || event.error)
          throw new Error(event.error?.code === "payment_required" ? "credits" : "failed");
        if (event.type === "response.refusal.delta") throw new Error("failed");
        if (event.type === "response.output_text.delta" && typeof event.delta === "string") {
          length += event.delta.length;
          if (length > 12000) throw new Error("failed");
          onDelta(event.delta);
        }
        if (event.type === "response.completed") complete = true;
      }
    }
    if (!complete) throw new Error("incomplete");
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}
