import { describe, expect, it } from "vitest";
import { computeFollowUp, followUpState } from "./followup";

describe("follow-up rules", () => {
  it("is due 7 days after last contact", () => {
    expect(computeFollowUp("2026-11-03")).toBe("2026-11-10");
    expect(computeFollowUp("2026-12-28")).toBe("2027-01-04");
  });
  it("flags overdue active applications", () => {
    expect(followUpState({ status: "APPLIED", next_follow_up: "2026-11-01" }, "2026-11-10")).toBe("overdue");
  });
  it("ignores closed or saved applications", () => {
    expect(followUpState({ status: "CLOSED", next_follow_up: "2026-11-01" }, "2026-11-10")).toBe("none");
    expect(followUpState({ status: "SAVED", next_follow_up: "2026-11-01" }, "2026-11-10")).toBe("none");
  });
});
