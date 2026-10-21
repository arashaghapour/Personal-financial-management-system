import type { ExpenseReportFilters, ReportDateFilters } from "../types";

/**
 * Stable query keys for report data. The report type and every relevant
 * filter are part of the key so different reports and filter combinations
 * never share cached results.
 */

const normalizeDateFilters = (
  filters: ReportDateFilters = {},
): ReportDateFilters => ({
  ...(filters.startDate ? { startDate: filters.startDate } : {}),
  ...(filters.endDate ? { endDate: filters.endDate } : {}),
});

const normalizeExpenseFilters = (
  filters: ExpenseReportFilters = {},
): ExpenseReportFilters => ({
  ...normalizeDateFilters(filters),
  ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
});

export const reportKeys = {
  all: ["reports"] as const,
  summary: (filters: ReportDateFilters = {}) =>
    [...reportKeys.all, "summary", normalizeDateFilters(filters)] as const,
  expenses: (filters: ExpenseReportFilters = {}) =>
    [...reportKeys.all, "expenses", normalizeExpenseFilters(filters)] as const,
  cashFlow: (filters: ReportDateFilters = {}) =>
    [...reportKeys.all, "cash-flow", normalizeDateFilters(filters)] as const,
};
