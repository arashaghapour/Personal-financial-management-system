import { describe, expect, it } from "vitest";

import {
  formatBudgetPercentage,
  formatBudgetPeriod,
  getBudgetStatusLabel,
  getBudgetStatusModifier,
} from "./budget-format";

describe("budget formatting", () => {
  it("formats whole and fractional percentages", () => {
    expect(formatBudgetPercentage(65)).toBe("65%");
    expect(formatBudgetPercentage(65.4)).toBe("65%");
    expect(formatBudgetPercentage(65.6)).toBe("66%");
    expect(formatBudgetPercentage(120)).toBe("120%");
  });

  it("labels backend budget statuses", () => {
    expect(getBudgetStatusLabel("UNDER_BUDGET")).toBe("Under budget");
    expect(getBudgetStatusLabel("NEAR_LIMIT")).toBe("Near limit");
    expect(getBudgetStatusLabel("OVER_BUDGET")).toBe("Over budget");
  });

  it("maps budget statuses to presentation modifiers", () => {
    expect(getBudgetStatusModifier("UNDER_BUDGET")).toBe("under");
    expect(getBudgetStatusModifier("NEAR_LIMIT")).toBe("near");
    expect(getBudgetStatusModifier("OVER_BUDGET")).toBe("over");
  });

  it("formats budget periods from year and month", () => {
    expect(formatBudgetPeriod(2026, 1)).toBe("January 2026");
    expect(formatBudgetPeriod(2026, 10)).toBe("October 2026");
    expect(formatBudgetPeriod(2026, 12)).toBe("December 2026");
  });
});
