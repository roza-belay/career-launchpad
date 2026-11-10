import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePrefs, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LanguageSelect({ className }: { className?: string }) {
  const { lang, setLang, t } = usePrefs();
  return (
    <Select value={lang} onValueChange={(v) => setLang(v as Lang)}>
      <SelectTrigger className={cn("h-9 w-36", className)} aria-label={t("pref.language")}><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="sv">🇸🇪 Svenska</SelectItem>
        <SelectItem value="en">🇬🇧 English</SelectItem>
      </SelectContent>
    </Select>
  );
}

export function ThemeToggle() {
  const { theme, setTheme, t } = usePrefs();
  const dark = theme === "dark";
  const label = t(dark ? "pref.toLight" : "pref.toDark");
  return (
    <Button variant="outline" size="icon" className="size-9 shrink-0" onClick={() => setTheme(dark ? "light" : "dark")} aria-label={label} title={label}>
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}

export function PreferenceControls({ className }: { className?: string }) {
  return <div className={cn("flex items-center gap-2", className)}><LanguageSelect /><ThemeToggle /></div>;
}
