import type { BudgetFilters } from "../types";

/**
 * Stable query keys for budget lists, details, and progress. All filters are
 * part of the list key so results for different periods are never reused.
 */
export const budgetKeys = {
  all: ["budgets"] as const,
  lists: () => [...budgetKeys.all, "list"] as const,
  list: (filters: BudgetFilters = {}) =>
    [...budgetKeys.lists(), filters] as const,
  details: () => [...budgetKeys.all, "detail"] as const,
  detail: (id: string) => [...budgetKeys.details(), id] as const,
  progress: (id: string) => [...budgetKeys.all, "progress", id] as const,
};
