import { formatTransactionDate } from "../../transactions/utils/transaction-format";

import type { DashboardFilters } from "../types";

/** Converts a Decimal string returned by the API into a finite number. */
export const toDashboardAmount = (value: number | string): number => {
  const amount = typeof value === "number" ? value : Number(value);

  return Number.isFinite(amount) ? amount : 0;
};

/**
 * Calculates a category's share of the returned category totals. The
 * denominator is the sum of the categories the backend returned, never a
 * separately derived authoritative total.
 */
export const calculateCategoryShare = (
  value: number | string,
  total: number | string,
): number => {
  const amount = toDashboardAmount(value);
  const totalAmount = toDashboardAmount(total);

  if (totalAmount <= 0) {
    return 0;
  }

  return Math.min(100, Math.max(0, (amount / totalAmount) * 100));
};

export const formatCategoryShare = (value: number): string => {
  if (!Number.isFinite(value) || value <= 0) {
    return "0%";
  }

  if (value < 1) {
    return "<1%";
  }

  return `${Math.round(value)}%`;
};

/** Human-readable description of the active transaction date range. */
export const formatDashboardDateRange = (
  filters: DashboardFilters,
): string => {
  const { startDate, endDate } = filters;

  if (startDate && endDate) {
    return `Showing transactions from ${formatTransactionDate(startDate)} to ${formatTransactionDate(endDate)}.`;
  }

  if (startDate) {
    return `Showing transactions from ${formatTransactionDate(startDate)}.`;
  }

  if (endDate) {
    return `Showing transactions through ${formatTransactionDate(endDate)}.`;
  }

  return "Showing all transactions.";
};
