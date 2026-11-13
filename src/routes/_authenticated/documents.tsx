import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Copy, Download, FileText, Save, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/app/AppShell";
import { CvEditor } from "@/components/app/CvEditor";
import { CvSheet } from "@/components/app/CvSheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { bulletsFromText, canDeleteCv, cvFileName, parseCv, type CvContent } from "@/lib/cv";
import { useCvDocuments, useCvMutation, type CvDocument } from "@/lib/data";
import { usePrefs } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils";

const CvImport = lazy(() => import("@/components/app/ai/CvImport").then(m => ({ default: m.CvImport })));
const CvOptimizer = lazy(() => import("@/components/app/ai/CvOptimizer").then(m => ({ default: m.CvOptimizer })));

export const Route = createFileRoute("/_authenticated/documents")({
  head: () => ({ meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { title: "CV & Documents — Career Launchpad" }, { name: "description", content: "Your Swedish and English CVs, tailored versions and PDF export." }, { property: "og:title", content: "CV & Documents" }, { property: "og:description", content: "Your Swedish and English CVs, tailored versions and PDF export." }] }),
  component: DocumentsPage,
});

const KIND: Record<string, MessageKey> = { main: "cv.kindMain", international: "cv.kindIntl", tailored: "cv.kindTailored" };

/** Drop blank bullets/links before saving. */
const clean = (c: CvContent): CvContent => ({
  ...c, links: c.links.filter((l) => l.label.trim() || l.url.trim()),
  sections: c.sections.map((s) => ({ ...s, entries: s.entries.map((e) => ({ ...e, bullets: bulletsFromText(e.bullets.join("\n")) })) })),
});

