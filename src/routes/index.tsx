import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Rocket, Briefcase, BellRing, CalendarCheck } from "lucide-react";
import { usePrefs } from "@/lib/i18n";
import { PreferenceControls } from "@/components/app/PreferenceControls";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Career Launchpad — Personal job search space" },
      { name: "description", content: "Track applications, follow-ups and daily goals on the way to a first frontend developer role." },
      { property: "og:title", content: "Career Launchpad" },
      { property: "og:description", content: "A personal space to manage a frontend job search in Sweden and Europe." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/dashboard" });
  },
  component: Landing,
});

function Landing() {
  const { t } = usePrefs();
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <PreferenceControls className="absolute right-4 top-4" />
      <span className="flex size-14 items-center justify-center rounded-2xl bg-hero text-hero-foreground shadow-soft"><Rocket className="size-7" /></span>
      <h1 className="mt-6 max-w-2xl text-4xl font-semibold sm:text-5xl">{t("landing.title")}</h1>
      <p className="mt-4 max-w-xl text-muted-foreground">{t("landing.sub")}</p>
      <div className="mt-8 flex gap-3">
        <Button asChild size="lg"><Link to="/auth">{t("landing.signin")}</Link></Button>
      </div>
      <div className="mt-14 grid max-w-3xl gap-4 sm:grid-cols-3">
        {[[Briefcase, t("landing.f1")], [BellRing, t("landing.f2")], [CalendarCheck, t("landing.f3")]].map(([Icon, l]) => {
          const I = Icon as typeof Briefcase;
          return <div key={l as string} className="card-soft flex items-center gap-3 p-4 text-sm font-medium"><I className="size-5 text-primary" />{l as string}</div>;
        })}
      </div>
    </div>
  );
}
