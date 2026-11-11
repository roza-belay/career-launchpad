import { createFileRoute, useRouteContext, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { CAREER_ROLES, CAREER_HEADLINE, CAREER_SUMMARY, toggleCareerRole } from "@/lib/career";
import { useCareerProfile, useKeyedMutation } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { title: "Settings — Career Launchpad" }, { name: "description", content: "Account settings." }, { property: "og:title", content: "Settings" }, { property: "og:description", content: "Account settings." }] }),
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
      <CareerProfile />
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

function CareerProfile() {
  const { user } = useRouteContext({ from: "/_authenticated" });
  const { t } = usePrefs();
  const { data: profile, isLoading } = useCareerProfile();
  const [roles, setRoles] = useState<string[]>([]);
  const [headline, setHeadline] = useState(CAREER_HEADLINE);
  const [summary, setSummary] = useState(CAREER_SUMMARY);
  useEffect(() => {
    if (profile) {
      setRoles(profile.preferred_roles);
      setHeadline(profile.headline);
      setSummary(profile.summary);
    }
  }, [profile]);
  const save = useKeyedMutation("career_profile", async () => supabase.from("career_profiles").upsert({ user_id: user.id, preferred_roles: roles, headline, summary, updated_at: new Date().toISOString() }), "common.saved");
  return <form className="mt-6 max-w-3xl space-y-4" onSubmit={(e) => { e.preventDefault(); save.mutate(undefined); }}>
    <h2 className="text-lg font-semibold">{t("career.profile")}</h2>
    <div className="space-y-1.5"><Label htmlFor="career-headline">{t("career.headline")}</Label><Input id="career-headline" value={headline} onChange={(e) => setHeadline(e.target.value)} /></div>
    <div className="space-y-1.5"><Label htmlFor="career-summary">{t("career.summary")}</Label><Textarea id="career-summary" rows={10} value={summary} onChange={(e) => setSummary(e.target.value)} /></div>
    <fieldset><legend className="mb-3 text-sm font-medium">{t("career.roles")}</legend><div className="grid gap-3 sm:grid-cols-2">
      {CAREER_ROLES.map((role) => <label key={role} className="flex items-start gap-2 text-sm"><Checkbox checked={roles.includes(role)} onCheckedChange={() => setRoles((r) => toggleCareerRole(r, role))} />{t(`career.role.${role}`)}</label>)}
    </div></fieldset>
    <p className="text-sm text-muted-foreground">{t("career.locations")}</p>
    <Button type="submit" disabled={isLoading || save.isPending}>{t(save.isPending ? "common.saving" : "common.save")}</Button>
  </form>;
}
