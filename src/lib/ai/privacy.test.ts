import { describe, expect, it } from "vitest";
import { contactPresence, privateCv, redactContact, restoreContact } from "./contracts";
const base = { name: "Synthetic Person", headline: "Dev", phone: "070-123 45 67", email: "a@b.test", links: [{ label: "GitHub", url: "https://github.com/x" }], profileTitle: "", profile: "Mail me at a@b.test or 070-123 45 67", sections: [{ title: "Edu", entries: [{ heading: "School", sub: "2024–2026 · 400 YH", text: "", bullets: [] }] }], footer: "" };
describe("CV privacy before AI sharing", () => {
  it("masks inline e-mail and phone but keeps year ranges", () => {
    const cv = privateCv(base);
    expect(cv.profile).not.toContain("a@b.test");
    expect(cv.profile).not.toContain("070-123");
    expect(cv.sections[0]?.entries[0]?.sub).toBe("2024–2026 · 400 YH");
  });
  it("reports existing contact details as present", () => {
    expect(contactPresence(base)).toEqual({ name: true, phone: true, email: true, links: true });
  });
  it("restores masked import contact details locally", () => {
    const m = redactContact("Anna a@b.test https://github.com/anna");
    expect(m.text).not.toContain("a@b.test");
    expect(restoreContact({ email: "[CONTACT_1]", links: [{ url: "[CONTACT_2]" }] }, m.map)).toEqual({ email: "a@b.test", links: [{ url: "https://github.com/anna" }] });
  });
});
import { detectCvLanguage } from "./contracts";
it("detects CV language independently of the interface", () => {
  expect(detectCvLanguage("Built React components with the team and worked on education projects")).toBe("en");
  expect(detectCvLanguage("Utvecklade kassasystem och arbetade med utbildning inom frontend")).toBe("sv");
});
import { fillContact, cvSchema } from "./contracts";
it("places restored contact details in the correct fields even if AI swapped them", () => {
  const cv = cvSchema.parse({ name: "", headline: "", phone: "a@b.test", email: "+46 70 000 00 00", links: [], profileTitle: "", profile: "", sections: [], footer: "" });
  const out = fillContact(cv, { "[CONTACT_1]": "a@b.test", "[CONTACT_2]": "+46 70 000 00 00", "[CONTACT_3]": "https://github.com/x" });
  expect([out.email, out.phone, out.links[0]?.url]).toEqual(["a@b.test", "+46 70 000 00 00", "https://github.com/x"]);
});

import { redactCv as _redactCv, restoreContact as _restore, editableFields as _fields } from "./contracts";
describe("CV name redaction", () => {
  const raw = { name: "Testa Fiktivsson", headline: "Frontend developer", profile: "Testa Fiktivsson built React apps. Contact T. Fiktivsson or T.F. Signed Testa. 400 YH credits, 2024–2026.", sections: [{ title: "Experience", entries: [{ heading: "Fiktivsson Consulting", sub: "", text: "TESTA led TypeScript work", bullets: ["T Fiktivsson wrote tests"] }] }] };
  it("removes the name and its variants from the AI payload", () => {
    const payload = JSON.stringify(_redactCv(raw).cv);
    for (const v of ["Testa", "Fiktivsson", "T. Fiktivsson", "T.F.", "TESTA"]) expect(payload.toLowerCase()).not.toContain(v.toLowerCase());
  });
  it("keeps useful content for analysis", () => {
    const payload = JSON.stringify(_redactCv(raw).cv);
    for (const v of ["React", "TypeScript", "400 YH credits", "2024–2026", "Frontend developer"]) expect(payload).toContain(v);
  });
  it("restores the real name only in the browser map", () => {
    const { cv, map } = _redactCv(raw);
    expect(_restore(_fields(cv)["profile"], map)).toContain("Testa Fiktivsson built");
  });
  it("does not touch words merely containing the name", () => {
    expect(JSON.stringify(_redactCv({ ...raw, profile: "Testament to quality" }).cv)).toContain("Testament");
  });
});
