import { formatCurrency } from "../../accounts/utils/account-format";

import type { Dashboard } from "../types";

type DashboardSummaryCardsProps = {
  summary: Pick<
    Dashboard,
    "totalBalance" | "totalIncome" | "totalExpenses" | "netCashFlow"
  >;
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
 * Financial summary cards. Every value is displayed exactly as returned by
 * the dashboard API; total balance is never recomputed from the other cards or
 * from the selected transaction date range.
 */
export function DashboardSummaryCards({
  summary,
}: DashboardSummaryCardsProps) {
  const netModifier = getNetCashFlowModifier(summary.netCashFlow);

  return (
    <section
      className="dashboard-summary"
      aria-labelledby="dashboard-summary-heading"
    >
      <h2 id="dashboard-summary-heading">Financial summary</h2>

      <div className="dashboard-summary-grid">
        <article
          className="dashboard-summary-card dashboard-summary-card--balance"
          aria-labelledby="dashboard-summary-balance-label"
        >
          <h3
            id="dashboard-summary-balance-label"
            className="dashboard-summary-label"
          >
            Total balance
          </h3>
          <p className="dashboard-summary-value">
            {formatCurrency(summary.totalBalance)}
          </p>
          <p className="dashboard-summary-note">
            Current combined balance across all accounts. Not affected by the
            date range.
          </p>
        </article>

        <article
          className="dashboard-summary-card dashboard-summary-card--income"
          aria-labelledby="dashboard-summary-income-label"
        >
          <h3
            id="dashboard-summary-income-label"
            className="dashboard-summary-label"
          >
            Total income
          </h3>
          <p className="dashboard-summary-value">
            {formatCurrency(summary.totalIncome)}
          </p>
          <p className="dashboard-summary-note">Income for the selected range.</p>
        </article>

        <article
          className="dashboard-summary-card dashboard-summary-card--expense"
          aria-labelledby="dashboard-summary-expense-label"
        >
          <h3
            id="dashboard-summary-expense-label"
            className="dashboard-summary-label"
          >
            Total expenses
          </h3>
          <p className="dashboard-summary-value">
            {formatCurrency(summary.totalExpenses)}
          </p>
          <p className="dashboard-summary-note">
            Expenses for the selected range.
          </p>
        </article>

        <article
          className={`dashboard-summary-card dashboard-summary-card--${netModifier}`}
          aria-labelledby="dashboard-summary-net-label"
        >
          <h3
            id="dashboard-summary-net-label"
            className="dashboard-summary-label"
          >
            Net cash flow
          </h3>
          <p className="dashboard-summary-value">
            {formatCurrency(summary.netCashFlow)}
          </p>
          <p className="dashboard-summary-note">
            Income minus expenses for the selected range.
          </p>
        </article>
      </div>
    </section>
  );
}
