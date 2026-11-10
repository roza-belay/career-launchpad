import type { Database } from "@/integrations/supabase/types";
import type { MessageKey } from "@/lib/i18n/messages";

export type Vacancy = Database["public"]["Tables"]["vacancies"]["Row"];
export type VacancyInput = Database["public"]["Tables"]["vacancies"]["Insert"];
type AppLike = { id: string; company: string; title: string; job_url: string | null };

export const EMPLOYMENT_TYPES = ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "TEMPORARY"] as const;
export const ARRANGEMENTS = ["On-site", "Hybrid", "Remote"] as const;

const text = (v: Vacancy) => [v.title, v.description, ...v.skills].join(" ").toLowerCase();
const loc = (v: Vacancy) => (v.location ?? "").toLowerCase();

/** Quick filters. Selected filters combine with AND. Matching is keyword-based on what you saved. */
export const VACANCY_FILTERS: { key: string; label: MessageKey; test: (v: Vacancy) => boolean }[] = [
  { key: "junior", label: "vac.fl.junior", test: (v) => /\b(junior|entry[- ]level|graduate|trainee|juniora?)\b/i.test(`${v.title} ${v.description ?? ""}`) },
  { key: "frontend", label: "vac.fl.frontend", test: (v) => /front[- ]?end/i.test(`${v.title} ${v.description ?? ""}`) },
  { key: "react", label: "vac.fl.react", test: (v) => /\breact\b/.test(text(v)) },
  { key: "javascript", label: "vac.fl.javascript", test: (v) => /\b(javascript|js)\b/.test(text(v)) },
  { key: "typescript", label: "vac.fl.typescript", test: (v) => /\b(typescript|ts)\b/.test(text(v)) },
  { key: "stockholm", label: "vac.fl.stockholm", test: (v) => loc(v).includes("stockholm") },
  { key: "sweden", label: "vac.fl.sweden", test: (v) => /(sweden|sverige|stockholm|göteborg|gothenburg|malmö|uppsala|linköping|örebro|västerås)/.test(loc(v)) },
  { key: "remoteEurope", label: "vac.fl.remoteEurope", test: (v) => v.arrangement === "Remote" && /(europe|europa|\beu\b|emea)/.test(loc(v)) },
];

export function matchesVacancy(v: Vacancy, q: string, filters: string[]) {
  for (const f of filters) if (!VACANCY_FILTERS.find((x) => x.key === f)?.test(v)) return false;
  const s = q.trim().toLowerCase();
  return !s || [v.company, v.title, v.location, v.description, ...v.skills].some((x) => x?.toLowerCase().includes(s));
}

const normUrl = (u: string | null) => (u ?? "").trim().toLowerCase().replace(/^https?:\/\/(www\.)?/, "").replace(/[?#].*$/, "").replace(/\/+$/, "");
const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

/** An application already representing this vacancy: same job URL, or same company + title. */
export function findExistingApplication<A extends AppLike>(v: Pick<Vacancy, "company" | "title" | "job_url">, apps: A[]): A | undefined {
  const u = normUrl(v.job_url);
  return apps.find((a) => (u && normUrl(a.job_url) === u) || (norm(a.company) === norm(v.company) && norm(a.title) === norm(v.title)));
}

/** Application fields copied from a vacancy when it moves to My Applications. */
export function vacancyToApplication(v: Vacancy, labels: { deadline: string; type: string; skills: string }) {
  const notes = [
    v.description?.trim(),
    v.deadline && `${labels.deadline}: ${v.deadline}`,
    `${labels.type}`,
    v.skills.length ? `${labels.skills}: ${v.skills.join(", ")}` : null,
  ].filter(Boolean).join("\n\n");
  return { company: v.company, title: v.title, location: v.location, arrangement: v.arrangement, job_url: v.job_url, status: "SAVED" as const, notes: notes || null };
}

/** Days until the deadline (negative = passed), or null without a deadline. */
export function daysUntil(deadline: string | null, today: string) {
  if (!deadline) return null;
  return Math.round((Date.parse(deadline) - Date.parse(today)) / 86400000);
}
