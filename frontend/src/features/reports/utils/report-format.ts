import { formatTransactionDate } from "../../transactions/utils/transaction-format";

import type { ReportDateFilters } from "../types";

const countFormatter = new Intl.NumberFormat("en-US");

/** Formats a backend-provided transaction count without inventing values. */
export const formatReportCount = (value: number): string =>
  Number.isFinite(value) ? countFormatter.format(value) : "—";

/** Human-readable description of the active report date range. */
export const formatReportDateRange = (
  filters: ReportDateFilters,
): string => {
  const { startDate, endDate } = filters;

  if (startDate && endDate) {
    return `Showing reports from ${formatTransactionDate(startDate)} to ${formatTransactionDate(endDate)}.`;
  }

  if (startDate) {
    return `Showing reports from ${formatTransactionDate(startDate)}.`;
  }

  if (endDate) {
    return `Showing reports through ${formatTransactionDate(endDate)}.`;
  }

  return "Showing all transactions.";
};
