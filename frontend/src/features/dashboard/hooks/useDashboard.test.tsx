import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchDashboard } from "../api/dashboard.queries";
import { dashboardKeys } from "../api/dashboard.keys";

import { useDashboardQuery } from "./useDashboard";

import type { Dashboard } from "../types";
import type { ReactNode } from "react";

vi.mock("../api/dashboard.queries", () => ({
  fetchDashboard: vi.fn(),
}));

const dashboard: Dashboard = {
  totalBalance: 1000,
  totalIncome: 400,
  totalExpenses: 150,
  netCashFlow: 250,
  expenseByCategory: [],
  incomeByCategory: [],
  recentTransactions: [],
};

const makeClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
    },
  });

const makeWrapper = (queryClient: QueryClient) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return Wrapper;
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(fetchDashboard).mockResolvedValue(dashboard);
});

describe("useDashboardQuery", () => {
  it("uses the selected date range in the request and query key", async () => {
    const queryClient = makeClient();
    const filters = {
      startDate: "2026-10-01",
      endDate: "2026-10-31",
    };

    const { result } = renderHook(() => useDashboardQuery(filters), {
      wrapper: makeWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchDashboard).toHaveBeenCalledWith(filters);
    expect(
      queryClient.getQueryData(dashboardKeys.summary(filters)),
    ).toEqual(dashboard);
  });

  it("keeps unfiltered and filtered dashboard data in separate cache entries", async () => {
    const queryClient = makeClient();
    const wrapper = makeWrapper(queryClient);

    const unfiltered = renderHook(() => useDashboardQuery({}), { wrapper });

    await waitFor(() => expect(unfiltered.result.current.isSuccess).toBe(true));

    const filtered = renderHook(
      () => useDashboardQuery({ startDate: "2026-10-01" }),
      { wrapper },
    );

    await waitFor(() => expect(filtered.result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryData(dashboardKeys.summary({}))).toEqual(
      dashboard,
    );
    expect(
      queryClient.getQueryData(
        dashboardKeys.summary({ startDate: "2026-10-01" }),
      ),
    ).toEqual(dashboard);
    expect(dashboardKeys.summary({})).not.toEqual(
      dashboardKeys.summary({ startDate: "2026-10-01" }),
    );
  });
});
