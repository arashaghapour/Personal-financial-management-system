import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createBudgetMutation,
  deleteBudgetMutation,
  fetchBudget,
  fetchBudgetProgress,
  fetchBudgets,
  updateBudgetMutation,
} from "./budgets.queries";

import { tokenStorage } from "../../auth/token-storage";
import { jsonResponse, noContentResponse } from "../../../test/fetch-mock";

const fetchMock = vi.fn();

const CATEGORY_ID = "11111111-1111-4111-8111-111111111111";
const BUDGET_ID = "22222222-2222-4222-8222-222222222222";

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  tokenStorage.setTokens("access-token", "refresh-token");
});

afterEach(() => {
  vi.unstubAllGlobals();
  tokenStorage.clear();
});

describe("authenticated budget queries", () => {
  it("builds the list URL from only supported filters", async () => {
    fetchMock.mockResolvedValue(jsonResponse([]));

    await fetchBudgets({ year: 2026, month: 10, categoryId: CATEGORY_ID });

    expect(fetchMock).toHaveBeenCalledWith(
      `/api/budgets?year=2026&month=10&categoryId=${CATEGORY_ID}`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer access-token",
        }),
      }),
    );
  });

  it("omits empty budget filters from the list URL", async () => {
    fetchMock.mockResolvedValue(jsonResponse([]));

    await fetchBudgets();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/budgets",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("fetches a single budget and its progress", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ id: BUDGET_ID }))
      .mockResolvedValueOnce(
        jsonResponse({
          budgetId: BUDGET_ID,
          budgetAmount: 1000,
          spentAmount: 650,
          remainingAmount: 350,
          percentageUsed: 65,
          status: "UNDER_BUDGET",
        }),
      );

    await fetchBudget(BUDGET_ID);
    await fetchBudgetProgress(BUDGET_ID);

    expect(fetchMock.mock.calls.map((call) => call[0])).toEqual([
      `/api/budgets/${BUDGET_ID}`,
      `/api/budgets/${BUDGET_ID}/progress`,
    ]);
  });

  it("creates a budget with only backend-supported fields", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: BUDGET_ID }, 201));

    await createBudgetMutation({
      categoryId: CATEGORY_ID,
      amount: 1200,
      year: 2026,
      month: 10,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/budgets",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          categoryId: CATEGORY_ID,
          amount: 1200,
          year: 2026,
          month: 10,
        }),
      }),
    );
  });

  it("updates only the budget amount", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: BUDGET_ID }));

    await updateBudgetMutation(BUDGET_ID, { amount: 1500 });

    expect(fetchMock).toHaveBeenCalledWith(
      `/api/budgets/${BUDGET_ID}`,
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ amount: 1500 }),
      }),
    );
  });

  it("deletes a budget with a 204 response", async () => {
    fetchMock.mockResolvedValue(noContentResponse());

    await deleteBudgetMutation(BUDGET_ID);

    expect(fetchMock).toHaveBeenCalledWith(
      `/api/budgets/${BUDGET_ID}`,
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});
