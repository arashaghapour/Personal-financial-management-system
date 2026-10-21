import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { accountKeys } from "../../accounts/api/account.keys";
import { budgetKeys } from "../../budgets/api/budget.keys";
import { dashboardKeys } from "../../dashboard/api/dashboard.keys";

import {
  createTransactionMutation,
  deleteTransactionMutation,
  fetchTransaction,
  fetchTransactions,
  updateTransactionMutation,
} from "../api/transactions.queries";
import { transactionKeys } from "../api/transaction.keys";

import type {
  CreateTransactionRequest,
  TransactionFilters,
  UpdateTransactionRequest,
} from "../types";

/**
 * Cached transaction queries. TanStack Query owns fetching, retries, and
 * refetching, while `placeholderData` keeps the previous page visible during
 * filter and pagination changes to avoid layout jumps.
 */

export const useTransactionsQuery = (filters: TransactionFilters) =>
  useQuery({
    queryKey: transactionKeys.list(filters),
    queryFn: () => fetchTransactions(filters),
    placeholderData: keepPreviousData,
  });

export const useTransactionQuery = (id: string) =>
  useQuery({
    queryKey: transactionKeys.detail(id),
    queryFn: () => fetchTransaction(id),
  });

/**
 * Transaction mutations change account balances, budget spending, and the
 * dashboard aggregates on the backend. Invalidating every affected root keeps
 * those views fresh wherever they are displayed.
 */
const invalidateTransactionData = async (
  queryClient: ReturnType<typeof useQueryClient>,
): Promise<void> => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: transactionKeys.all }),
    queryClient.invalidateQueries({ queryKey: accountKeys.all }),
    queryClient.invalidateQueries({ queryKey: budgetKeys.all }),
    queryClient.invalidateQueries({ queryKey: dashboardKeys.all }),
  ]);
};

export const useCreateTransactionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTransactionRequest) =>
      createTransactionMutation(data),
    onSuccess: () => invalidateTransactionData(queryClient),
  });
};

export const useUpdateTransactionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateTransactionRequest;
    }) => updateTransactionMutation(id, data),
    onSuccess: () => invalidateTransactionData(queryClient),
  });
};

export const useDeleteTransactionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTransactionMutation(id),
    onSuccess: () => invalidateTransactionData(queryClient),
  });
};
