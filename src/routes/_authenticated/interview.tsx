import { createFileRoute } from "@tanstack/react-router";
import { ComingNext } from "@/components/app/ComingNext";

export const Route = createFileRoute("/_authenticated/interview")({
  head: () => ({ meta: [{ title: "Interview Preparation — Career Launchpad" }, { name: "description", content: "Questions, sample answers and practice status for HTML, CSS, JavaScript, React, TypeScript and HR interviews." }, { property: "og:title", content: "Interview Preparation" }, { property: "og:description", content: "Questions, sample answers and practice status for HTML, CSS, JavaScript, React, TypeScript and HR interviews." }] }),
  component: () => <ComingNext title="Interview Preparation" description="Questions, sample answers and practice status for HTML, CSS, JavaScript, React, TypeScript and HR interviews." />,
});
