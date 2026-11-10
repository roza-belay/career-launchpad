/** Structured CV content stored per version. Pure helpers only (tested). */
export type CvLink = { label: string; url: string };
export type CvEntry = { heading: string; sub: string; text: string; bullets: string[] };
export type CvSection = { title: string; entries: CvEntry[] };
export type CvContent = {
  name: string; headline: string; phone: string; email: string; links: CvLink[];
  profileTitle: string; profile: string; sections: CvSection[]; footer: string;
};
export type CvKind = "main" | "international" | "tailored";
export type CvLang = "sv" | "en";

const str = (v: unknown) => (typeof v === "string" ? v : "");
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const obj = (v: unknown): { [k: string]: unknown } & Partial<Record<"name" | "headline" | "phone" | "email" | "links" | "label" | "url" | "profileTitle" | "profile" | "footer" | "sections" | "title" | "entries" | "heading" | "sub" | "text" | "bullets", unknown>> => (v && typeof v === "object" ? (v as { [k: string]: unknown } & Partial<Record<"name" | "headline" | "phone" | "email" | "links" | "label" | "url" | "profileTitle" | "profile" | "footer" | "sections" | "title" | "entries" | "heading" | "sub" | "text" | "bullets", unknown>>) : {});

export const emptyEntry = (): CvEntry => ({ heading: "", sub: "", text: "", bullets: [] });

/** Normalises stored JSON so the editor never crashes on missing fields. */
export function parseCv(raw: unknown): CvContent {
  const o = obj(raw);
  return {
    name: str(o.name), headline: str(o.headline), phone: str(o.phone), email: str(o.email),
    links: arr(o.links).map((l) => ({ label: str(obj(l).label), url: str(obj(l).url) })),
    profileTitle: str(o.profileTitle), profile: str(o.profile), footer: str(o.footer),
    sections: arr(o.sections).map((s) => ({
      title: str(obj(s).title),
      entries: arr(obj(s).entries).map((e) => {
        const x = obj(e);
        return { heading: str(x.heading), sub: str(x.sub), text: str(x.text), bullets: arr(x.bullets).map(str) };
      }),
    })),
  };
}

/** Bullets edited as one line per bullet; blank lines dropped. */
export const bulletsFromText = (t: string) => t.split("\n").map((s) => s.trim()).filter(Boolean);

/** "Roza Belay – English CV.pdf"-style safe file name (without extension). */
export function cvFileName(person: string, version: string) {
  return [person, version].map((s) => s.trim()).filter(Boolean).join(" - ").replace(/[\\/:*?"<>|]+/g, "").replace(/\s+/g, " ") || "CV";
}

/** Only tailored copies may be deleted; the two base versions are kept. */
export const canDeleteCv = (kind: string) => kind === "tailored";
