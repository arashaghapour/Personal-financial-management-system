import { Button } from "../../../components/ui/Button";

import {
  hasActiveDashboardDateRange,
  type DashboardDateRangeDraft,
  type DashboardDateRangeErrors,
} from "../utils/dashboard-filters";

type DashboardDateRangeFilterProps = {
  draft: DashboardDateRangeDraft;
  errors: DashboardDateRangeErrors;
  isRefreshing: boolean;
  onChange: (draft: DashboardDateRangeDraft) => void;
  onApply: () => void;
  onClear: () => void;
  onRefresh: () => void;
};

/**
 * Optional date-range controls for transaction-based dashboard data. The
 * balance card is independent of these controls and says so explicitly.
 */
export function DashboardDateRangeFilter({
  draft,
  errors,
  isRefreshing,
  onChange,
  onApply,
  onClear,
  onRefresh,
}: DashboardDateRangeFilterProps) {
  const hasActiveRange = hasActiveDashboardDateRange(draft);

  return (
    <section
      className="dashboard-filters"
      aria-labelledby="dashboard-filters-heading"
    >
      <div className="dashboard-filters-heading">
        <h2 id="dashboard-filters-heading">Filter by date</h2>
        <p className="dashboard-filters-description">
          Applies to income, expenses, categories, and recent transactions.
        </p>
      </div>

      <form
        className="dashboard-filters-form"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          onApply();
        }}
      >
        <div className="dashboard-filter-field">
          <label htmlFor="dashboard-start-date">Start date</label>
          <input
            id="dashboard-start-date"
            type="date"
            value={draft.startDate}
            aria-invalid={Boolean(errors.startDate)}
            aria-describedby={
              errors.startDate ? "dashboard-start-date-error" : undefined
            }
            onChange={(event) =>
              onChange({ ...draft, startDate: event.target.value })
            }
          />
          {errors.startDate ? (
            <p
              className="dashboard-filter-error"
              id="dashboard-start-date-error"
              role="alert"
            >
              {errors.startDate}
            </p>
          ) : null}
        </div>

        <div className="dashboard-filter-field">
          <label htmlFor="dashboard-end-date">End date</label>
          <input
            id="dashboard-end-date"
            type="date"
            value={draft.endDate}
            aria-invalid={Boolean(errors.endDate)}
            aria-describedby={
              errors.endDate ? "dashboard-end-date-error" : undefined
            }
            onChange={(event) =>
              onChange({ ...draft, endDate: event.target.value })
            }
          />
          {errors.endDate ? (
            <p
              className="dashboard-filter-error"
              id="dashboard-end-date-error"
              role="alert"
            >
              {errors.endDate}
            </p>
          ) : null}
        </div>

        <div className="dashboard-filter-actions">
          <Button type="submit">Apply dates</Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onClear}
            disabled={!hasActiveRange}
          >
            Clear dates
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            Refresh dashboard
          </Button>
        </div>
      </form>

      {isRefreshing ? (
        <p className="dashboard-filters-status" role="status">
          Refreshing dashboard...
        </p>
      ) : null}
    </section>
  );
}
