import type { Transaction } from "../transactions/types";

/**
 * Dashboard types mirroring the backend contract
 * (see docs/OpenAPI.yml and backend/src/modules/dashboard/dashboard.service.ts).
 *
 * `totalBalance` is the current combined balance across all accounts and is
 * independent of the date filters. The transaction-based values and recent
 * transactions respect the selected date range.
 */

export type DashboardCategorySummary = {
  categoryId: string;
  categoryName: string;
  /** Prisma Decimal serialized as a numeric string by the backend. */
  total: string;
};

export type Dashboard = {
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  expenseByCategory: DashboardCategorySummary[];
  incomeByCategory: DashboardCategorySummary[];
  /**
   * The dashboard endpoint returns the five most recent transactions matching
   * the date filters. This is a bare array, not the paginated transactions
   * list response. Ordering is defined by the backend (date descending, then
   * createdAt descending) and must be preserved by the UI.
   */
  recentTransactions: Transaction[];
};

/** Supported dashboard query parameters. `userId` is intentionally absent. */
export type DashboardFilters = {
  startDate?: string;
  endDate?: string;
};
