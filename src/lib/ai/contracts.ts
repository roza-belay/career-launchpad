import { z } from "zod";
import { parseCv, type CvContent } from "@/lib/cv";

export const AI_LIMITS = {
  fileBytes: 5 * 1024 * 1024,
  pdfPages: 20,
  extractedChars: 60000,
  zipBytes: 12 * 1024 * 1024,
  zipEntries: 200,
  questions: 5,
} as const;
const id = z.string().uuid().optional();
export const contextSchema = z.object({
  profile: z.boolean().default(false),
  skills: z.boolean().default(false),
  goals: z.boolean().default(false),
  cvId: id,
  vacancyId: id,
  jobText: z.string().max(20000).default(""),
});
export type AiContext = z.infer<typeof contextSchema>;
export const EMPTY_CONTEXT: AiContext = {
  profile: false,
  skills: false,
  goals: false,
  jobText: "",
};
export const turnSchema = z.object({
  role: z.enum(["user", "assistant"]),
  text: z.string().min(1).max(12000),
});
export const coachSchema = z
  .object({
    lang: z.enum(["en", "sv"]),
    context: contextSchema,
    turns: z.array(turnSchema).min(1).max(30),
  })
  .refine((v) => v.turns.reduce((n, t) => n + t.text.length, 0) <= 60000, "Conversation too long");
export const taskSchema = z
  .object({
    operation: z.enum(["actions", "optimize", "import", "interview", "summary"]),
    lang: z.enum(["en", "sv"]),
    context: contextSchema,
    text: z.string().max(60000).default(""),
    role: z.string().max(150).default(""),
    focus: z.enum(["mixed", "technical", "behavioral"]).default("mixed"),
    turns: z.array(turnSchema).max(12).default([]),
    source: z.unknown().optional(),
    cvLanguage: z.enum(["en", "sv"]).optional(),
  })
  .refine((v) => v.turns.reduce((n, t) => n + t.text.length, 0) <= 60000, "Session too long");
