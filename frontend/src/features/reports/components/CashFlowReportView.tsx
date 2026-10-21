import { Button } from "../../../components/ui/Button";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { LoadingIndicator } from "../../../components/ui/LoadingIndicator";

import { formatCurrency } from "../../accounts/utils/account-format";
import { formatTransactionDate } from "../../transactions/utils/transaction-format";

import { getReportErrorMessage } from "../api/error-messages";
import { useCashFlowReportQuery } from "../hooks/useReports";

import type { ReportDateFilters } from "../types";

type CashFlowReportViewProps = {
  filters: ReportDateFilters;
};

/**
 * Daily cash flow as returned by GET /api/reports/cash-flow. The backend
 * already orders dates ascending and supplies every value, so the table maps
 * the response directly without sorting or aggregation.
 */
export function CashFlowReportView({ filters }: CashFlowReportViewProps) {
  const reportQuery = useCashFlowReportQuery(filters);
  const report = reportQuery.data;

  return (
    <section
      className="report-view"
      aria-labelledby="cash-flow-report-heading"
    >
      <div className="report-view-heading">
        <h2 id="cash-flow-report-heading">Cash Flow Report</h2>
        <p
          className="report-view-description"
          id="cash-flow-report-description"
        >
          Daily income, expenses, and net cash flow for the selected date
          range.
        </p>
      </div>

      {reportQuery.isPending ? (
        <LoadingIndicator label="Loading cash flow report" />
      ) : reportQuery.isError ? (
        <ErrorState
          title="Unable to load cash flow report"
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
      ) : report !== undefined ? (
        report.data.length === 0 ? (
          <EmptyState
            title="No cash flow for this period"
            description="There are no transactions in the selected date range."
          />
        ) : (
          <div className="report-table-wrap">
            <table
              className="report-table"
              aria-describedby="cash-flow-report-description"
            >
              <caption>Daily cash flow</caption>
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Income</th>
                  <th scope="col">Expenses</th>
                  <th scope="col">Net cash flow</th>
                </tr>
              </thead>
              <tbody>
                {report.data.map((entry) => (
                  <tr key={entry.date}>
                    <th scope="row">{formatTransactionDate(entry.date)}</th>
                    <td>{formatCurrency(entry.income)}</td>
                    <td>{formatCurrency(entry.expenses)}</td>
                    <td>{formatCurrency(entry.netCashFlow)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : null}
    </section>
  );
}
