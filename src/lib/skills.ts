export const SKILL_CATEGORIES = ["FRONTEND", "TOOLS", "SECURITY", "ADDITIONAL", "BACKEND", "API", "AI", "TESTING", "CLOUD", "MOBILE"] as const;
export const SKILL_LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;
export const QUESTION_CATEGORIES = ["HTML", "CSS", "JAVASCRIPT", "REACT", "TYPESCRIPT", "HR", "BACKEND", "KOTLIN", "PYTHON", "NODEJS", "REST", "SQL", "AI", "TESTING", "ANDROID", "GIT", "OTHER"] as const;
export const PRACTICE_STATUSES = ["NOT_STARTED", "PRACTICING", "CONFIDENT"] as const;

export const clampProgress = (n: number) => (Number.isFinite(n) ? Math.min(100, Math.max(0, Math.round(n))) : 0);

/** Average progress (0–100, rounded) of the given skills; 0 when empty. */
export function averageProgress(skills: { progress: number }[]) {
  if (!skills.length) return 0;
  return Math.round(skills.reduce((s, k) => s + k.progress, 0) / skills.length);
}

export function progressByCategory<T extends { category: string; progress: number }>(skills: T[]) {
  return SKILL_CATEGORIES.map((c) => {
    const list = skills.filter((s) => s.category === c);
    return { category: c, count: list.length, progress: averageProgress(list) };
  }).filter((c) => c.count > 0);
}

export function recentlyUpdated<T extends { updated_at: string; created_at: string }>(skills: T[], n = 5) {
  return skills.filter((s) => s.updated_at !== s.created_at).sort((a, b) => b.updated_at.localeCompare(a.updated_at)).slice(0, n);
}

/** Share of questions marked CONFIDENT, 0–100. */
export function practiceProgress(qs: { status: string }[]) {
  if (!qs.length) return 0;
  return Math.round((qs.filter((q) => q.status === "CONFIDENT").length / qs.length) * 100);
}
