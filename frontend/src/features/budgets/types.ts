/**
 * Budget types mirroring the backend contract
 * (see docs/OpenAPI.yml and backend/src/modules/budget/budget.validation.ts).
 */

export const BUDGET_STATUSES = [
  "UNDER_BUDGET",
  "NEAR_LIMIT",
  "OVER_BUDGET",
] as const;

export type BudgetStatus = (typeof BUDGET_STATUSES)[number];

/** Budget returned by the backend. `amount` is a serialized decimal string. */
export type Budget = {
  id: string;
  userId: number;
  categoryId: string;
  amount: string;
  year: number;
  month: number;
  startDate: string;
  createdAt: string;
  updatedAt: string;
};

/** Backend-calculated progress for a single budget. */
export type BudgetProgress = {
  budgetId: string;
  budgetAmount: number;
  spentAmount: number;
  remainingAmount: number;
  percentageUsed: number;
  status: BudgetStatus;
};

/**
 * Supported list filters. `userId` is deliberately absent: the backend derives
 * it from the access token and rejects unknown query parameters.
 */
export type BudgetFilters = {
  year?: number;
  month?: number;
  categoryId?: string;
};

/** POST /api/budgets request body. */
export type CreateBudgetRequest = {
  categoryId: string;
  amount: number;
  year: number;
  month: number;
};

/** PATCH /api/budgets/:id request body. Only the amount is editable. */
export type UpdateBudgetRequest = {
  amount: number;
};
