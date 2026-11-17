import { describe, expect, it } from "vitest";
import { TEMPLATE_KINDS, coverLetterFileName, fillTemplate, isHttpUrl, presetTemplates } from "./documents";

describe("presetTemplates", () => {
  it("provides all five kinds in both languages", () => {
    for (const lang of ["sv", "en"] as const) {
      const kinds = presetTemplates(lang).map((p) => p.kind);
      expect(kinds).toEqual([...TEMPLATE_KINDS]);
      for (const p of presetTemplates(lang)) {
        expect(p.title.trim().length).toBeGreaterThan(0);
        expect(p.body.trim().length).toBeGreaterThan(0);
      }
    }
  });
});

describe("coverLetterFileName", () => {
  it("joins name and company and strips unsafe characters", () => {
    expect(coverLetterFileName('Cover letter: "Effektify"', "Acme/AB")).toBe("Cover letter Effektify - AcmeAB");
  });
  it("falls back when everything is blank", () => {
    expect(coverLetterFileName("  ", null)).toBe("Cover letter");
  });
});

describe("isHttpUrl", () => {
  it("accepts empty and full http(s) URLs", () => {
    expect(isHttpUrl("")).toBe(true);
    expect(isHttpUrl("  ")).toBe(true);
    expect(isHttpUrl("https://linkedin.com/in/roza")).toBe(true);
  });
  it("rejects non-URLs", () => {
    expect(isHttpUrl("linkedin.com/in/roza")).toBe(false);
    expect(isHttpUrl("ftp://x.se")).toBe(false);
  });
});

describe("fillTemplate", () => {
  it("replaces placeholders and marks missing values", () => {
    expect(fillTemplate("Hi {name}, re {title} at {company}", { name: "Anna" })).toBe("Hi Anna, re … at …");
  });
});
