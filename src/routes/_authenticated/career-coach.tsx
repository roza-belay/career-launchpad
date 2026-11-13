import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { usePrefs } from "@/lib/i18n";
const Coach = lazy(() =>
  import("@/components/app/ai/CareerCoachConversation").then((m) => ({
    default: m.CareerCoachConversation,
  })),
);
export const Route = createFileRoute("/_authenticated/career-coach")({
  head: () => ({
    meta: [
      { title: "AI Career Coach — Career Launchpad" },
      {
        name: "description",
        content:
          "Private career coaching and reviewed action plans grounded in your real experience.",
      },
      { property: "og:title", content: "AI Career Coach — Career Launchpad" },
      {
        property: "og:description",
        content: "Personal career advice and actionable goals based on your experience.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CoachPage,
});
function CoachPage() {
  const { t } = usePrefs();
  const { data: goals = [] } = useQuery({
    queryKey: ["growth"],
    queryFn: async () => {
      const r = await supabase.from("growth_items").select("*").order("created_at");
      if (r.error) throw r.error;
      return r.data;
    },
  });
  const roadmap = goals.filter((g) => g.hub === "ROADMAP");
  const done = roadmap.filter((g) => g.status === "DONE").length;
  return (
    <>
      <PageHeader title={t("ai.coach")} />
      <section className="mb-6 space-y-2 border-b pb-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-semibold">
            {t("ai.progress")} · {done}/{roadmap.length}
          </span>
          <Button asChild variant="link">
            <Link to="/growth">{t("ai.goalLink")}</Link>
          </Button>
        </div>
        <Progress
          value={roadmap.length ? (done / roadmap.length) * 100 : 0}
          aria-label={t("ai.progress")}
        />
        {!roadmap.length && <p className="text-xs text-muted-foreground">{t("ai.goalsEmpty")}</p>}
      </section>
      <Suspense fallback={<p>{t("ai.thinking")}</p>}>
        <Coach />
      </Suspense>
    </>
  );
}
