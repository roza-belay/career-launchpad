import { describe, expect, it } from "vitest";
import { averageProgress, clampProgress, practiceProgress, progressByCategory, recentlyUpdated } from "./skills";

describe("skills", () => {
  it("clamps progress to 0–100", () => {
    expect(clampProgress(150)).toBe(100);
    expect(clampProgress(-5)).toBe(0);
    expect(clampProgress(NaN)).toBe(0);
  });
  it("averages progress", () => {
    expect(averageProgress([])).toBe(0);
    expect(averageProgress([{ progress: 50 }, { progress: 25 }])).toBe(38);
  });
  it("groups by category and skips empty ones", () => {
    const r = progressByCategory([{ category: "FRONTEND", progress: 40 }, { category: "FRONTEND", progress: 60 }, { category: "TOOLS", progress: 10 }]);
    expect(r).toEqual([{ category: "FRONTEND", count: 2, progress: 50 }, { category: "TOOLS", count: 1, progress: 10 }]);
  });
  it("lists only skills edited after creation, newest first", () => {
    const r = recentlyUpdated([
      { id: 1, created_at: "a", updated_at: "a" },
      { id: 2, created_at: "a", updated_at: "2026-01-02" },
      { id: 3, created_at: "a", updated_at: "2026-01-03" },
    ]);
    expect(r.map((s) => s.id)).toEqual([3, 2]);
  });
  it("practice progress counts confident answers", () => {
    expect(practiceProgress([{ status: "CONFIDENT" }, { status: "PRACTICING" }])).toBe(50);
  });
});
