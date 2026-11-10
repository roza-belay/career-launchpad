import { describe, expect, it } from "vitest";
import { daysUntil, findExistingApplication, matchesVacancy, vacancyToApplication, type Vacancy } from "./vacancies";

const v = (o: Partial<Vacancy>): Vacancy => ({ id: "1", user_id: "u", company: "Acme", title: "Developer", location: null, arrangement: "Hybrid", employment_type: "FULL_TIME", description: null, job_url: null, deadline: null, skills: [], saved_on: "2026-11-10", application_id: null, created_at: "", updated_at: "", ...o });

describe("vacancy filters", () => {
  it("junior + react combine with AND", () => {
    const a = v({ title: "Junior Frontend Developer", skills: ["React"] });
    expect(matchesVacancy(a, "", ["junior", "react"])).toBe(true);
    expect(matchesVacancy(v({ title: "Junior Developer", skills: ["Vue"] }), "", ["junior", "react"])).toBe(false);
  });
  it("Stockholm counts as Sweden", () => {
    expect(matchesVacancy(v({ location: "Stockholm" }), "", ["sweden"])).toBe(true);
    expect(matchesVacancy(v({ location: "Oslo" }), "", ["sweden"])).toBe(false);
  });
  it("Remote Europe needs remote arrangement and a European location", () => {
    expect(matchesVacancy(v({ arrangement: "Remote", location: "Remote, Europe" }), "", ["remoteEurope"])).toBe(true);
    expect(matchesVacancy(v({ arrangement: "Hybrid", location: "Europe" }), "", ["remoteEurope"])).toBe(false);
  });
  it("JavaScript does not match Java", () => {
    expect(matchesVacancy(v({ skills: ["Java"] }), "", ["javascript"])).toBe(false);
  });
  it("searches company and skills", () => {
    expect(matchesVacancy(v({ company: "Spotify" }), "spot", [])).toBe(true);
  });
});

describe("no duplicate applications", () => {
  const apps = [{ id: "a1", company: "Acme AB", title: "Frontend Developer", job_url: "https://www.linkedin.com/jobs/view/123/?ref=x" }];
  it("matches by job URL ignoring tracking params", () => {
    expect(findExistingApplication({ company: "X", title: "Y", job_url: "linkedin.com/jobs/view/123" }, apps)?.id).toBe("a1");
  });
  it("matches by company + title ignoring case", () => {
    expect(findExistingApplication({ company: "acme ab", title: "frontend developer", job_url: null }, apps)?.id).toBe("a1");
  });
  it("different job is not a duplicate", () => {
    expect(findExistingApplication({ company: "Acme AB", title: "Backend Developer", job_url: null }, apps)).toBeUndefined();
  });
});

it("transfers vacancy info as a Saved application", () => {
  const a = vacancyToApplication(v({ location: "Stockholm", job_url: "https://x.se", description: "Build UI", skills: ["React"] }), { deadline: "Deadline", type: "Full-time", skills: "Skills" });
  expect(a).toMatchObject({ company: "Acme", title: "Developer", location: "Stockholm", job_url: "https://x.se", status: "SAVED" });
  expect(a.notes).toContain("Skills: React");
});
it("days until deadline", () => expect(daysUntil("2026-11-15", "2026-11-10")).toBe(5));
