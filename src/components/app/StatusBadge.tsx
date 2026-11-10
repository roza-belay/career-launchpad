import { cn } from "@/lib/utils";
import { usePrefs } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/messages";

export const statusKey = (s: string) => `status.${s}` as MessageKey;
export const arrKey = (s: string) => `arr.${s}` as MessageKey;

const STYLES: Record<string, string> = {
  SAVED: "bg-status-saved text-status-saved-fg",
  APPLIED: "bg-status-applied text-status-applied-fg",
  INTERVIEWING: "bg-status-interviewing text-status-interviewing-fg",
  OFFER: "bg-status-offer text-status-offer-fg",
  CLOSED: "bg-status-closed text-status-closed-fg",
};
export const STATUS_DOT: Record<string, string> = {
  SAVED: "bg-status-saved-fg", APPLIED: "bg-status-applied-fg", INTERVIEWING: "bg-status-interviewing-fg", OFFER: "bg-status-offer-fg", CLOSED: "bg-status-closed-fg",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const { t } = usePrefs();
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", STYLES[status], className)}>{t(statusKey(status))}</span>;
}
export function DemoBadge() {
  const { t } = usePrefs();
  return <span className="inline-flex items-center rounded-full border border-dashed border-primary/40 bg-primary-soft px-2 py-0.5 text-[10px] font-bold tracking-wide text-accent-foreground">{t("common.demo")}</span>;
}
