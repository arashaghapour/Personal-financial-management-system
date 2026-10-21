import { requestWithAuth } from "../../auth/api/auth-client";

import {
  createBudget,
  deleteBudget,
  getBudget,
  getBudgetProgress,
  getBudgets,
  updateBudget,
} from "./budgets.api";

import type {
  Budget,
  BudgetFilters,
  BudgetProgress,
  CreateBudgetRequest,
  UpdateBudgetRequest,
} from "../types";

/**
 * Reusable authenticated budget queries and mutations.
 *
 * The access token is never handled by components: requestWithAuth attaches
 * the current token and performs a single refresh/retry when necessary.
 */

export const fetchBudgets = (
  filters: BudgetFilters = {},
): Promise<Budget[]> =>
  requestWithAuth((accessToken) => getBudgets(accessToken, filters));

export const fetchBudget = (id: string): Promise<Budget> =>
  requestWithAuth((accessToken) => getBudget(accessToken, id));

export const fetchBudgetProgress = (id: string): Promise<BudgetProgress> =>
  requestWithAuth((accessToken) => getBudgetProgress(accessToken, id));

export const createBudgetMutation = (
  data: CreateBudgetRequest,
): Promise<Budget> =>
  requestWithAuth((accessToken) => createBudget(accessToken, data));

export const updateBudgetMutation = (
  id: string,
  data: UpdateBudgetRequest,
): Promise<Budget> =>
  requestWithAuth((accessToken) => updateBudget(accessToken, id, data));

export const deleteBudgetMutation = (id: string): Promise<void> =>
  requestWithAuth((accessToken) => deleteBudget(accessToken, id));
