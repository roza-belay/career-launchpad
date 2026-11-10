import { cn } from "@/lib/utils";

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
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", STYLES[status], className)}>{status}</span>;
}
export function DemoBadge() {
  return <span className="inline-flex items-center rounded-full border border-dashed border-primary/40 bg-primary-soft px-2 py-0.5 text-[10px] font-bold tracking-wide text-accent-foreground">DEMO DATA</span>;
}
