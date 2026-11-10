import { en, sv, type MessageKey } from "./messages";

export type Lang = "en" | "sv";
export type Theme = "light" | "dark";
export const LANG_KEY = "cl-lang";
export const THEME_KEY = "cl-theme";
export const LOCALE: Record<Lang, string> = { en: "en-GB", sv: "sv-SE" };

export const parseLang = (v: unknown): Lang => (v === "sv" ? "sv" : "en");
export const parseTheme = (v: unknown): Theme => (v === "dark" ? "dark" : "light");

/** Current language for code outside React (toasts in data hooks). Set by the provider. */
let current: Lang = "en";
export const setCurrentLang = (l: Lang) => { current = l; };

export function translate(key: MessageKey, vars?: Record<string, string | number>, lang: Lang = current) {
  let s: string = (lang === "sv" ? sv : en)[key] ?? en[key];
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}

/** Calendar date (YYYY-MM-DD) → "10 Nov 2026" (en) / "10 nov. 2026" (sv). Empty → "—". */
export function formatDate(iso: string | null | undefined, lang: Lang = current) {
  if (!iso) return "—";
  const [y = 1970, m = 1, d = 1] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(LOCALE[lang], { day: "numeric", month: "short", year: "numeric" });
}
export function formatDateTime(iso: string, lang: Lang = current) {
  return new Date(iso).toLocaleString(LOCALE[lang], { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}
export function formatSalary(min?: number | null, max?: number | null, lang: Lang = current) {
  const f = (n: number) => n.toLocaleString("sv-SE");
  const unit = lang === "sv" ? "kr" : "SEK";
  if (min && max) return `${f(min)}–${f(max)} ${unit}`;
  if (min) return translate("salary.from", { v: f(min) }, lang);
  if (max) return translate("salary.upTo", { v: f(max) }, lang);
  return "—";
}

/** Runs before hydration so the saved theme/language apply without a flash. */
export const PREFS_BOOT_SCRIPT = `try{var t=localStorage.getItem("${THEME_KEY}");if(t==="dark")document.documentElement.classList.add("dark");var l=localStorage.getItem("${LANG_KEY}");if(l==="sv")document.documentElement.lang="sv"}catch(e){}`;
