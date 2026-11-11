import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ExternalLink, LayoutGrid, Pencil, Plus, Rows3, Search, Trash2, Briefcase } from "lucide-react";
import { PageHeader } from "@/components/app/AppShell";
import { ApplicationForm } from "@/components/app/ApplicationForm";
import { DemoBadge, StatusBadge, STATUS_DOT, arrKey, statusKey } from "@/components/app/StatusBadge";
import { usePrefs } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { STATUSES, followUpState, type Status } from "@/lib/followup";
import { useApplications, useDeleteApplication, useUpdateApplication, type Application } from "@/lib/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/applications")({
  head: () => ({ meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { title: "My Applications — Career Launchpad" }, { name: "description", content: "Track every job application." }, { property: "og:title", content: "My Applications" }, { property: "og:description", content: "Track every job application." }] }),
  component: ApplicationsPage,
});

type SortKey = "created_at" | "company" | "applied_date" | "next_follow_up";

function ApplicationsPage() {
  const { data = [], isLoading } = useApplications();
  const del = useDeleteApplication();
  const update = useUpdateApplication();
  const { t, date, salary } = usePrefs();
  const [view, setView] = useState<"table" | "board">("table");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("ALL");
  const [arr, setArr] = useState("ALL");
  const [source, setSource] = useState("ALL");
  const [sort, setSort] = useState<SortKey>("created_at");
  const [editing, setEditing] = useState<Application | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [toDelete, setToDelete] = useState<string[] | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const rows = useMemo(() => {
    const s = q.toLowerCase();
    return data
      .filter((a) => !s || [a.company, a.title, a.location, a.notes, a.recruiter_name].some((v) => v?.toLowerCase().includes(s)))
      .filter((a) => status === "ALL" || a.status === status)
      .filter((a) => arr === "ALL" || a.arrangement === arr)
      .filter((a) => source === "ALL" || (source === "DEMO" ? a.is_demo : !a.is_demo))
      .sort((a, b) => {
        if (sort === "company") return a.company.localeCompare(b.company);
        const av = a[sort] ?? "", bv = b[sort] ?? "";
        return sort === "next_follow_up" ? (av || "9999").localeCompare(bv || "9999") : bv.localeCompare(av);
      });
  }, [data, q, status, arr, source, sort]);

  const demoIds = data.filter((a) => a.is_demo).map((a) => a.id);
  const openNew = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (a: Application) => { setEditing(a); setFormOpen(true); };

  return (
    <>
      <PageHeader
        title={t("apps.title")}
        subtitle={t("apps.subtitle", { total: data.length, own: data.filter((a) => !a.is_demo).length })}
        action={<div className="flex gap-2">
          {demoIds.length > 0 && <Button variant="outline" onClick={() => setToDelete(demoIds)}>{t("apps.removeDemo")}</Button>}
          <Button onClick={openNew}><Plus className="size-4" /> {t("apps.add")}</Button>
        </div>}
      />

      <div className="card-soft mb-5 flex flex-wrap items-center gap-3 p-3">
        <div className="relative min-w-52 flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder={t("apps.search")} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Filter value={status} onChange={setStatus} options={["ALL", ...STATUSES]} label={t("apps.status")} />
        <Filter value={arr} onChange={setArr} options={["ALL", "Remote", "Hybrid", "On-site"]} label={t("apps.arrangement")} />
        <Filter value={source} onChange={setSource} options={["ALL", "MINE", "DEMO"]} label={t("apps.data")} />
        <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at">{t("apps.sortNewest")}</SelectItem>
            <SelectItem value="company">{t("apps.sortCompany")}</SelectItem>
            <SelectItem value="applied_date">{t("apps.sortApplied")}</SelectItem>
            <SelectItem value="next_follow_up">{t("apps.sortFollow")}</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex rounded-lg bg-muted p-1">
          <button aria-label={t("apps.tableView")} onClick={() => setView("table")} className={cn("rounded-md p-1.5", view === "table" && "bg-card shadow-soft")}><Rows3 className="size-4" /></button>
          <button aria-label={t("apps.boardView")} onClick={() => setView("board")} className={cn("rounded-md p-1.5", view === "board" && "bg-card shadow-soft")}><LayoutGrid className="size-4" /></button>
        </div>
      </div>

      {isLoading ? <p className="text-muted-foreground">{t("common.loading")}</p> : data.length === 0 ? (
        <Empty onAdd={openNew} />
      ) : view === "table" ? (
        <div className="card-soft overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>{[t("apps.colCompany"), t("apps.colLocation"), t("apps.colSalary"), t("apps.colApplied"), t("apps.colFollow"), t("apps.colStatus"), ""].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((a) => {
                const fs = followUpState(a);
                return (
                  <tr key={a.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 font-semibold">{a.company} {a.is_demo && <DemoBadge />}</div>
                      <div className="text-muted-foreground">{a.title}</div>
                    </td>
                    <td className="px-4 py-3">{a.location ?? "—"}<div className="text-xs text-muted-foreground">{a.arrangement && t(arrKey(a.arrangement))}</div></td>
                    <td className="whitespace-nowrap px-4 py-3">{salary(a.salary_min, a.salary_max)}</td>
                    <td className="whitespace-nowrap px-4 py-3">{date(a.applied_date)}</td>
                    <td className={cn("whitespace-nowrap px-4 py-3", fs === "overdue" && "font-semibold text-destructive", fs === "today" && "font-semibold text-warning-foreground")}>{fs === "none" ? "—" : date(a.next_follow_up)}</td>
                    <td className="px-4 py-3">
                      <Select value={a.status} onValueChange={(v) => update.mutate({ id: a.id, values: { status: v as Status } })}>
                        <SelectTrigger className="h-auto w-auto border-0 bg-transparent p-0 shadow-none"><StatusBadge status={a.status} /></SelectTrigger>
                        <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{t(statusKey(s))}</SelectItem>)}</SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {a.job_url && <Button asChild size="icon" variant="ghost"><a href={a.job_url} target="_blank" rel="noreferrer" aria-label={t("apps.openAd")}><ExternalLink className="size-4" /></a></Button>}
                        <Button size="icon" variant="ghost" onClick={() => openEdit(a)} aria-label={t("common.edit")}><Pencil className="size-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => setToDelete([a.id])} aria-label={t("common.delete")}><Trash2 className="size-4" /></Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">{t("apps.noMatch")}</td></tr>}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid gap-4 overflow-x-auto pb-2 md:grid-cols-5">
          {STATUSES.map((s) => {
            const col = rows.filter((a) => a.status === s);
            return (
              <div key={s} className="min-w-56 rounded-2xl bg-muted/70 p-3"
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => { if (dragId) update.mutate({ id: dragId, values: { status: s } }); setDragId(null); }}>
                <div className="mb-3 flex items-center gap-2 px-1 text-xs font-bold tracking-wide">
                  <span className={cn("size-2 rounded-full", STATUS_DOT[s])} /> {t(statusKey(s))} <span className="ml-auto text-muted-foreground">{col.length}</span>
                </div>
                <div className="space-y-2">
                  {col.map((a) => (
                    <button key={a.id} draggable onDragStart={() => setDragId(a.id)} onClick={() => openEdit(a)}
                      className="card-soft block w-full cursor-grab p-3 text-left text-sm active:cursor-grabbing">
                      <div className="font-semibold">{a.company}</div>
                      <div className="text-muted-foreground">{a.title}</div>
                      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{a.arrangement && t(arrKey(a.arrangement))}</span>{a.is_demo && <DemoBadge />}
                      </div>
                    </button>
                  ))}
                  {col.length === 0 && <p className="px-1 py-4 text-center text-xs text-muted-foreground">{t("apps.drop")}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ApplicationForm open={formOpen} onOpenChange={setFormOpen} application={editing} />
      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{toDelete?.length === 1 ? t("apps.deleteOne") : t("apps.deleteMany", { n: toDelete?.length ?? 0 })}</AlertDialogTitle>
            <AlertDialogDescription>{t("apps.deleteDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (toDelete) del.mutate(toDelete); setToDelete(null); }}>{t("common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function Filter({ value, onChange, options, label }: { value: string; onChange: (v: string) => void; options: string[]; label: string }) {
  const { t } = usePrefs();
  const name = (o: string) => o === "ALL" ? t("apps.all", { label }) : o === "MINE" ? t("apps.mine") : o === "DEMO" ? t("apps.demo") : (STATUSES as readonly string[]).includes(o) ? t(statusKey(o)) : t(arrKey(o));
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-40" aria-label={label}><SelectValue /></SelectTrigger>
      <SelectContent>{options.map((o) => <SelectItem key={o} value={o}>{name(o)}</SelectItem>)}</SelectContent>
    </Select>
  );
}

function Empty({ onAdd }: { onAdd: () => void }) {
  const { t } = usePrefs();
  return (
    <div className="card-soft flex flex-col items-center p-12 text-center">
      <Briefcase className="size-10 text-primary" />
      <h2 className="mt-4 text-lg font-semibold">{t("apps.emptyTitle")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("apps.emptyText")}</p>
      <Button className="mt-5" onClick={onAdd}><Plus className="size-4" /> {t("apps.add")}</Button>
    </div>
  );
}
