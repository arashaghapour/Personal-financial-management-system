import { describe, expect, it } from "vitest";

import { reportKeys } from "./reports.keys";

describe("report query keys", () => {
  it("keeps the unfiltered keys stable per report type", () => {
    expect(reportKeys.summary()).toEqual(["reports", "summary", {}]);
    expect(reportKeys.expenses()).toEqual(["reports", "expenses", {}]);
    expect(reportKeys.cashFlow()).toEqual(["reports", "cash-flow", {}]);
  });

  it("distinguishes report types", () => {
    const filters = { startDate: "2026-10-01" };

    expect(reportKeys.summary(filters)).not.toEqual(
      reportKeys.expenses(filters),
    );
    expect(reportKeys.expenses(filters)).not.toEqual(
      reportKeys.cashFlow(filters),
    );
  });

  it("includes the selected date and category filters", () => {
    expect(
      reportKeys.expenses({
        startDate: "2026-10-01",
        endDate: "2026-10-31",
        categoryId: "11111111-1111-4111-8111-111111111111",
      }),
    ).toEqual([
      "reports",
      "expenses",
      {
        startDate: "2026-10-01",
        endDate: "2026-10-31",
        categoryId: "11111111-1111-4111-8111-111111111111",
      },
    ]);
  });

  it("omits empty filter values so cleared filters share the unfiltered key", () => {
    expect(
      reportKeys.summary({
        startDate: "",
        endDate: "",
      }),
    ).toEqual(reportKeys.summary());

    expect(reportKeys.expenses({ categoryId: "" })).toEqual(
      reportKeys.expenses(),
    );
  });

  it("exposes a root key for centralized invalidation", () => {
    expect(reportKeys.all).toEqual(["reports"]);
  });
});
