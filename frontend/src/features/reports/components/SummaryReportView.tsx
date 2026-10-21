import { Button } from "../../../components/ui/Button";
import { ErrorState } from "../../../components/ui/ErrorState";
import { LoadingIndicator } from "../../../components/ui/LoadingIndicator";

import { formatCurrency } from "../../accounts/utils/account-format";

import { getReportErrorMessage } from "../api/error-messages";
import { useSummaryReportQuery } from "../hooks/useReports";
import { formatReportCount } from "../utils/report-format";

import type { ReportDateFilters } from "../types";

type SummaryReportViewProps = {
  filters: ReportDateFilters;
};

type NetCashFlowModifier = "positive" | "negative" | "neutral";

const getNetCashFlowModifier = (value: number): NetCashFlowModifier => {
  if (value < 0) {
    return "negative";
  }

  if (value > 0) {
    return "positive";
  }

  return "neutral";
};

/**
 * Financial summary straight from GET /api/reports/summary. Values are
 * displayed exactly as returned; no total or count is recalculated here.
 */
export function SummaryReportView({ filters }: SummaryReportViewProps) {
  const reportQuery = useSummaryReportQuery(filters);
  const summary = reportQuery.data;

  const netModifier =
    summary !== undefined
      ? getNetCashFlowModifier(Number(summary.netCashFlow))
      : "neutral";

  return (
    <section
      className="report-view"
      aria-labelledby="summary-report-heading"
    >
      <div className="report-view-heading">
        <h2 id="summary-report-heading">Summary Report</h2>
        <p className="report-view-description">
          Income, expenses, net cash flow, and transaction counts for the
          selected date range.
        </p>
      </div>

      {reportQuery.isPending ? (
        <LoadingIndicator label="Loading summary report" />
      ) : reportQuery.isError ? (
        <ErrorState
          title="Unable to load summary report"
          message={getReportErrorMessage(reportQuery.error)}
          action={
            <Button
              variant="secondary"
              onClick={() => void reportQuery.refetch()}
              disabled={reportQuery.isFetching}
            >
              Try again
            </Button>
          }
        />
      ) : summary !== undefined ? (
        <>
          {summary.transactionCount === 0 ? (
            <p className="report-empty-note" role="status">
              No transactions match the selected date range.
            </p>
          ) : null}

          <div className="report-summary-grid">
            <article
              className="report-summary-card report-summary-card--income"
              aria-labelledby="summary-income-label"
            >
              <h3 id="summary-income-label" className="report-summary-label">
                Total income
              </h3>
              <p className="report-summary-value">
                {formatCurrency(summary.totalIncome)}
              </p>
            </article>

            <article
              className="report-summary-card report-summary-card--expense"
              aria-labelledby="summary-expense-label"
            >
              <h3 id="summary-expense-label" className="report-summary-label">
                Total expenses
              </h3>
              <p className="report-summary-value">
                {formatCurrency(summary.totalExpenses)}
              </p>
            </article>

            <article
              className={`report-summary-card report-summary-card--${netModifier}`}
              aria-labelledby="summary-net-label"
            >
              <h3 id="summary-net-label" className="report-summary-label">
                Net cash flow
              </h3>
              <p className="report-summary-value">
                {formatCurrency(summary.netCashFlow)}
              </p>
            </article>

            <article
              className="report-summary-card report-summary-card--count"
              aria-labelledby="summary-transactions-label"
            >
              <h3
                id="summary-transactions-label"
                className="report-summary-label"
              >
                Transactions
              </h3>
              <p className="report-summary-value">
                {formatReportCount(summary.transactionCount)}
              </p>
            </article>

            <article
              className="report-summary-card report-summary-card--count"
              aria-labelledby="summary-income-count-label"
            >
              <h3
                id="summary-income-count-label"
                className="report-summary-label"
              >
                Income transactions
              </h3>
              <p className="report-summary-value">
                {formatReportCount(summary.incomeTransactionCount)}
              </p>
            </article>

            <article
              className="report-summary-card report-summary-card--count"
              aria-labelledby="summary-expense-count-label"
            >
              <h3
                id="summary-expense-count-label"
                className="report-summary-label"
              >
                Expense transactions
              </h3>
              <p className="report-summary-value">
                {formatReportCount(summary.expenseTransactionCount)}
              </p>
            </article>
          </div>
        </>
      ) : null}
    </section>
  );
}
