import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { MessageKey } from "./messages";
import { LANG_KEY, THEME_KEY, formatDate, formatDateTime, formatSalary, parseLang, parseTheme, setCurrentLang, translate, LOCALE, type Lang, type Theme } from "./core";

export * from "./core";

type Prefs = {
  lang: Lang; theme: Theme; locale: string;
  setLang: (l: Lang) => void; setTheme: (t: Theme) => void;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
  date: (iso: string | null | undefined) => string;
  dateTime: (iso: string) => string;
  salary: (min?: number | null, max?: number | null) => string;
};
const Ctx = createContext<Prefs | null>(null);

function applyTheme(t: Theme) { document.documentElement.classList.toggle("dark", t === "dark"); }

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    const l = parseLang(localStorage.getItem(LANG_KEY));
    const t = parseTheme(localStorage.getItem(THEME_KEY));
    setCurrentLang(l); setLangState(l); setThemeState(t); applyTheme(t);
    document.documentElement.lang = l;
  }, []);

  const setLang = useCallback((l: Lang) => {
    localStorage.setItem(LANG_KEY, l); setCurrentLang(l); setLangState(l); document.documentElement.lang = l;
  }, []);
  const setTheme = useCallback((t: Theme) => { localStorage.setItem(THEME_KEY, t); setThemeState(t); applyTheme(t); }, []);

  const value = useMemo<Prefs>(() => ({
    lang, theme, locale: LOCALE[lang], setLang, setTheme,
    t: (k, v) => translate(k, v, lang),
    date: (iso) => formatDate(iso, lang),
    dateTime: (iso) => formatDateTime(iso, lang),
    salary: (a, b) => formatSalary(a, b, lang),
  }), [lang, theme, setLang, setTheme]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePrefs() {
  const c = useContext(Ctx);
  if (!c) throw new Error("usePrefs must be used inside PreferencesProvider");
  return c;
}
