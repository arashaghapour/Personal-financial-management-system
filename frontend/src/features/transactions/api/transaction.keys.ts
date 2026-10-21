import type { TransactionFilters } from "../types";

/**
 * Stable query keys for transaction lists and details. Every filter and
 * pagination/sort value is part of the list key so results from unrelated
 * queries are never reused.
 */
export const transactionKeys = {
  all: ["transactions"] as const,
  lists: () => [...transactionKeys.all, "list"] as const,
  list: (filters: TransactionFilters) =>
    [...transactionKeys.lists(), filters] as const,
  details: () => [...transactionKeys.all, "detail"] as const,
  detail: (id: string) => [...transactionKeys.details(), id] as const,
};
