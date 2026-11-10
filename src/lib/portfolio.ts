import type { Database } from "@/integrations/supabase/types";
import type { MessageKey } from "@/lib/i18n/messages";

export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type ProjectInput = Database["public"]["Tables"]["projects"]["Insert"];

export const PROJECT_STATUSES = ["PLANNED", "IN_PROGRESS", "COMPLETED", "PUBLISHED"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
export const SCREENSHOT_BUCKET = "project-screenshots";

/** Items the user ticks by hand; stored in projects.checklist. */
export const MANUAL_CHECKS = ["githubVerified", "demoVerified", "tested", "ready"] as const;
export type ManualCheck = (typeof MANUAL_CHECKS)[number];

export type CheckItem = { key: string; label: MessageKey; done: boolean; manual: boolean; enabled: boolean };

const filled = (s?: string | null) => !!s && s.trim().length > 0;

export function manualChecks(raw: unknown): Record<ManualCheck, boolean> {
  const o = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  return Object.fromEntries(MANUAL_CHECKS.map((k) => [k, o[k] === true])) as Record<ManualCheck, boolean>;
}

/** Recruiter-ready checklist. Content items are derived from the project; link checks need the link first. */
export function projectChecklist(p: Pick<Project, "short_description" | "description" | "technologies" | "screenshots" | "github_url" | "demo_url" | "docs_url" | "checklist">): CheckItem[] {
  const m = manualChecks(p.checklist);
  return [
    { key: "description", label: "pf.ck.description", done: filled(p.short_description) && filled(p.description), manual: false, enabled: true },
    { key: "technologies", label: "pf.ck.technologies", done: p.technologies.length > 0, manual: false, enabled: true },
    { key: "screenshots", label: "pf.ck.screenshots", done: p.screenshots.length > 0, manual: false, enabled: true },
    { key: "githubVerified", label: "pf.ck.github", done: filled(p.github_url) && m.githubVerified, manual: true, enabled: filled(p.github_url) },
    { key: "demoVerified", label: "pf.ck.demo", done: filled(p.demo_url) && m.demoVerified, manual: true, enabled: filled(p.demo_url) },
    { key: "documentation", label: "pf.ck.docs", done: filled(p.docs_url), manual: false, enabled: true },
    { key: "tested", label: "pf.ck.tested", done: m.tested, manual: true, enabled: true },
    { key: "ready", label: "pf.ck.ready", done: m.ready, manual: true, enabled: true },
  ];
}

export function checklistProgress(items: CheckItem[]) {
  const done = items.filter((i) => i.done).length;
  return { done, total: items.length, percent: Math.round((done / items.length) * 100) };
}

/** Comma or newline separated text → trimmed unique list. */
export function listFromText(text: string, sep: RegExp = /[,\n]/) {
  return [...new Set(text.split(sep).map((s) => s.trim()).filter(Boolean))];
}

/** Accepts only http(s) URLs; adds https:// when the scheme is missing. Empty → null. */
export function normalizeUrl(v: string): string | null {
  const s = v.trim();
  if (!s) return null;
  const withScheme = /^[a-z]+:\/\//i.test(s) ? s : `https://${s}`;
  try {
    const u = new URL(withScheme);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
  } catch { return null; }
}

export function matchesProject(p: Project, q: string, status: string, tech: string) {
  if (status !== "all" && p.status !== status) return false;
  if (tech !== "all" && !p.technologies.includes(tech)) return false;
  const s = q.trim().toLowerCase();
  if (!s) return true;
  return [p.title, p.short_description, p.description, p.category, ...p.technologies].some((f) => f?.toLowerCase().includes(s));
}
