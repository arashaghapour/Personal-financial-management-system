import { apiRequest } from "../../../lib/api/client";

import type {
  CashFlowReport,
  ExpenseReport,
  ExpenseReportFilters,
  ReportDateFilters,
  SummaryReport,
} from "../types";

/**
 * Reports API functions.
 *
 * Requests go through the shared API client so the configured base URL and
 * error envelope handling stay consistent. Authentication is attached by
 * ./reports.queries.ts through requestWithAuth.
 */

const appendQueryValue = (
  params: URLSearchParams,
  key: string,
  value: string | undefined,
): void => {
  if (value !== undefined && value !== "") {
    params.set(key, value);
  }
};

const buildDateQuery = (filters: ReportDateFilters = {}): string => {
  const params = new URLSearchParams();

  // Only the parameters supported by the report endpoints are ever sent.
  // In particular, userId is derived from the access token by the backend.
  appendQueryValue(params, "startDate", filters.startDate);
  appendQueryValue(params, "endDate", filters.endDate);

  const query = params.toString();

  return query ? `?${query}` : "";
};

export const buildSummaryReportQuery = (
  filters: ReportDateFilters = {},
): string => buildDateQuery(filters);

export const buildCashFlowReportQuery = (
  filters: ReportDateFilters = {},
): string => buildDateQuery(filters);

export const buildExpenseReportQuery = (
  filters: ExpenseReportFilters = {},
): string => {
  const params = new URLSearchParams();

  appendQueryValue(params, "startDate", filters.startDate);
  appendQueryValue(params, "endDate", filters.endDate);
  appendQueryValue(params, "categoryId", filters.categoryId);

  const query = params.toString();

  return query ? `?${query}` : "";
};

export const getSummaryReport = (
  accessToken: string,
  filters: ReportDateFilters = {},
): Promise<SummaryReport> =>
  apiRequest<SummaryReport>(
    `/reports/summary${buildSummaryReportQuery(filters)}`,
    { accessToken },
  );

export const getExpenseReport = (
  accessToken: string,
  filters: ExpenseReportFilters = {},
): Promise<ExpenseReport> =>
  apiRequest<ExpenseReport>(
    `/reports/expenses${buildExpenseReportQuery(filters)}`,
    { accessToken },
  );

export const getCashFlowReport = (
  accessToken: string,
  filters: ReportDateFilters = {},
): Promise<CashFlowReport> =>
  apiRequest<CashFlowReport>(
    `/reports/cash-flow${buildCashFlowReportQuery(filters)}`,
    { accessToken },
  );
