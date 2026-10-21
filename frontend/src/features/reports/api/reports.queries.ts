import { requestWithAuth } from "../../auth/api/auth-client";

import {
  getCashFlowReport,
  getExpenseReport,
  getSummaryReport,
} from "./reports.api";

import type {
  CashFlowReport,
  ExpenseReport,
  ExpenseReportFilters,
  ReportDateFilters,
  SummaryReport,
} from "../types";

/**
 * Reusable authenticated report queries.
 *
 * The access token is never handled by components: requestWithAuth attaches
 * the current token and performs a single refresh/retry when necessary.
 */

export const fetchSummaryReport = (
  filters: ReportDateFilters = {},
): Promise<SummaryReport> =>
  requestWithAuth((accessToken) => getSummaryReport(accessToken, filters));

export const fetchExpenseReport = (
  filters: ExpenseReportFilters = {},
): Promise<ExpenseReport> =>
  requestWithAuth((accessToken) => getExpenseReport(accessToken, filters));

export const fetchCashFlowReport = (
  filters: ReportDateFilters = {},
): Promise<CashFlowReport> =>
  requestWithAuth((accessToken) => getCashFlowReport(accessToken, filters));
