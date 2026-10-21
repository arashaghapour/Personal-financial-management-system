import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { fetchDashboard } from "../api/dashboard.queries";
import { dashboardKeys } from "../api/dashboard.keys";

import type { DashboardFilters } from "../types";

/**
 * Cached dashboard query. The date range is part of the query key so changing
 * either date fetches the matching dashboard. `placeholderData` keeps the
 * previous dashboard visible while a new range loads to avoid layout jumps.
 */
export const useDashboardQuery = (filters: DashboardFilters) =>
  useQuery({
    queryKey: dashboardKeys.summary(filters),
    queryFn: () => fetchDashboard(filters),
    placeholderData: keepPreviousData,
  });
