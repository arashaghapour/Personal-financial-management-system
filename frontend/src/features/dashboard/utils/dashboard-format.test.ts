import { describe, expect, it } from "vitest";

import {
  calculateCategoryShare,
  formatCategoryShare,
  toDashboardAmount,
} from "./dashboard-format";

describe("dashboard formatting", () => {
  it("normalizes decimal strings and falls back safely", () => {
    expect(toDashboardAmount("125.50")).toBe(125.5);
    expect(toDashboardAmount(42)).toBe(42);
    expect(toDashboardAmount("not-a-number")).toBe(0);
  });

  it("calculates category shares from returned totals", () => {
    expect(calculateCategoryShare(25, 100)).toBe(25);
    expect(calculateCategoryShare("0.01", 100)).toBeCloseTo(0.01);
    expect(calculateCategoryShare(120, 100)).toBe(100);
  });

  it("returns zero when the denominator is not usable", () => {
    expect(calculateCategoryShare(10, 0)).toBe(0);
    expect(calculateCategoryShare(10, "invalid")).toBe(0);
  });

  it("formats very small shares readably", () => {
    expect(formatCategoryShare(0)).toBe("0%");
    expect(formatCategoryShare(0.01)).toBe("<1%");
    expect(formatCategoryShare(25)).toBe("25%");
    expect(formatCategoryShare(100)).toBe("100%");
  });
});
