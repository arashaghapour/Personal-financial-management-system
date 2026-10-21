import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildDashboardQuery, getDashboard } from "./dashboard.api";

import { jsonResponse } from "../../../test/fetch-mock";

import type { DashboardFilters } from "../types";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("dashboard api", () => {
  it("requests /dashboard with the bearer token and no query when unfiltered", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        totalBalance: 0,
        totalIncome: 0,
        totalExpenses: 0,
        netCashFlow: 0,
        expenseByCategory: [],
        incomeByCategory: [],
        recentTransactions: [],
      }),
    );

    await getDashboard("access-token");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/dashboard",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer access-token",
        }),
      }),
    );
  });

  it("includes only the supported date query parameters", () => {
    expect(buildDashboardQuery()).toBe("");
    expect(buildDashboardQuery({ startDate: "2026-10-01" })).toBe(
      "?startDate=2026-10-01",
    );
    expect(buildDashboardQuery({ endDate: "2026-10-31" })).toBe(
      "?endDate=2026-10-31",
    );
    expect(
      buildDashboardQuery({
        startDate: "2026-10-01",
        endDate: "2026-10-31",
      }),
    ).toBe("?startDate=2026-10-01&endDate=2026-10-31");
  });

  it("never sends userId even when it is present on the filter object", () => {
    const filters = {
      startDate: "2026-10-01",
      endDate: "2026-10-31",
      userId: 42,
    } as DashboardFilters & { userId: number };

    const query = buildDashboardQuery(filters);

    expect(query).not.toContain("userId");
    expect(query).not.toContain("42");
  });

  it("requests the dashboard with the selected date range", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ totalBalance: 0 }));

    await getDashboard("access-token", {
      startDate: "2026-10-01",
      endDate: "2026-10-31",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/dashboard?startDate=2026-10-01&endDate=2026-10-31",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer access-token",
        }),
      }),
    );
  });
});
