import { describe, expect, it } from "vitest";
import { normalizeDailySessionGoal } from "./dailyGoal";

describe("normalizeDailySessionGoal", () => {
  it("uses the default for invalid values", () => {
    expect(normalizeDailySessionGoal(Number.NaN)).toBe(10);
    expect(normalizeDailySessionGoal("not-a-number")).toBe(10);
  });

  it("clamps daily session goals to the supported range", () => {
    expect(normalizeDailySessionGoal(0)).toBe(1);
    expect(normalizeDailySessionGoal(12.8)).toBe(12);
    expect(normalizeDailySessionGoal(99)).toBe(50);
  });
});
