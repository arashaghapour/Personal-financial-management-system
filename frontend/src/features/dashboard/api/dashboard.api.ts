import { apiRequest } from "../../../lib/api/client";

import type { Dashboard, DashboardFilters } from "../types";

/**
 * Dashboard API functions.
 *
 * Requests go through the shared API client so the configured base URL and
 * error envelope handling stay consistent. Authentication is attached by
 * ./dashboard.queries.ts through requestWithAuth.
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

export const buildDashboardQuery = (
  filters: DashboardFilters = {},
): string => {
  const params = new URLSearchParams();

  // Only the parameters supported by GET /api/dashboard are ever sent.
  // In particular, userId is derived from the access token by the backend.
  appendQueryValue(params, "startDate", filters.startDate);
  appendQueryValue(params, "endDate", filters.endDate);

  const query = params.toString();

  return query ? `?${query}` : "";
};

export const getDashboard = (
  accessToken: string,
  filters: DashboardFilters = {},
): Promise<Dashboard> =>
  apiRequest<Dashboard>(`/dashboard${buildDashboardQuery(filters)}`, {
    accessToken,
  });
