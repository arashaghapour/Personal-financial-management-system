import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildCashFlowReportQuery,
  buildExpenseReportQuery,
  buildSummaryReportQuery,
  getCashFlowReport,
  getExpenseReport,
  getSummaryReport,
} from "./reports.api";

import { jsonResponse } from "../../../test/fetch-mock";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("reports api", () => {
  it("requests the summary report with the bearer token and no query when unfiltered", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        totalIncome: "0",
        totalExpenses: "0",
        netCashFlow: "0",
        transactionCount: 0,
        incomeTransactionCount: 0,
        expenseTransactionCount: 0,
      }),
    );

    await getSummaryReport("access-token");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/reports/summary",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer access-token",
        }),
      }),
    );
  });

  it("builds only the supported date parameters and omits empty values", () => {
    expect(buildSummaryReportQuery()).toBe("");
    expect(buildSummaryReportQuery({ startDate: "" })).toBe("");
    expect(buildSummaryReportQuery({ endDate: "" })).toBe("");
    expect(buildSummaryReportQuery({ startDate: "2026-10-01" })).toBe(
      "?startDate=2026-10-01",
    );
    expect(buildSummaryReportQuery({ endDate: "2026-10-31" })).toBe(
      "?endDate=2026-10-31",
    );
    expect(
      buildSummaryReportQuery({
        startDate: "2026-10-01",
        endDate: "2026-10-31",
      }),
    ).toBe("?startDate=2026-10-01&endDate=2026-10-31");
  });

  it("adds the category filter only for the expense report", () => {
    const categoryId = "11111111-1111-4111-8111-111111111111";

    expect(
      buildExpenseReportQuery({
        startDate: "2026-10-01",
        endDate: "2026-10-31",
        categoryId,
      }),
    ).toBe(
      `?startDate=2026-10-01&endDate=2026-10-31&categoryId=${categoryId}`,
    );

    expect(buildExpenseReportQuery({ categoryId })).toBe(
      `?categoryId=${categoryId}`,
    );

    expect(buildCashFlowReportQuery({ categoryId } as never)).toBe("");
  });

  it("never sends userId even when it is present on the filter object", () => {
    const filters = {
      startDate: "2026-10-01",
      endDate: "2026-10-31",
      userId: 42,
    };

    const query = buildSummaryReportQuery(filters);

    expect(query).not.toContain("userId");
    expect(query).not.toContain("42");
  });

  it("requests each report endpoint with the selected filters", async () => {
    fetchMock.mockImplementation(async () => jsonResponse({}));

    await getSummaryReport("access-token", {
      startDate: "2026-10-01",
      endDate: "2026-10-31",
    });
    await getExpenseReport("access-token", {
      startDate: "2026-10-01",
      categoryId: "11111111-1111-4111-8111-111111111111",
    });
    await getCashFlowReport("access-token", {
      endDate: "2026-10-31",
    });

    expect(fetchMock.mock.calls.map((call) => call[0])).toEqual([
      "/api/reports/summary?startDate=2026-10-01&endDate=2026-10-31",
      "/api/reports/expenses?startDate=2026-10-01&categoryId=11111111-1111-4111-8111-111111111111",
      "/api/reports/cash-flow?endDate=2026-10-31",
    ]);
  });
});
