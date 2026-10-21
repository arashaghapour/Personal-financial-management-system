import { describe, expect, it } from "vitest";

import { dashboardKeys } from "./dashboard.keys";

describe("dashboard query keys", () => {
  it("keeps the unfiltered key stable", () => {
    expect(dashboardKeys.summary()).toEqual(["dashboard", "summary", {}]);
    expect(dashboardKeys.summary({})).toEqual(["dashboard", "summary", {}]);
  });

  it("includes the selected start date, end date, or both", () => {
    expect(dashboardKeys.summary({ startDate: "2026-10-01" })).toEqual([
      "dashboard",
      "summary",
      { startDate: "2026-10-01" },
    ]);

    expect(dashboardKeys.summary({ endDate: "2026-10-31" })).toEqual([
      "dashboard",
      "summary",
      { endDate: "2026-10-31" },
    ]);

    expect(
      dashboardKeys.summary({
        startDate: "2026-10-01",
        endDate: "2026-10-31",
      }),
    ).toEqual([
      "dashboard",
      "summary",
      { startDate: "2026-10-01", endDate: "2026-10-31" },
    ]);
  });

  it("exposes a root key for centralized invalidation", () => {
    expect(dashboardKeys.all).toEqual(["dashboard"]);
  });
});
