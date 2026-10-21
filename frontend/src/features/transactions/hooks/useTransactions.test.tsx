import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  useCreateTransactionMutation,
  useDeleteTransactionMutation,
  useUpdateTransactionMutation,
} from "./useTransactions";

import { accountKeys } from "../../accounts/api/account.keys";
import { budgetKeys } from "../../budgets/api/budget.keys";
import { dashboardKeys } from "../../dashboard/api/dashboard.keys";
import { deleteTransactionMutation } from "../api/transactions.queries";
import { transactionKeys } from "../api/transaction.keys";

import type { ReactNode } from "react";

vi.mock("../api/transactions.queries", () => ({
  fetchTransactions: vi.fn(),
  fetchTransaction: vi.fn(),
  createTransactionMutation: vi.fn().mockResolvedValue({ id: "tx-1" }),
  updateTransactionMutation: vi.fn().mockResolvedValue({ id: "tx-1" }),
  deleteTransactionMutation: vi.fn().mockResolvedValue(undefined),
}));

const makeClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const makeWrapper = (queryClient: QueryClient) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return Wrapper;
};

describe("transaction budget invalidation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("invalidates transaction, account, and budget caches after create", async () => {
    const queryClient = makeClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useCreateTransactionMutation(), {
      wrapper: makeWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({
        type: "EXPENSE",
        amount: 10,
        date: "2026-10-01",
        accountId: 1,
        categoryId: "11111111-1111-4111-8111-111111111111",
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidate).toHaveBeenCalledWith({
      queryKey: transactionKeys.all,
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: accountKeys.all });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: budgetKeys.all });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: dashboardKeys.all });
  });

  it("invalidates budget and dashboard caches after update and delete", async () => {
    const queryClient = makeClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const wrapper = makeWrapper(queryClient);

    const update = renderHook(() => useUpdateTransactionMutation(), {
      wrapper,
    });

    act(() => {
      update.result.current.mutate({ id: "tx-1", data: { amount: 20 } });
    });

    await waitFor(() => expect(update.result.current.isSuccess).toBe(true));

    const remove = renderHook(() => useDeleteTransactionMutation(), {
      wrapper,
    });

    act(() => {
      remove.result.current.mutate("tx-1");
    });

    await waitFor(() => expect(remove.result.current.isSuccess).toBe(true));

    const budgetInvalidations = invalidate.mock.calls.filter(
      ([options]) => options?.queryKey === budgetKeys.all,
    );
    const dashboardInvalidations = invalidate.mock.calls.filter(
      ([options]) => options?.queryKey === dashboardKeys.all,
    );

    expect(budgetInvalidations).toHaveLength(2);
    expect(dashboardInvalidations).toHaveLength(2);
  });

  it("does not invalidate dashboard caches when a transaction mutation fails", async () => {
    const queryClient = makeClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    vi.mocked(deleteTransactionMutation).mockRejectedValueOnce(
      new Error("delete failed"),
    );

    const { result } = renderHook(() => useDeleteTransactionMutation(), {
      wrapper: makeWrapper(queryClient),
    });

    await act(async () => {
      await expect(result.current.mutateAsync("tx-1")).rejects.toThrow(
        "delete failed",
      );
    });

    expect(invalidate).not.toHaveBeenCalledWith({
      queryKey: dashboardKeys.all,
    });
  });
});