function DocumentsPage() {
  const { t, date } = usePrefs();
  const { data: docs = [], isLoading } = useCvDocuments();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const selected = docs.find((d) => d.id === selectedId) ?? docs[0];

  return (
    <>
      <PageHeader title={t("nav.documents")} subtitle={t("cv.subtitle")} />
      <Button variant="outline" className="mb-5" onClick={() => { if (!dirty || window.confirm(t("cv.discardText"))) setImportOpen(!importOpen); }}>{t("ai.import")}</Button>
      {importOpen && <Suspense fallback={<p>{t("ai.thinking")}</p>}><CvImport onCreated={id => { setDirty(false); setSelectedId(id); setImportOpen(false); }} /></Suspense>}
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-2">
          <h2 className="px-1 text-sm font-semibold text-muted-foreground">{t("cv.versions")}</h2>
          {docs.map((d) => (
            <button key={d.id} onClick={() => { if (d.id === selected?.id) return; if (dirty) setPendingId(d.id); else setSelectedId(d.id); }}
              className={cn("card-soft w-full p-3 text-left transition hover:border-primary/50", selected?.id === d.id && "border-primary ring-1 ring-primary")}>
              <div className="flex items-start gap-2">
                <FileText className="mt-0.5 size-4 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{d.name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <Badge variant="secondary">{t(KIND[d.kind] ?? "cv.kindTailored")}</Badge>
                    <span className="text-xs text-muted-foreground">{d.language === "sv" ? "🇸🇪 SV" : "🇬🇧 EN"}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{t("cv.updated", { d: date(d.updated_at) })}</p>
                </div>
              </div>
            </button>
          ))}
          {!isLoading && docs.length === 0 && <p className="card-soft p-4 text-sm text-muted-foreground">{t("cv.none")}</p>}
        </aside>
        {selected && <CvWorkspace key={selected.id} doc={selected} onDirtyChange={setDirty} onCreated={(id) => { setDirty(false); setSelectedId(id); }} onDeleted={() => { setDirty(false); setSelectedId(null); }} />}
      </div>
      <AlertDialog open={pendingId !== null} onOpenChange={(open) => !open && setPendingId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{t("cv.discardTitle")}</AlertDialogTitle><AlertDialogDescription>{t("cv.discardText")}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel><AlertDialogAction onClick={() => { setSelectedId(pendingId); setPendingId(null); setDirty(false); }}>{t("cv.discard")}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function CvWorkspace({ doc, onCreated, onDeleted, onDirtyChange }: { doc: CvDocument; onCreated: (id: string) => void; onDeleted: () => void; onDirtyChange: (dirty: boolean) => void }) {
  const { t } = usePrefs();
  const initial = useMemo(() => parseCv(doc.content), [doc.content]);
  const [cv, setCv] = useState<CvContent>(initial);
  const [name, setName] = useState(doc.name);
  const [copyOpen, setCopyOpen] = useState(false);
  const [delOpen, setDelOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [optimize, setOptimize] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => { setCv(initial); setName(doc.name); }, [initial, doc.name]);
  const dirty = name !== doc.name || JSON.stringify(cv) !== JSON.stringify(initial);
  useEffect(() => { onDirtyChange(dirty); }, [dirty, onDirtyChange]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const save = useCvMutation(async () => supabase.from("cv_documents").update({ name: name.trim() || doc.name, content: clean(cv), updated_at: new Date().toISOString() }).eq("id", doc.id), "cv.saved");
  const del = useCvMutation(async () => supabase.from("cv_documents").delete().eq("id", doc.id), "common.deleted");

  function downloadPdf() {
    const prev = document.title;
    document.title = cvFileName(cv.name, name);
    const restore = () => { document.title = prev; window.removeEventListener("afterprint", restore); };
    window.addEventListener("afterprint", restore);
    window.print();
  }

  return (
    <div className="min-w-0 space-y-4">
      <div className="card-soft flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-56 flex-1 space-y-1.5">
          <Label htmlFor="cv-name">{t("cv.versionName")}</Label>
          <Input id="cv-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <Button onClick={() => save.mutate(undefined)} disabled={!dirty || save.isPending}><Save className="size-4" />{t("common.save")}</Button>
        <Button variant="outline" onClick={downloadPdf}><Download className="size-4" />{t("cv.pdf")}</Button>
        <Button variant="outline" onClick={() => setCopyOpen(true)}><Copy className="size-4" />{t("cv.tailor")}</Button>
        <Button variant="outline" onClick={() => setOptimize(!optimize)}>{t("ai.optimizer")}</Button>
        {canDeleteCv(doc.kind) && <Button variant="ghost" onClick={() => setDelOpen(true)}><Trash2 className="size-4" />{t("common.delete")}</Button>}
      </div>
      {dirty && <p className="text-sm text-muted-foreground">{t("cv.unsaved")}</p>}
      <p className="text-xs text-muted-foreground">{t("cv.pdfHint")}</p>
      {optimize && <Suspense fallback={<p>{t("ai.thinking")}</p>}><CvOptimizer cv={cv} cvName={doc.name} language={doc.language} onChange={setCv} onCreated={onCreated} /></Suspense>}

      <div className="grid gap-6 2xl:grid-cols-2">
        <CvEditor cv={cv} onChange={setCv} />
        <div className="2xl:sticky 2xl:top-6 2xl:self-start">
          <h2 className="mb-2 text-sm font-semibold text-muted-foreground">{t("cv.preview")}</h2>
          <div className="overflow-x-auto"><CvSheet cv={cv} /></div>
        </div>
      </div>

      {mounted && createPortal(<div className="cv-print-only"><CvSheet cv={cv} /></div>, document.body)}
      <TailorDialog open={copyOpen} onOpenChange={setCopyOpen} sourceName={name} sourceLang={doc.language} content={clean(cv)} onCreated={onCreated} />
      <AlertDialog open={delOpen} onOpenChange={setDelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{t("cv.deleteTitle")}</AlertDialogTitle><AlertDialogDescription>{t("cv.deleteText", { n: doc.name })}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => del.mutate(undefined, { onSuccess: onDeleted })}>{t("common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function TailorDialog({ open, onOpenChange, sourceName, sourceLang, content, onCreated }: {
  open: boolean; onOpenChange: (o: boolean) => void; sourceName: string; sourceLang: string; content: CvContent; onCreated: (id: string) => void;
}) {
  const { t } = usePrefs();
  const [name, setName] = useState("");
  useEffect(() => { if (open) setName(`${sourceName} – `); }, [open, sourceName]);
  const create = useCvMutation(async (n: string) => {
    const r = await supabase.from("cv_documents").insert({ name: n, language: sourceLang, kind: "tailored", content }).select("id").single();
    if (r.data) onCreated(r.data.id);
    return r;
  }, "cv.created");
  const valid = name.trim().length > 0;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{t("cv.tailorTitle")}</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">{t("cv.tailorText", { n: sourceName })}</p>
        <div className="space-y-1.5"><Label htmlFor="tailor-name">{t("cv.versionName")}</Label><Input id="tailor-name" value={name} onChange={(e) => setName(e.target.value)} /></div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
          <Button disabled={!valid || create.isPending} onClick={() => create.mutate(name.trim(), { onSuccess: () => onOpenChange(false) })}>{t("cv.create")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
