export const FOLLOW_UP_DAYS = 7;
export const STATUSES = ["SAVED", "APPLIED", "INTERVIEWING", "OFFER", "CLOSED"] as const;
export type Status = (typeof STATUSES)[number];

export function toISODate(d: Date) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
export function addDays(iso: string, days: number) {
  const [y = 1970, m = 1, d = 1] = iso.split("-").map(Number);
  return toISODate(new Date(y, m - 1, d + days));
}
/** Follow-up is due 7 days after the last contact. */
export function computeFollowUp(lastContact: string | null | undefined) {
  return lastContact ? addDays(lastContact, FOLLOW_UP_DAYS) : null;
}
export type FollowState = "overdue" | "today" | "upcoming" | "none";
/** Only active applications (APPLIED / INTERVIEWING) need follow-ups. */
export function followUpState(a: { status: string; next_follow_up: string | null }, today = toISODate(new Date())): FollowState {
  if (!a.next_follow_up || !["APPLIED", "INTERVIEWING"].includes(a.status)) return "none";
  if (a.next_follow_up < today) return "overdue";
  if (a.next_follow_up === today) return "today";
  return "upcoming";
}
export function weekStart(d = new Date()) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - diff);
  return toISODate(x);
}
export function formatSEK(min?: number | null, max?: number | null) {
  const f = (n: number) => n.toLocaleString("sv-SE");
  if (min && max) return `${f(min)}–${f(max)} SEK`;
  if (min) return `from ${f(min)} SEK`;
  if (max) return `up to ${f(max)} SEK`;
  return "—";
}
