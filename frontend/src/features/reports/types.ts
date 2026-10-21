/**
 * Report types mirroring the backend contract
 * (see docs/OpenAPI.yml and backend/src/modules/reports/reports.types.ts).
 *
 * Monetary values are Prisma Decimals serialized as strings by the backend.
 * The frontend only formats them; it never recalculates report totals.
 */

export const REPORT_TYPES = ["summary", "expenses", "cash-flow"] as const;

export type ReportType = (typeof REPORT_TYPES)[number];

export type ReportDateFilters = {
  startDate?: string;
  endDate?: string;
};

export type ExpenseReportFilters = ReportDateFilters & {
  categoryId?: string;
};

export type SummaryReport = {
  totalIncome: string;
  totalExpenses: string;
  netCashFlow: string;
  transactionCount: number;
  incomeTransactionCount: number;
  expenseTransactionCount: number;
};

export type ExpenseCategorySummary = {
  categoryId: string;
  categoryName: string;
  /** Prisma Decimal serialized as a numeric string by the backend. */
  amount: string;
  transactionCount: number;
};

export type ExpenseReport = {
  totalExpenses: string;
  /** Ordered by the backend (amount descending) and preserved by the UI. */
  categories: ExpenseCategorySummary[];
};

export type CashFlowEntry = {
  date: string;
  income: string;
  expenses: string;
  netCashFlow: string;
};

export type CashFlowReport = {
  startDate: string;
  endDate: string;
  /** Ascending date order as returned by the backend. */
  data: CashFlowEntry[];
};
