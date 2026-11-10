import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { emptyEntry, type CvContent, type CvEntry } from "@/lib/cv";
import { usePrefs } from "@/lib/i18n";

export function CvEditor({ cv, onChange }: { cv: CvContent; onChange: (c: CvContent) => void }) {
  const { t } = usePrefs();
  const set = (patch: Partial<CvContent>) => onChange({ ...cv, ...patch });
  const setSection = (i: number, patch: Partial<CvContent["sections"][number]>) =>
    set({ sections: cv.sections.map((s, j) => (j === i ? { ...s, ...patch } : s)) });
  const setEntry = (si: number, ei: number, patch: Partial<CvEntry>) =>
    setSection(si, { entries: cv.sections[si]!.entries.map((e, j) => (j === ei ? { ...e, ...patch } : e)) });

  return (
    <div className="space-y-6">
      <Block title={t("cv.personal")}>
        <div className="grid gap-3 sm:grid-cols-2">
          <F label={t("cv.fullName")}><Input value={cv.name} onChange={(e) => set({ name: e.target.value })} /></F>
          <F label={t("cv.headline")}><Input value={cv.headline} onChange={(e) => set({ headline: e.target.value })} /></F>
          <F label={t("cv.phone")}><Input value={cv.phone} onChange={(e) => set({ phone: e.target.value })} /></F>
          <F label={t("cv.email")}><Input type="email" value={cv.email} onChange={(e) => set({ email: e.target.value })} /></F>
        </div>
        <div className="mt-4 space-y-2">
          <Label>{t("cv.links")}</Label>
          {cv.links.map((l, i) => (
            <div key={i} className="flex gap-2">
              <Input className="w-2/5" placeholder={t("cv.linkLabel")} value={l.label} onChange={(e) => set({ links: cv.links.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} />
              <Input placeholder="https://…" value={l.url} onChange={(e) => set({ links: cv.links.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)) })} />
              <Button variant="ghost" size="icon" aria-label={t("cv.removeLink")} onClick={() => set({ links: cv.links.filter((_, j) => j !== i) })}><Trash2 className="size-4" /></Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => set({ links: [...cv.links, { label: "", url: "" }] })}><Plus className="size-4" />{t("cv.addLink")}</Button>
        </div>
      </Block>

      <Block title={t("cv.profile")}>
        <F label={t("cv.sectionTitle")}><Input value={cv.profileTitle} onChange={(e) => set({ profileTitle: e.target.value })} /></F>
        <Textarea className="mt-3 min-h-40" value={cv.profile} onChange={(e) => set({ profile: e.target.value })} />
      </Block>

      {cv.sections.map((s, si) => (
        <Block key={si} title={s.title || t("cv.untitled")} action={
          <Button variant="ghost" size="sm" onClick={() => set({ sections: cv.sections.filter((_, j) => j !== si) })}><Trash2 className="size-4" />{t("cv.removeSection")}</Button>}>
          <F label={t("cv.sectionTitle")}><Input value={s.title} onChange={(e) => setSection(si, { title: e.target.value })} /></F>
          {s.entries.map((e, ei) => (
            <div key={ei} className="mt-3 space-y-2 rounded-lg border bg-muted/30 p-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <Input placeholder={t("cv.entryHeading")} value={e.heading} onChange={(ev) => setEntry(si, ei, { heading: ev.target.value })} />
                <Input placeholder={t("cv.entrySub")} value={e.sub} onChange={(ev) => setEntry(si, ei, { sub: ev.target.value })} />
              </div>
              <Textarea placeholder={t("cv.entryText")} value={e.text} onChange={(ev) => setEntry(si, ei, { text: ev.target.value })} />
              <Textarea className="min-h-28" placeholder={t("cv.entryBullets")} value={e.bullets.join("\n")} onChange={(ev) => setEntry(si, ei, { bullets: ev.target.value.split("\n") })} />
              <div className="flex justify-end"><Button variant="ghost" size="sm" onClick={() => setSection(si, { entries: s.entries.filter((_, j) => j !== ei) })}><Trash2 className="size-4" />{t("cv.removeEntry")}</Button></div>
            </div>
          ))}
          <Button variant="outline" size="sm" className="mt-3" onClick={() => setSection(si, { entries: [...s.entries, emptyEntry()] })}><Plus className="size-4" />{t("cv.addEntry")}</Button>
        </Block>
      ))}
      <Button variant="outline" onClick={() => set({ sections: [...cv.sections, { title: "", entries: [emptyEntry()] }] })}><Plus className="size-4" />{t("cv.addSection")}</Button>

      <Block title={t("cv.footer")}><Input value={cv.footer} onChange={(e) => set({ footer: e.target.value })} /></Block>
    </div>
  );
}

function Block({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="card-soft p-5">
      <div className="mb-3 flex items-center justify-between gap-2"><h3 className="font-semibold">{title}</h3>{action}</div>
      {children}
    </section>
  );
}
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}
