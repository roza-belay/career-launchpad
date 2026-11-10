import { ExternalLink, Github, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePrefs } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/messages";
import { Progress } from "@/components/ui/progress";
import { checklistProgress, projectChecklist, type Project } from "@/lib/portfolio";

const STYLES: Record<string, string> = {
  PLANNED: "bg-status-saved text-status-saved-fg",
  IN_PROGRESS: "bg-status-interviewing text-status-interviewing-fg",
  COMPLETED: "bg-status-applied text-status-applied-fg",
  PUBLISHED: "bg-status-offer text-status-offer-fg",
};
export const projectStatusKey = (s: string) => `pf.ps.${s}` as MessageKey;

export function ProjectStatusBadge({ status }: { status: string }) {
  const { t } = usePrefs();
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", STYLES[status])}>{t(projectStatusKey(status))}</span>;
}

export function TechTags({ tech, max }: { tech: string[]; max?: number }) {
  const shown = max ? tech.slice(0, max) : tech;
  return (
    <div className="flex flex-wrap gap-1.5">
      {shown.map((x) => <span key={x} className="rounded-md bg-primary-soft px-2 py-0.5 text-xs font-medium text-accent-foreground">{x}</span>)}
      {max && tech.length > max && <span className="rounded-md px-1 py-0.5 text-xs text-muted-foreground">+{tech.length - max}</span>}
    </div>
  );
}

export function ReadyProgress({ project }: { project: Project }) {
  const { t } = usePrefs();
  const p = checklistProgress(projectChecklist(project));
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground"><span>{t("pf.ready")}</span><span>{p.done}/{p.total} · {p.percent}%</span></div>
      <Progress value={p.percent} className="h-1.5" aria-label={t("pf.ready")} />
    </div>
  );
}

export function ProjectLinks({ project, compact }: { project: Project; compact?: boolean }) {
  const cls = "inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline";
  return (
    <div className="flex flex-wrap gap-3">
      {project.github_url && <a className={cls} href={project.github_url} target="_blank" rel="noopener noreferrer"><Github className="size-4" />GitHub</a>}
      {project.demo_url && <a className={cls} href={project.demo_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="size-4" />Demo</a>}
      {!compact && project.docs_url && <a className={cls} href={project.docs_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="size-4" />Docs</a>}
    </div>
  );
}

export function ShotPlaceholder({ title }: { title: string }) {
  const { t } = usePrefs();
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-hero text-hero-foreground">
      <span className="font-display text-xl font-semibold opacity-90">{title.split(" ").map((w) => w[0]).slice(0, 3).join("")}</span>
      <span className="flex items-center gap-1 text-xs opacity-75"><ImageIcon className="size-3" />{t("pf.noImage")}</span>
    </div>
  );
}
