import { describe, expect, it } from "vitest";
import { bulletsFromText, canDeleteCv, cvFileName, parseCv } from "./cv";

describe("cv helpers", () => {
  it("fills missing fields", () => {
    const c = parseCv({ name: "Roza", sections: [{ title: "Skills", entries: [{ bullets: ["React", 3] }] }] });
    expect(c.email).toBe("");
    expect(c.sections[0]!.entries[0]).toEqual({ heading: "", sub: "", text: "", bullets: ["React", ""] });
  });
  it("splits bullets per line", () => expect(bulletsFromText("a\n\n b \n")).toEqual(["a", "b"]));
  it("builds safe file names", () => expect(cvFileName("Roza Belay", "CV: Spotify/EN")).toBe("Roza Belay - CV SpotifyEN"));
  it("protects the main and international versions", () => {
    expect(canDeleteCv("main")).toBe(false);
    expect(canDeleteCv("international")).toBe(false);
    expect(canDeleteCv("tailored")).toBe(true);
  });
});
