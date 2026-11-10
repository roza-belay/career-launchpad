import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Rocket, Briefcase, BellRing, CalendarCheck } from "lucide-react";
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
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-hero text-primary-foreground shadow-soft"><Rocket className="size-7" /></span>
      <h1 className="mt-6 max-w-2xl text-4xl font-semibold sm:text-5xl">Your personal launchpad to a first frontend role</h1>
      <p className="mt-4 max-w-xl text-muted-foreground">Applications, follow-ups and daily goals — all in one private space.</p>
      <div className="mt-8 flex gap-3">
        <Button asChild size="lg"><Link to="/auth">Sign in</Link></Button>
      </div>
      <div className="mt-14 grid max-w-3xl gap-4 sm:grid-cols-3">
        {[[Briefcase, "Application tracker"], [BellRing, "Smart follow-ups"], [CalendarCheck, "Daily planner"]].map(([Icon, l]) => {
          const I = Icon as typeof Briefcase;
          return <div key={l as string} className="card-soft flex items-center gap-3 p-4 text-sm font-medium"><I className="size-5 text-primary" />{l as string}</div>;
        })}
      </div>
    </div>
  );
}
