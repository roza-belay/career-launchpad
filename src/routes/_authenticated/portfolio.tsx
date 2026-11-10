import { createFileRoute } from "@tanstack/react-router";
import { ComingNext } from "@/components/app/ComingNext";

export const Route = createFileRoute("/_authenticated/portfolio")({
  head: () => ({ meta: [{ title: "Portfolio & Projects — Career Launchpad" }, { name: "description", content: "Your projects with tech stack, GitHub and live demo links, plus a recruiter-ready checklist." }, { property: "og:title", content: "Portfolio & Projects" }, { property: "og:description", content: "Your projects with tech stack, GitHub and live demo links, plus a recruiter-ready checklist." }] }),
  component: () => <ComingNext title="Portfolio & Projects" description="Your projects with tech stack, GitHub and live demo links, plus a recruiter-ready checklist." />,
});
