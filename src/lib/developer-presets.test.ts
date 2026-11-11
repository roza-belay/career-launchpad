import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const sql = readFileSync("drizzle/migrations/0006_career_profile_and_expanded_development_presets.sql", "utf8");
describe("developer preset safeguards", () => {
  it("adds all 24 requested skills with zero progress and no selected level", () => {
    const skills = sql.split("INSERT INTO public.skills")[1]?.split("INSERT INTO public.interview_questions")[0] ?? "";
    expect(skills.match(/\('[^']+','(?:BACKEND|API|AI|TESTING|CLOUD|MOBILE)'\)/g)).toHaveLength(24);
    expect(skills).toContain("SELECT _uid,s.name,s.cat,false,0,NULL");
  });
  it("never updates existing skill progress or question answers during expansion", () => {
    expect(sql).not.toMatch(/\bUPDATE\s+public\.(skills|interview_questions)\b/i);
    expect(sql).toContain("lower(trim(k.name))=lower(s.name)");
    expect(sql).toContain("i.user_id=_uid AND i.preset_key=q.k");
  });
});