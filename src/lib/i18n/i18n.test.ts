import { describe, expect, it } from "vitest";
import { en, sv } from "./messages";
import { formatDate, parseLang, parseTheme, translate } from "./core";

describe("language & theme preferences", () => {
  it("Swedish covers every English key", () => {
    expect(Object.keys(sv).sort()).toEqual(Object.keys(en).sort());
  });
  it("only accepts sv/en and light/dark, defaulting to English and light", () => {
    expect(parseLang("sv")).toBe("sv");
    expect(parseLang("de")).toBe("en");
    expect(parseTheme("dark")).toBe("dark");
    expect(parseTheme(null)).toBe("light");
  });
  it("uses Swedish and English date formats", () => {
    expect(formatDate("2026-11-10", "en")).toBe("10 Nov 2026");
    expect(formatDate("2026-11-10", "sv")).toBe("10 nov. 2026");
    expect(formatDate(null, "sv")).toBe("—");
  });
  it("translates with variables", () => {
    expect(translate("apps.deleteMany", { n: 3 }, "sv")).toBe("Ta bort 3 ansökningar?");
  });
});
