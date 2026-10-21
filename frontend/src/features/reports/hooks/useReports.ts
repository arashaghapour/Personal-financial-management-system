import { useQuery } from "@tanstack/react-query";

import { reportKeys } from "../api/reports.keys";
import {
  fetchCashFlowReport,
  fetchExpenseReport,
  fetchSummaryReport,
} from "../api/reports.queries";

import type { ExpenseReportFilters, ReportDateFilters } from "../types";

/**
 * Cached report queries. The report type and filters are part of each query
 * key, so switching between reports or filter combinations never reuses
 * unrelated data.
 */

export const useSummaryReportQuery = (filters: ReportDateFilters) =>
  useQuery({
    queryKey: reportKeys.summary(filters),
    queryFn: () => fetchSummaryReport(filters),
  });

export const useExpenseReportQuery = (filters: ExpenseReportFilters) =>
  useQuery({
    queryKey: reportKeys.expenses(filters),
    queryFn: () => fetchExpenseReport(filters),
  });

export const useCashFlowReportQuery = (filters: ReportDateFilters) =>
  useQuery({
    queryKey: reportKeys.cashFlow(filters),
    queryFn: () => fetchCashFlowReport(filters),
  });
