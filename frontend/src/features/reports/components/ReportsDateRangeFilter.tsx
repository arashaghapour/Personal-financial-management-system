import { Button } from "../../../components/ui/Button";

import {
  hasActiveReportDateRange,
  type ReportDateRangeDraft,
  type ReportDateRangeErrors,
} from "../utils/report-filters";

type ReportsDateRangeFilterProps = {
  draft: ReportDateRangeDraft;
  errors: ReportDateRangeErrors;
  onChange: (draft: ReportDateRangeDraft) => void;
  onApply: () => void;
  onClear: () => void;
};

/**
 * Shared optional date-range controls for all report types. Changes apply
 * immediately once the range is valid; invalid drafts stay local so the
 * backend is never called with a start date after the end date.
 */
export function ReportsDateRangeFilter({
  draft,
  errors,
  onChange,
  onApply,
  onClear,
}: ReportsDateRangeFilterProps) {
  const hasActiveRange = hasActiveReportDateRange(draft);

  return (
    <section
      className="report-filters"
      aria-labelledby="report-filters-heading"
    >
      <div className="report-filters-heading">
        <h2 id="report-filters-heading">Filter by date</h2>
        <p className="report-filters-description">
          Applies to the selected report. Leave both dates empty to include all
          transactions.
        </p>
      </div>

      <form
        className="report-filters-form"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          onApply();
        }}
      >
        <div className="report-filter-field">
          <label htmlFor="report-start-date">Start date</label>
          <input
            id="report-start-date"
            type="date"
            value={draft.startDate}
            aria-invalid={Boolean(errors.startDate)}
            aria-describedby={
              errors.startDate ? "report-start-date-error" : undefined
            }
            onChange={(event) =>
              onChange({ ...draft, startDate: event.target.value })
            }
          />
          {errors.startDate ? (
            <p
              className="report-filter-error"
              id="report-start-date-error"
              role="alert"
            >
              {errors.startDate}
            </p>
          ) : null}
        </div>

        <div className="report-filter-field">
          <label htmlFor="report-end-date">End date</label>
          <input
            id="report-end-date"
            type="date"
            value={draft.endDate}
            aria-invalid={Boolean(errors.endDate)}
            aria-describedby={
              errors.endDate ? "report-end-date-error" : undefined
            }
            onChange={(event) =>
              onChange({ ...draft, endDate: event.target.value })
            }
          />
          {errors.endDate ? (
            <p
              className="report-filter-error"
              id="report-end-date-error"
              role="alert"
            >
              {errors.endDate}
            </p>
          ) : null}
        </div>

        <div className="report-filter-actions">
          <Button type="submit">Apply dates</Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onClear}
            disabled={!hasActiveRange}
          >
            Clear dates
          </Button>
        </div>
      </form>
    </section>
  );
}
