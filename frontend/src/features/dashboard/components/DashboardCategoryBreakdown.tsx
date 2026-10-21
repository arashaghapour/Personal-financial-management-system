import { formatCurrency } from "../../accounts/utils/account-format";

import {
  calculateCategoryShare,
  formatCategoryShare,
  toDashboardAmount,
} from "../utils/dashboard-format";

import type { DashboardCategorySummary } from "../types";

type DashboardCategoryBreakdownProps = {
  title: string;
  headingId: string;
  categories: DashboardCategorySummary[];
  emptyMessage: string;
};

/**
 * Accessible category breakdown. A CSS bar conveys relative size visually,
 * while the always-present list exposes the same information as text.
 */
export function DashboardCategoryBreakdown({
  title,
  headingId,
  categories,
  emptyMessage,
}: DashboardCategoryBreakdownProps) {
  const total = categories.reduce(
    (sum, category) => sum + toDashboardAmount(category.total),
    0,
  );

  return (
    <section
      className="dashboard-panel dashboard-category-breakdown"
      aria-labelledby={headingId}
    >
      <h2 id={headingId}>{title}</h2>

      {categories.length === 0 ? (
        <p className="dashboard-panel-empty">{emptyMessage}</p>
      ) : (
        <ul
          className="dashboard-category-list"
          aria-label={`${title} amounts`}
        >
          {categories.map((category) => {
            const amount = toDashboardAmount(category.total);
            const share = calculateCategoryShare(category.total, total);
            const name = category.categoryName?.trim() || "Uncategorized";

            return (
              <li className="dashboard-category-item" key={category.categoryId}>
                <div className="dashboard-category-label-row">
                  <span className="dashboard-category-name">{name}</span>
                  <span className="dashboard-category-amount">
                    {formatCurrency(amount)}
                  </span>
                </div>
                <div
                  className="dashboard-category-bar"
                  aria-hidden="true"
                >
                  <span
                    className="dashboard-category-bar-fill"
                    style={{ width: `${share}%` }}
                  />
                </div>
                <span className="dashboard-category-share">
                  <span>{formatCategoryShare(share)}</span> of period total
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