export type AiTask = z.infer<typeof taskSchema>;
export type AiTurn = z.infer<typeof turnSchema>;
export const actionSchema = z.object({
  actions: z
    .array(z.object({ title: z.string().min(1).max(200), details: z.string().max(2000) }))
    .max(6),
});
export const optimizationSchema = z.object({
  analysis: z.string().max(6000),
  supported: z.array(z.string().max(200)).max(20),
  missing: z.array(z.string().max(200)).max(20),
  learning: z.array(z.string().max(300)).max(10),
  suggestions: z
    .array(
      z.object({
        path: z.string().max(120),
        original: z.string().max(6000),
        replacement: z.string().max(6000),
        reason: z.string().max(1000),
      }),
    )
    .max(12),
});
export const interviewSchema = z.object({
  feedback: z.string().max(6000),
  question: z.string().max(1000),
});
export const summarySchema = z.object({ summary: z.string().max(8000) });
const entrySchema = z.object({
  heading: z.string().max(500),
  sub: z.string().max(500),
  text: z.string().max(6000),
  bullets: z.array(z.string().max(2000)).max(30),
});
export const cvSchema = z.object({
  name: z.string().max(200),
  headline: z.string().max(300),
  phone: z.string().max(100),
  email: z.string().max(200),
  links: z.array(z.object({ label: z.string().max(200), url: z.string().max(1000) })).max(10),
  profileTitle: z.string().max(200),
  profile: z.string().max(6000),
  sections: z
    .array(z.object({ title: z.string().max(200), entries: z.array(entrySchema).max(30) }))
    .max(20),
  footer: z.string().max(500),
});
const CONTACT = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+|https?:\/\/\S+|www\.\S+|(?:linkedin|github)\.com\/\S+|\+?\d[\d\s().-]{6,}\d/gi;
/** Replace e-mails, URLs and phone numbers with placeholders; the map stays in the browser. */
export function redactContact(text: string, map: Record<string, string> = {}) {
  const out = text.replace(CONTACT, (m) => {
    if (/^\d{4}\s*[–-]\s*\d{4}$/.test(m.trim())) return m; // keep year ranges
    const found = Object.entries(map).find(([, v]) => v === m);
    if (found) return found[0];
    const key = `[CONTACT_${Object.keys(map).length + 1}]`;
    map[key] = m;
    return key;
  });
  return { text: out, map };
}
export function restoreContact<T>(value: T, map: Record<string, string>): T {
  const fix = (v: unknown): unknown => typeof v === "string" ? v.replace(/\[(?:CONTACT_\d+|NAME)\]/g, k => map[k] ?? k) : Array.isArray(v) ? v.map(fix) : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fix(x)])) : v;
  return fix(value) as T;
}
const esc = (v: string) => v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** Patterns for the CV's own name: full name, each name part (3+ letters) and initial forms like "T. Fiktivsson" or "T.F.". */
export function namePatterns(name: string): RegExp[] {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return [];
  const forms = new Set<string>([esc(parts.join(" ")).replace(/ /g, "\\s+")]);
  const last = parts[parts.length - 1]!;
  if (parts.length > 1) {
    forms.add(`${esc(parts[0]![0]!)}\\.?\\s*${esc(last)}`);
    forms.add(parts.map(p => `${esc(p[0]!)}\\.`).join("\\s*"));
  }
  parts.filter(p => p.replace(/\W/g, "").length >= 3).forEach(p => forms.add(esc(p)));
  return [...forms].sort((a, b) => b.length - a.length).map(f => new RegExp(`(?<![\\p{L}\\p{N}])${f}(?![\\p{L}\\p{N}])`, "giu"));
}
export function redactName(text: string, patterns: RegExp[], map: Record<string, string>) {
  let out = text;
  for (const re of patterns) out = out.replace(re, () => { map["[NAME]"] = map["[NAME]"] ?? ""; return "[NAME]"; });
  return out;
}
/** CV copy shared with AI plus a browser-only map to restore placeholders in suggestions. */
export function redactCv(raw: unknown): { cv: CvContent; map: Record<string, string> } {
  const cv = cvSchema.parse(parseCv(raw));
  const map: Record<string, string> = {};
  const names = namePatterns(cv.name);
  const scrub = (v: string) => redactContact(redactName(v, names, map), map).text;
  if (map["[NAME]"] !== undefined || names.length) map["[NAME]"] = cv.name.trim();
  if (!cv.name.trim()) delete map["[NAME]"];
  return { map, cv: { ...cv, name: "", phone: "", email: "", links: [], footer: "", headline: scrub(cv.headline), profileTitle: scrub(cv.profileTitle), profile: scrub(cv.profile),
    sections: cv.sections.map(s => ({ ...s, title: scrub(s.title), entries: s.entries.map(e => ({ ...e, heading: scrub(e.heading), sub: scrub(e.sub), text: scrub(e.text), bullets: e.bullets.map(scrub) })) })) } };
}
/** CV copy shared with AI: no name, contact details, links or footer; the CV's own name and inline contact text masked. */
export function privateCv(raw: unknown): CvContent {
  return redactCv(raw).cv;
}
/** Which contact details exist (booleans only), so AI never reports them as missing. */
export function contactPresence(raw: unknown) {
  const cv = cvSchema.parse(parseCv(raw));
  return { name: !!cv.name.trim(), phone: !!cv.phone.trim(), email: !!cv.email.trim(), links: cv.links.length > 0 };
}
export function editableFields(cv: CvContent): Record<string, string> {
  const fields: Record<string, string> = { headline: cv.headline, profile: cv.profile };
  cv.sections.forEach((s, si) =>
    s.entries.forEach((e, ei) => {
      fields[`sections.${si}.entries.${ei}.text`] = e.text;
      e.bullets.forEach((b, bi) => {
        fields[`sections.${si}.entries.${ei}.bullets.${bi}`] = b;
      });
    }),
  );
  return fields;
}
/** Review can change wording only; identity, dates and qualifications stay untouched. */
export function applySuggestion(
  cv: CvContent,
  path: string,
  original: string,
  replacement: string,
): CvContent {
  if (editableFields(cv)[path] !== original || !replacement.trim())
    throw new Error("Stale or invalid suggestion");
  const dates = original.match(/\b(?:19|20)\d{2}\b/g) ?? [];
  if (dates.some((d) => !replacement.includes(d))) throw new Error("Dates must be preserved");
  const copy = structuredClone(cv);
  if (path === "profile" || path === "headline") {
    copy[path] = replacement;
    return copy;
  }
  const m = /^sections\.(\d+)\.entries\.(\d+)\.(text|bullets)(?:\.(\d+))?$/.exec(path);
  if (!m) throw new Error("Invalid field");
  const e = copy.sections[Number(m[1])]?.entries[Number(m[2])];
  if (!e) throw new Error("Invalid entry");
  if (m[3] === "text") e.text = replacement;
  else e.bullets[Number(m[4])] = replacement;
  return copy;
}
export function completedAnswers(turns: AiTurn[]) {
  return turns.filter((t) => t.role === "user").length;
}
export function validateFile(name: string, size: number) {
  if (size <= 0 || size > AI_LIMITS.fileBytes) throw new Error("size");
  if (!/\.(pdf|docx)$/i.test(name)) throw new Error("format");
}
export function validateText(text: string) {
  if (!text.trim()) throw new Error("empty");
  if (text.length > AI_LIMITS.extractedChars) throw new Error("textLimit");
  return text.trim();
}
/** Inspect ZIP central-directory bounds before a DOCX library decompresses content. */
export function validateDocxZip(buffer: ArrayBuffer) {
  const v = new DataView(buffer);
  let end = -1;
  for (let i = buffer.byteLength - 22; i >= Math.max(0, buffer.byteLength - 65557); i--)
    if (v.getUint32(i, true) === 0x06054b50) {
      end = i;
      break;
    }
  if (end < 0 || v.getUint16(end + 4, true) !== 0 || v.getUint16(end + 6, true) !== 0)
    throw new Error("corrupt");
  const count = v.getUint16(end + 10, true);
  let pos = v.getUint32(end + 16, true);
  let total = 0;
  if (count > AI_LIMITS.zipEntries) throw new Error("zipLimit");
  for (let i = 0; i < count; i++) {
    if (pos + 46 > end || v.getUint32(pos, true) !== 0x02014b50) throw new Error("corrupt");
    if (v.getUint16(pos + 8, true) & 1) throw new Error("encrypted");
    const compressed = v.getUint32(pos + 20, true);
    const expanded = v.getUint32(pos + 24, true);
    total += expanded;
    if (total > AI_LIMITS.zipBytes || expanded > Math.max(1024 * 1024, compressed * 150))
      throw new Error("zipLimit");
    pos +=
      46 + v.getUint16(pos + 28, true) + v.getUint16(pos + 30, true) + v.getUint16(pos + 32, true);
  }
}
/** Language of the CV text itself (not the interface): Swedish when Swedish markers dominate. */
export function detectCvLanguage(text: string): "sv" | "en" {
  const sv = (text.match(/[åäö]|\b(och|med|för|inom|utbildning|erfarenhet|arbetade|utvecklade)\b/gi) ?? []).length;
  const en = (text.match(/\b(and|with|for|the|education|experience|worked|developed|built)\b/gi) ?? []).length;
  return sv > en ? "sv" : "en";
}
/** Put masked contact details back into the right fields by their own shape, not by AI placement. */
export function fillContact(cv: CvContent, map: Record<string, string>): CvContent {
  const values = Object.values(map);
  const email = values.find(v => v.includes("@"));
  const phone = values.find(v => !v.includes("@") && /^\+?[\d\s().-]+$/.test(v));
  const urls = values.filter(v => !v.includes("@") && !/^\+?[\d\s().-]+$/.test(v));
  const clean = (v: string) => (Object.values(map).includes(v) && v !== email && v !== phone) ? "" : v;
  return { ...cv, email: email ?? clean(cv.email), phone: phone ?? clean(cv.phone),
    links: urls.length ? urls.map(u => ({ label: cv.links.find(l => l.url === u)?.label ?? "", url: u })) : cv.links };
}
