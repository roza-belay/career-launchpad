import { createFileRoute } from "@tanstack/react-router";
import { ComingNext } from "@/components/app/ComingNext";

export const Route = createFileRoute("/_authenticated/documents")({
  head: () => ({ meta: [{ title: "CV & Documents — Career Launchpad" }, { name: "description", content: "CV versions, cover letters, profile links and reusable recruiter message templates." }, { property: "og:title", content: "CV & Documents" }, { property: "og:description", content: "CV versions, cover letters, profile links and reusable recruiter message templates." }] }),
  component: () => <ComingNext title="CV & Documents" description="CV versions, cover letters, profile links and reusable recruiter message templates." />,
});
