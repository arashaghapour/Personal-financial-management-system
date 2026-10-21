import { useMemo, useState } from "react";
import { NavLink, useParams } from "react-router-dom";

import { PageContainer } from "../components/ui/PageContainer";

import { CashFlowReportView } from "../features/reports/components/CashFlowReportView";
import { ExpenseReportView } from "../features/reports/components/ExpenseReportView";
import { ReportsDateRangeFilter } from "../features/reports/components/ReportsDateRangeFilter";
import { SummaryReportView } from "../features/reports/components/SummaryReportView";
import {
  emptyReportDateRange,
  getReportDateRangeErrors,
  hasAppliedReportDateRange,
  toReportDateFilters,
  type ReportDateRangeDraft,
} from "../features/reports/utils/report-filters";
import { formatReportDateRange } from "../features/reports/utils/report-format";

import type {
  ExpenseReportFilters,
  ReportDateFilters,
  ReportType,
} from "../features/reports/types";

import "../styles/reports.css";

type ReportOption = {
  type: ReportType;
  label: string;
  to: string;
};

const REPORT_OPTIONS: ReportOption[] = [
  { type: "summary", label: "Summary Report", to: "/reports/summary" },
  { type: "expenses", label: "Expense Report", to: "/reports/expenses" },
  { type: "cash-flow", label: "Cash Flow Report", to: "/reports/cash-flow" },
];

const DEFAULT_REPORT_TYPE: ReportType = "summary";

const isReportType = (value: string | undefined): value is ReportType =>
  value === "summary" || value === "expenses" || value === "cash-flow";

export default function ReportsPage() {
  const { reportType: reportTypeParam } = useParams<{
    reportType?: string;
  }>();

  const reportType = isReportType(reportTypeParam)
    ? reportTypeParam
    : DEFAULT_REPORT_TYPE;

  const [dateDraft, setDateDraft] = useState<ReportDateRangeDraft>(
    emptyReportDateRange,
  );
  const [dateFilters, setDateFilters] = useState<ReportDateFilters>({});
  const [categoryId, setCategoryId] = useState("");

  const dateErrors = getReportDateRangeErrors(dateDraft);
  const hasAppliedRange = hasAppliedReportDateRange(dateFilters);

  const expenseFilters = useMemo<ExpenseReportFilters>(
    () => ({
      ...dateFilters,
      ...(categoryId !== "" ? { categoryId } : {}),
    }),
    [dateFilters, categoryId],
  );

  /**
   * Date changes apply immediately once the range is valid. Invalid drafts stay
   * local so the backend is never called with a start date after the end date.
   */
  const handleDateChange = (next: ReportDateRangeDraft) => {
    setDateDraft(next);

    if (Object.keys(getReportDateRangeErrors(next)).length === 0) {
      setDateFilters(toReportDateFilters(next));
    }
  };

  const handleApplyDates = () => {
    if (Object.keys(getReportDateRangeErrors(dateDraft)).length === 0) {
      setDateFilters(toReportDateFilters(dateDraft));
    }
  };

  const handleClearDates = () => {
    setDateDraft(emptyReportDateRange);
    setDateFilters({});
  };

  const handleClearCategory = () => {
    setCategoryId("");
  };

  return (
    <PageContainer className="reports-page">
      <header className="page-header">
        <div>
          <h1>Reports</h1>
          <p className="page-description">
            Review your income, spending, and daily cash flow for any period.
          </p>
        </div>
      </header>

      <nav className="report-tabs" aria-label="Report types">
        <ul className="report-tabs-list">
          {REPORT_OPTIONS.map((option) => (
            <li key={option.type}>
              <NavLink
                to={option.to}
                className={({ isActive }) =>
                  isActive || reportType === option.type
                    ? "report-tab is-active"
                    : "report-tab"
                }
              >
                {option.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <ReportsDateRangeFilter
        draft={dateDraft}
        errors={dateErrors}
        onChange={handleDateChange}
        onApply={handleApplyDates}
        onClear={handleClearDates}
      />

      {hasAppliedRange ? (
        <p className="report-range-summary">
          {formatReportDateRange(dateFilters)}
        </p>
      ) : null}

      {reportType === "summary" ? (
        <SummaryReportView filters={dateFilters} />
      ) : reportType === "expenses" ? (
        <ExpenseReportView
          filters={expenseFilters}
          categoryId={categoryId}
          onCategoryChange={setCategoryId}
          onClearCategory={handleClearCategory}
        />
      ) : (
        <CashFlowReportView filters={dateFilters} />
      )}
    </PageContainer>
  );
}
