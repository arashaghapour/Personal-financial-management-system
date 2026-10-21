import { useQuery } from "@tanstack/react-query";

import { Button } from "../../../components/ui/Button";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { LoadingIndicator } from "../../../components/ui/LoadingIndicator";

import { formatCurrency } from "../../accounts/utils/account-format";
import { fetchCategories } from "../../categories/api/categories.queries";
import { categoryKeys } from "../../categories/api/category.keys";

import { getReportErrorMessage } from "../api/error-messages";
import { useExpenseReportQuery } from "../hooks/useReports";
import { formatReportCount } from "../utils/report-format";

import type { ExpenseReportFilters } from "../types";

type ExpenseReportViewProps = {
  filters: ExpenseReportFilters;
  categoryId: string;
  onCategoryChange: (categoryId: string) => void;
  onClearCategory: () => void;
};

/**
 * Expense totals grouped by category as returned by
 * GET /api/reports/expenses. Group order and totals are preserved exactly;
 * the category filter only uses categories the backend marks as EXPENSE.
 */
export function ExpenseReportView({
  filters,
  categoryId,
  onCategoryChange,
  onClearCategory,
}: ExpenseReportViewProps) {
  const reportQuery = useExpenseReportQuery(filters);
  const categoriesQuery = useQuery({
    queryKey: categoryKeys.list("EXPENSE"),
    queryFn: () => fetchCategories("EXPENSE"),
  });

  const report = reportQuery.data;
  const categories = Array.isArray(categoriesQuery.data)
    ? categoriesQuery.data.filter((category) => category.type === "EXPENSE")
    : [];

  return (
    <section
      className="report-view"
      aria-labelledby="expense-report-heading"
    >
      <div className="report-view-heading">
        <h2 id="expense-report-heading">Expense Report</h2>
        <p className="report-view-description">
          Expenses grouped by category for the selected date range. Groups are
          shown in the order returned by the server.
        </p>
      </div>

      <div className="report-category-filter">
        <div className="form-field">
          <label htmlFor="report-category-filter">Category</label>
          <select
            id="report-category-filter"
            value={categoryId}
            disabled={categoriesQuery.isLoading}
            onChange={(event) => onCategoryChange(event.target.value)}
          >
            <option value="">All expense categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <Button
          type="button"
          variant="secondary"
          onClick={onClearCategory}
          disabled={categoryId === ""}
        >
          Clear category
        </Button>

        {categoriesQuery.isLoading ? (
          <p className="report-filter-status" role="status">
            Loading categories...
          </p>
        ) : null}

        {categoriesQuery.isError ? (
          <p className="report-filter-error" role="alert">
            Unable to load categories.
          </p>
        ) : null}
      </div>

      {reportQuery.isPending ? (
        <LoadingIndicator label="Loading expense report" />
      ) : reportQuery.isError ? (
        <ErrorState
          title="Unable to load expense report"
          message={getReportErrorMessage(reportQuery.error)}
          action={
            <div className="report-error-actions">
              <Button
                variant="secondary"
                onClick={() => void reportQuery.refetch()}
                disabled={reportQuery.isFetching}
              >
                Try again
              </Button>
              {categoryId !== "" ? (
                <Button variant="secondary" onClick={onClearCategory}>
                  Clear category filter
                </Button>
              ) : null}
            </div>
          }
        />
      ) : report !== undefined ? (
        <>
          <p className="report-total">
            <span className="report-total-label">Total expenses</span>
            <span className="report-total-value">
              {formatCurrency(report.totalExpenses)}
            </span>
          </p>

          {report.categories.length === 0 ? (
            <EmptyState
              title="No expenses match your filters"
              description="Try clearing or widening the date and category filters to see more results."
              action={
                categoryId !== "" ? (
                  <Button variant="secondary" onClick={onClearCategory}>
                    Clear category
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="report-table-wrap">
              <table className="report-table">
                <caption>Expense report by category</caption>
                <thead>
                  <tr>
                    <th scope="col">Category</th>
                    <th scope="col">Amount</th>
                    <th scope="col">Transactions</th>
                  </tr>
                </thead>
                <tbody>
                  {report.categories.map((category) => (
                    <tr key={category.categoryId}>
                      <th scope="row">
                        {category.categoryName?.trim() || "Uncategorized"}
                      </th>
                      <td>{formatCurrency(category.amount)}</td>
                      <td>{formatReportCount(category.transactionCount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : null}
    </section>
  );
}
