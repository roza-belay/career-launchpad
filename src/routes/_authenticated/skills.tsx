import { createFileRoute } from "@tanstack/react-router";
import { ComingNext } from "@/components/app/ComingNext";

export const Route = createFileRoute("/_authenticated/skills")({
  head: () => ({ meta: [{ title: "Skills Development — Career Launchpad" }, { name: "description", content: "Progress bars for HTML, CSS, JavaScript, React, TypeScript, accessibility and more." }, { property: "og:title", content: "Skills Development" }, { property: "og:description", content: "Progress bars for HTML, CSS, JavaScript, React, TypeScript, accessibility and more." }] }),
  component: () => <ComingNext title="Skills Development" description="Progress bars for HTML, CSS, JavaScript, React, TypeScript, accessibility and more." />,
});
