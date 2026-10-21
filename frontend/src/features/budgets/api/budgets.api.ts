import { apiRequest } from "../../../lib/api/client";

import type {
  Budget,
  BudgetFilters,
  BudgetProgress,
  CreateBudgetRequest,
  UpdateBudgetRequest,
} from "../types";

const buildBudgetQuery = (filters: BudgetFilters): string => {
  const params = new URLSearchParams();

  if (filters.year !== undefined) {
    params.set("year", String(filters.year));
  }

  if (filters.month !== undefined) {
    params.set("month", String(filters.month));
  }

  if (filters.categoryId !== undefined) {
    params.set("categoryId", filters.categoryId);
  }

  const query = params.toString();

  return query ? `?${query}` : "";
};

export const getBudgets = (
  accessToken: string,
  filters: BudgetFilters = {},
): Promise<Budget[]> =>
  apiRequest<Budget[]>(`/budgets${buildBudgetQuery(filters)}`, {
    accessToken,
  });

export const getBudget = (
  accessToken: string,
  id: string,
): Promise<Budget> =>
  apiRequest<Budget>(`/budgets/${id}`, { accessToken });

export const getBudgetProgress = (
  accessToken: string,
  id: string,
): Promise<BudgetProgress> =>
  apiRequest<BudgetProgress>(`/budgets/${id}/progress`, { accessToken });

export const createBudget = (
  accessToken: string,
  data: CreateBudgetRequest,
): Promise<Budget> =>
  apiRequest<Budget>("/budgets", {
    method: "POST",
    body: data,
    accessToken,
  });

export const updateBudget = (
  accessToken: string,
  id: string,
  data: UpdateBudgetRequest,
): Promise<Budget> =>
  apiRequest<Budget>(`/budgets/${id}`, {
    method: "PATCH",
    body: data,
    accessToken,
  });

export const deleteBudget = (
  accessToken: string,
  id: string,
): Promise<void> =>
  apiRequest<void>(`/budgets/${id}`, {
    method: "DELETE",
    accessToken,
  });
