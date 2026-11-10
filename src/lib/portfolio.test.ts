import { describe, expect, it } from "vitest";
import { checklistProgress, listFromText, normalizeUrl, projectChecklist } from "./portfolio";

const base = { short_description: "", description: "", technologies: [] as string[], screenshots: [] as string[], github_url: null, demo_url: null, docs_url: null, checklist: {} };

describe("portfolio checklist", () => {
  it("has the 8 recruiter-ready items and starts at 0%", () => {
    const items = projectChecklist(base);
    expect(items).toHaveLength(8);
    expect(checklistProgress(items)).toEqual({ done: 0, total: 8, percent: 0 });
  });
  it("description needs both short and detailed text", () => {
    expect(projectChecklist({ ...base, short_description: "x" })[0]!.done).toBe(false);
    expect(projectChecklist({ ...base, short_description: "x", description: "y" })[0]!.done).toBe(true);
  });
  it("GitHub verified only counts when a GitHub link exists", () => {
    const noLink = projectChecklist({ ...base, checklist: { githubVerified: true } }).find((i) => i.key === "githubVerified")!;
    expect(noLink.done).toBe(false);
    const withLink = projectChecklist({ ...base, github_url: "https://github.com/a/b", checklist: { githubVerified: true } }).find((i) => i.key === "githubVerified")!;
    expect(withLink.done).toBe(true);
  });
  it("counts progress", () => {
    const items = projectChecklist({ ...base, technologies: ["React"], docs_url: "https://x.se", checklist: { tested: true, ready: true } });
    expect(checklistProgress(items)).toEqual({ done: 4, total: 8, percent: 50 });
  });
});

describe("helpers", () => {
  it("normalizes urls", () => {
    expect(normalizeUrl("github.com/roza")).toBe("https://github.com/roza");
    expect(normalizeUrl("javascript:alert(1)")).toBeNull();
    expect(normalizeUrl("  ")).toBeNull();
  });
  it("splits lists", () => {
    expect(listFromText("React, TypeScript,React\n Vite")).toEqual(["React", "TypeScript", "Vite"]);
  });
});
