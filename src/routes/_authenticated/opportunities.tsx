import { createFileRoute } from "@tanstack/react-router";
import { ComingNext } from "@/components/app/ComingNext";

export const Route = createFileRoute("/_authenticated/opportunities")({
  head: () => ({ meta: [{ title: "Job Opportunities — Career Launchpad" }, { name: "description", content: "Save vacancies from LinkedIn and career pages, with filters for junior, React, Stockholm and Remote Europe." }, { property: "og:title", content: "Job Opportunities" }, { property: "og:description", content: "Save vacancies from LinkedIn and career pages, with filters for junior, React, Stockholm and Remote Europe." }] }),
  component: () => <ComingNext title="nav.opportunities" description="soon.opportunities" />,
});
