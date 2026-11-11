import { describe, expect, it } from "vitest";
import { growthProgress, nextSteps } from "./growth";

describe("growth", () => {
  it("progress counts DONE share", () => {
    expect(growthProgress([])).toBe(0);
    expect(growthProgress([{ status: "DONE" }, { status: "TODO" }, { status: "DOING" }, { status: "DONE" }])).toBe(50);
  });
  it("suggests empty hubs and overdue open items", () => {
    const items = ["ROADMAP", "CHANGE", "STRENGTHS", "LINKEDIN", "SALARY"].map((hub) => ({ hub, status: "DONE", target_date: null as string | null }));
    items.push({ hub: "SALARY", status: "TODO", target_date: "2026-01-01" });
    expect(nextSteps(items, "2026-06-01")).toEqual([{ kind: "start", hub: "BUSINESS" }, { kind: "overdue", hub: "SALARY" }]);
    items.push({ hub: "BUSINESS", status: "DONE", target_date: "2026-01-01" });
    expect(nextSteps(items, "2026-06-01")).toEqual([{ kind: "overdue", hub: "SALARY" }]);
  });
});
