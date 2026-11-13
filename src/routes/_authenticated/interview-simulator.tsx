import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/AppShell";
import { InterviewSession } from "@/components/app/ai/InterviewSession";
import { usePrefs } from "@/lib/i18n";
export const Route = createFileRoute("/_authenticated/interview-simulator")({
  head: () => ({
    meta: [
      { title: "AI Interview Simulator — Career Launchpad" },
      {
        name: "description",
        content:
          "Practice role-specific interviews with factual, constructive feedback in a private session.",
      },
      { property: "og:title", content: "AI Interview Simulator — Career Launchpad" },
      {
        property: "og:description",
        content: "Role-specific questions and feedback grounded in your real experience.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SimulatorPage,
});
function SimulatorPage() {
  const { t } = usePrefs();
  return (
    <>
      <PageHeader title={t("ai.simulator")} />
      <InterviewSession />
    </>
  );
}
