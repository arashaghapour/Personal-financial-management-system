import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createTransactionMutation,
  deleteTransactionMutation,
  fetchTransaction,
  fetchTransactions,
  updateTransactionMutation,
} from "./transactions.queries";

import { tokenStorage } from "../../auth/token-storage";
import { jsonResponse, noContentResponse } from "../../../test/fetch-mock";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  tokenStorage.setTokens("access-token", "refresh-token");
});

afterEach(() => {
  vi.unstubAllGlobals();
  tokenStorage.clear();
});

describe("authenticated transaction queries", () => {
  it("attaches the stored access token and serializes every supported filter", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        data: [],
        pagination: { page: 2, limit: 10, total: 0, totalPages: 0 },
      }),
    );

    await fetchTransactions({
      type: "EXPENSE",
      accountId: 2,
      categoryId: "11111111-1111-4111-8111-111111111111",
      startDate: "2026-09-01",
      endDate: "2026-09-30",
      minAmount: 10.5,
      maxAmount: 250,
      page: 2,
      limit: 10,
      sort: "amount_asc",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/transactions?type=EXPENSE&accountId=2&categoryId=11111111-1111-4111-8111-111111111111&startDate=2026-09-01&endDate=2026-09-30&minAmount=10.5&maxAmount=250&page=2&limit=10&sort=amount_asc",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer access-token",
        }),
      }),
    );
  });

  it("omits empty filters instead of sending unsupported values", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      }),
    );

    await fetchTransactions();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/transactions",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("fetches, creates, updates, and deletes transactions without sending userId", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ id: "transaction-1" }))
      .mockResolvedValueOnce(jsonResponse({ id: "transaction-1" }))
      .mockResolvedValueOnce(jsonResponse({ id: "transaction-1" }))
      .mockResolvedValueOnce(noContentResponse());

    await fetchTransaction("transaction-1");
    await createTransactionMutation({
      type: "EXPENSE",
      amount: 25,
      description: "Lunch",
      date: "2026-09-20",
      accountId: 2,
      categoryId: "11111111-1111-4111-8111-111111111111",
    });
    await updateTransactionMutation("transaction-1", {
      amount: 30,
      description: null,
      date: "2026-09-21",
      accountId: 1,
      categoryId: "22222222-2222-4222-8222-222222222222",
    });
    await deleteTransactionMutation("transaction-1");

    expect(fetchMock.mock.calls.map((call) => call[0])).toEqual([
      "/api/transactions/transaction-1",
      "/api/transactions",
      "/api/transactions/transaction-1",
      "/api/transactions/transaction-1",
    ]);

    const createRequest = fetchMock.mock.calls[1][1];

    expect(createRequest.method).toBe("POST");
    expect(JSON.parse(createRequest.body)).toEqual({
      type: "EXPENSE",
      amount: 25,
      description: "Lunch",
      date: "2026-09-20",
      accountId: 2,
      categoryId: "11111111-1111-4111-8111-111111111111",
    });
    expect(JSON.parse(createRequest.body)).not.toHaveProperty("userId");

    const updateRequest = fetchMock.mock.calls[2][1];

    expect(updateRequest.method).toBe("PATCH");
    expect(JSON.parse(updateRequest.body)).toEqual({
      amount: 30,
      description: null,
      date: "2026-09-21",
      accountId: 1,
      categoryId: "22222222-2222-4222-8222-222222222222",
    });
    expect(JSON.parse(updateRequest.body)).not.toHaveProperty("type");
    expect(JSON.parse(updateRequest.body)).not.toHaveProperty("userId");

    const deleteRequest = fetchMock.mock.calls[3][1];

    expect(deleteRequest.method).toBe("DELETE");
    expect(deleteRequest.body).toBeUndefined();
  });
});
