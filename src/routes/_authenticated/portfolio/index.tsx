import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { FolderKanban, Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/app/AppShell";
import { ProjectForm } from "@/components/app/portfolio/ProjectForm";
import { ProjectLinks, ProjectStatusBadge, ReadyProgress, ShotPlaceholder, TechTags, projectStatusKey } from "@/components/app/portfolio/ProjectBits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProjects, useScreenshotUrls } from "@/lib/data";
import { usePrefs } from "@/lib/i18n";
import { matchesProject, PROJECT_STATUSES, type Project } from "@/lib/portfolio";

const META = "Your projects with tech stack, GitHub and live demo links, plus a recruiter-ready checklist.";
export const Route = createFileRoute("/_authenticated/portfolio/")({
  head: () => ({ meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { title: "Portfolio & Projects — Career Launchpad" }, { name: "description", content: META }, { property: "og:title", content: "Portfolio & Projects" }, { property: "og:description", content: META }] }),
  component: PortfolioPage,
});

function PortfolioPage() {
  const { t } = usePrefs();
  const { data: projects = [], isLoading } = useProjects();
  const [q, setQ] = useState(""); const [status, setStatus] = useState("all"); const [tech, setTech] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const allTech = useMemo(() => [...new Set(projects.flatMap((p) => p.technologies))].sort((a, b) => a.localeCompare(b)), [projects]);
  const shown = projects.filter((p) => matchesProject(p, q, status, tech));
  const covers = useScreenshotUrls(projects.map((p) => p.screenshots[0]).filter((x): x is string => !!x));

  return (
    <>
      <PageHeader title={t("nav.portfolio")} subtitle={t("pf.subtitle")} action={<Button onClick={() => setAddOpen(true)}><Plus className="size-4" />{t("pf.add")}</Button>} />
      <div className="card-soft mb-6 flex flex-wrap gap-3 p-3">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder={t("pf.search")} value={q} onChange={(e) => setQ(e.target.value)} aria-label={t("pf.search")} />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-44" aria-label={t("pf.f.status")}><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">{t("pf.allStatuses")}</SelectItem>{PROJECT_STATUSES.map((s) => <SelectItem key={s} value={s}>{t(projectStatusKey(s))}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={tech} onValueChange={setTech}>
          <SelectTrigger className="w-48" aria-label={t("pf.f.tech")}><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">{t("pf.allTech")}</SelectItem>{allTech.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {!isLoading && shown.length === 0 && (
        <div className="card-soft flex flex-col items-center p-12 text-center">
          <FolderKanban className="size-8 text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">{t(projects.length ? "pf.noMatch" : "pf.empty")}</p>
          {!projects.length && <Button className="mt-4" onClick={() => setAddOpen(true)}><Plus className="size-4" />{t("pf.add")}</Button>}
        </div>
      )}
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {shown.map((p) => <ProjectCard key={p.id} project={p} cover={p.screenshots[0] ? (covers.data?.[p.screenshots[0]] ?? undefined) : undefined} />)}
      </div>
      <ProjectForm open={addOpen} onOpenChange={setAddOpen} />
    </>
  );
}

function ProjectCard({ project: p, cover }: { project: Project; cover?: string | undefined }) {
  const { t } = usePrefs();
  return (
    <article className="card-soft flex flex-col overflow-hidden">
      <div className="aspect-video w-full overflow-hidden border-b border-border bg-muted">
        {cover ? <img src={cover} alt={p.title} className="h-full w-full object-cover object-top" loading="lazy" /> : <ShotPlaceholder title={p.title} />}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-lg font-semibold leading-tight">{p.title}</h2>
          <ProjectStatusBadge status={p.status} />
        </div>
        {p.short_description && <p className="line-clamp-3 text-sm text-muted-foreground">{p.short_description}</p>}
        <TechTags tech={p.technologies} max={6} />
        <div className="mt-auto space-y-3 pt-2">
          <ReadyProgress project={p} />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <ProjectLinks project={p} compact />
            <Button asChild size="sm" variant="secondary"><Link to="/portfolio/$id" params={{ id: p.id }}>{t("pf.viewDetails")}</Link></Button>
          </div>
        </div>
      </div>
    </article>
  );
}
