import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "../components/ui/Button";
import { ErrorState } from "../components/ui/ErrorState";
import { PageContainer } from "../components/ui/PageContainer";

import { accountKeys } from "../features/accounts/api/account.keys";
import { fetchAccounts } from "../features/accounts/api/accounts.queries";
import { categoryKeys } from "../features/categories/api/category.keys";
import { fetchCategories } from "../features/categories/api/categories.queries";

import { getDashboardErrorMessage } from "../features/dashboard/api/error-messages";
import { DashboardCategoryBreakdown } from "../features/dashboard/components/DashboardCategoryBreakdown";
import { DashboardDateRangeFilter } from "../features/dashboard/components/DashboardDateRangeFilter";
import { DashboardRecentTransactions } from "../features/dashboard/components/DashboardRecentTransactions";
import { DashboardSkeleton } from "../features/dashboard/components/DashboardSkeleton";
import { DashboardSummaryCards } from "../features/dashboard/components/DashboardSummaryCards";
import { useDashboardQuery } from "../features/dashboard/hooks/useDashboard";
import {
  emptyDashboardDateRange,
  getDashboardDateRangeErrors,
  toDashboardFilters,
  type DashboardDateRangeDraft,
} from "../features/dashboard/utils/dashboard-filters";
import { formatDashboardDateRange } from "../features/dashboard/utils/dashboard-format";

import { useAuth } from "../features/auth/auth-context";

import type { DashboardFilters } from "../features/dashboard/types";

import "../styles/dashboard.css";

export default function DashboardPage() {
  const { user } = useAuth();
  const [draftRange, setDraftRange] = useState<DashboardDateRangeDraft>(
    emptyDashboardDateRange,
  );
  const [appliedFilters, setAppliedFilters] = useState<DashboardFilters>({});

  const dashboardQuery = useDashboardQuery(appliedFilters);
  const accountsQuery = useQuery({
    queryKey: accountKeys.list(),
    queryFn: fetchAccounts,
  });
  const categoriesQuery = useQuery({
    queryKey: categoryKeys.list(),
    queryFn: () => fetchCategories(),
  });

  const rangeErrors = getDashboardDateRangeErrors(draftRange);
  const hasAppliedRange = Boolean(
    appliedFilters.startDate || appliedFilters.endDate,
  );
  const isRefreshing =
    dashboardQuery.isFetching && dashboardQuery.data !== undefined;

  /**
   * Date changes apply immediately once the range is valid. Invalid drafts stay
   * local so the backend is never called with a start date after the end date.
   */
  const handleRangeChange = (next: DashboardDateRangeDraft) => {
    setDraftRange(next);

    if (Object.keys(getDashboardDateRangeErrors(next)).length === 0) {
      setAppliedFilters(toDashboardFilters(next));
    }
  };

  const handleApply = () => {
    if (Object.keys(getDashboardDateRangeErrors(draftRange)).length === 0) {
      setAppliedFilters(toDashboardFilters(draftRange));
    }
  };

  const handleClear = () => {
    setDraftRange(emptyDashboardDateRange);
    setAppliedFilters({});
  };

  const handleRefresh = () => {
    void dashboardQuery.refetch();
  };

  const dashboard = dashboardQuery.data;
  const accounts = Array.isArray(accountsQuery.data) ? accountsQuery.data : [];
  const categories = Array.isArray(categoriesQuery.data)
    ? categoriesQuery.data
    : [];

  return (
    <PageContainer className="dashboard-page">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        {user ? (
          <p className="page-description">
            Welcome back, {user.firstName} {user.lastName}.
          </p>
        ) : null}
      </div>

      <DashboardDateRangeFilter
        draft={draftRange}
        errors={rangeErrors}
        isRefreshing={isRefreshing}
        onChange={handleRangeChange}
        onApply={handleApply}
        onClear={handleClear}
        onRefresh={handleRefresh}
      />

      {hasAppliedRange ? (
        <p className="dashboard-range-summary">
          {formatDashboardDateRange(appliedFilters)}
        </p>
      ) : null}

      {dashboardQuery.isPending ? (
        <DashboardSkeleton />
      ) : dashboardQuery.isError && !dashboard ? (
        <ErrorState
          title="Unable to load dashboard"
          message={getDashboardErrorMessage(dashboardQuery.error)}
          action={
            <Button onClick={handleRefresh} type="button">
              Try again
            </Button>
          }
        />
      ) : dashboard ? (
        <div className="dashboard-content">
          {dashboardQuery.isError ? (
            <p className="dashboard-refresh-error" role="alert">
              Unable to refresh the dashboard. Showing the last loaded data.
            </p>
          ) : null}

          <DashboardSummaryCards summary={dashboard} />

          <div className="dashboard-panels">
            <DashboardCategoryBreakdown
              title="Income by category"
              headingId="dashboard-income-category-heading"
              categories={dashboard.incomeByCategory}
              emptyMessage="No income recorded for this period."
            />
            <DashboardCategoryBreakdown
              title="Expenses by category"
              headingId="dashboard-expense-category-heading"
              categories={dashboard.expenseByCategory}
              emptyMessage="No expenses recorded for this period."
            />
          </div>

          <DashboardRecentTransactions
            transactions={dashboard.recentTransactions}
            accounts={accounts}
            categories={categories}
          />
        </div>
      ) : null}
    </PageContainer>
  );
}
