import { requestWithAuth } from "../../auth/api/auth-client";

import { getDashboard } from "./dashboard.api";

import type { Dashboard, DashboardFilters } from "../types";

/**
 * Reusable authenticated dashboard query.
 *
 * The access token is never handled by components: requestWithAuth attaches
 * the current token and performs a single refresh/retry when necessary.
 */
export const fetchDashboard = (
  filters: DashboardFilters = {},
): Promise<Dashboard> =>
  requestWithAuth((accessToken) => getDashboard(accessToken, filters));
