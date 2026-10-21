import type { DashboardFilters } from "../types";

/**
 * Stable query keys for dashboard data. The selected date range is part of
 * the key so unfiltered and filtered dashboards never share cached results.
 */
export const dashboardKeys = {
  all: ["dashboard"] as const,
  summary: (filters: DashboardFilters = {}) =>
    [
      ...dashboardKeys.all,
      "summary",
      {
        ...(filters.startDate ? { startDate: filters.startDate } : {}),
        ...(filters.endDate ? { endDate: filters.endDate } : {}),
      },
    ] as const,
};
