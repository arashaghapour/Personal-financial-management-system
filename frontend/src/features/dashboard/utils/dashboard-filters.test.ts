import { describe, expect, it } from "vitest";

import {
  emptyDashboardDateRange,
  getDashboardDateRangeErrors,
  hasActiveDashboardDateRange,
  toDashboardFilters,
} from "./dashboard-filters";

describe("dashboard date filters", () => {
  it("starts with an empty date range", () => {
    expect(emptyDashboardDateRange).toEqual({
      startDate: "",
      endDate: "",
    });
    expect(toDashboardFilters(emptyDashboardDateRange)).toEqual({});
    expect(hasActiveDashboardDateRange(emptyDashboardDateRange)).toBe(false);
  });

  it("includes only the dates the user selected", () => {
    expect(
      toDashboardFilters({ startDate: "2026-10-01", endDate: "" }),
    ).toEqual({ startDate: "2026-10-01" });

    expect(
      toDashboardFilters({ startDate: "", endDate: "2026-10-31" }),
    ).toEqual({ endDate: "2026-10-31" });

    expect(
      toDashboardFilters({
        startDate: "2026-10-01",
        endDate: "2026-10-31",
      }),
    ).toEqual({
      startDate: "2026-10-01",
      endDate: "2026-10-31",
    });
  });

  it("accepts a start date equal to the end date", () => {
    expect(
      getDashboardDateRangeErrors({
        startDate: "2026-10-01",
        endDate: "2026-10-01",
      }),
    ).toEqual({});
  });

  it("rejects a start date after the end date", () => {
    expect(
      getDashboardDateRangeErrors({
        startDate: "2026-10-31",
        endDate: "2026-10-01",
      }),
    ).toEqual({
      startDate: "Start date must be on or before the end date.",
    });
  });

  it("rejects malformed calendar dates", () => {
    expect(
      getDashboardDateRangeErrors({
        startDate: "2026-02-30",
        endDate: "",
      }),
    ).toEqual({
      startDate: "Enter a valid start date.",
    });

    expect(
      getDashboardDateRangeErrors({
        startDate: "",
        endDate: "2026/10/31",
      }),
    ).toEqual({
      endDate: "Enter a valid end date.",
    });
  });

  it("reports whether a date range is active", () => {
    expect(
      hasActiveDashboardDateRange({
        startDate: "2026-10-01",
        endDate: "",
      }),
    ).toBe(true);
    expect(
      hasActiveDashboardDateRange({
        startDate: "",
        endDate: "2026-10-31",
      }),
    ).toBe(true);
  });
});
