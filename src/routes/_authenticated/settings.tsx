import { createFileRoute, useRouteContext, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePrefs } from "@/lib/i18n";
import { LanguageSelect } from "@/components/app/PreferenceControls";
import { cn } from "@/lib/utils";
import { Moon, Sun } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Career Launchpad" }, { name: "description", content: "Account settings." }, { property: "og:title", content: "Settings" }, { property: "og:description", content: "Account settings." }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useRouteContext({ from: "/_authenticated" });
  const router = useRouter();
  const { t, theme, setTheme } = usePrefs();
  const [name, setName] = useState((user.user_metadata?.["full_name"] as string) ?? "");
  async function save(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ data: { full_name: name.trim() } });
    if (error) { toast.error(error.message); return; }
    toast.success(t("common.saved"));
    router.invalidate();
  }
  return (
    <>
      <PageHeader title={t("settings.title")} />
      <form onSubmit={save} className="card-soft max-w-lg space-y-4 p-6">
        <div className="space-y-1.5"><Label>{t("settings.email")}</Label><Input value={user.email ?? ""} disabled /></div>
        <div className="space-y-1.5"><Label htmlFor="n">{t("settings.name")}</Label><Input id="n" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} /></div>
        <Button type="submit">{t("common.save")}</Button>
      </form>
      <section className="card-soft mt-6 max-w-lg space-y-4 p-6">
        <h2 className="text-lg font-semibold">{t("settings.appearance")}</h2>
        <div className="space-y-1.5"><Label>{t("pref.language")}</Label><LanguageSelect className="w-48" /></div>
        <div className="space-y-1.5">
          <Label>{t("settings.theme")}</Label>
          <div className="flex gap-2">
            {(["light", "dark"] as const).map((m) => (
              <Button key={m} type="button" variant="outline" aria-pressed={theme === m} onClick={() => setTheme(m)} className={cn(theme === m && "border-primary bg-primary-soft text-accent-foreground")}>
                {m === "light" ? <Sun className="size-4" /> : <Moon className="size-4" />} {t(m === "light" ? "settings.light" : "settings.dark")}
              </Button>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
