import { describe, expect, it } from "vitest";
import { CAREER_ROLES, matchesCareerRoles, toggleCareerRole } from "./career";
describe("career targets", () => {
  it("provides all 16 requested roles", () => { expect(CAREER_ROLES).toHaveLength(16); expect(CAREER_ROLES).toContain("juniorAi"); expect(CAREER_ROLES).toContain("support"); });
  it("allows multiple roles without duplicates", () => {
    const selected = toggleCareerRole(toggleCareerRole([], "frontend"), "backend");
    expect(selected).toEqual(["frontend", "backend"]);
    expect(toggleCareerRole(selected, "frontend")).toEqual(["backend"]);
  });
  it("combines selected roles with OR", () => { expect(matchesCareerRoles({ title: "Backend Developer" }, ["frontend", "backend"])).toBe(true); expect(matchesCareerRoles({ title: "Designer" }, ["frontend", "backend"])).toBe(false); });
  it("requires a junior marker for junior roles", () => { expect(matchesCareerRoles({ title: "Senior Full-Stack Developer" }, ["juniorFullstack"])).toBe(false); expect(matchesCareerRoles({ title: "Junior Full-Stack Developer" }, ["juniorFullstack"])).toBe(true); });
  it("matches English and Swedish role names", () => { expect(matchesCareerRoles({ title: "Junior mjukvaruutvecklare" }, ["juniorSoftware"])).toBe(true); expect(matchesCareerRoles({ title: "QA Automation Developer" }, ["qa"])).toBe(true); expect(matchesCareerRoles({ title: "Application Support Engineer" }, ["support"])).toBe(true); });
});