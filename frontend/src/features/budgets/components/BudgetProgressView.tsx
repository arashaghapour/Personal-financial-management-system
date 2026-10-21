import { formatCurrency } from "../../accounts/utils/account-format";

import {
  formatBudgetPercentage,
  getBudgetStatusLabel,
  getBudgetStatusModifier,
} from "../utils/budget-format";

import type { BudgetProgress } from "../types";

type BudgetProgressViewProps = {
  progress: BudgetProgress;
  categoryName: string;
};

export function BudgetProgressView({
  progress,
  categoryName,
}: BudgetProgressViewProps) {
  const percentageLabel = `${formatBudgetPercentage(progress.percentageUsed)} used`;
  const modifier = getBudgetStatusModifier(progress.status);
  const barWidth = Math.min(100, Math.max(0, progress.percentageUsed));

  return (
    <div className="budget-progress">
      <dl className="budget-progress-meta">
        <div>
          <dt>Budget</dt>
          <dd>{formatCurrency(progress.budgetAmount)}</dd>
        </div>
        <div>
          <dt>Spent</dt>
          <dd>{formatCurrency(progress.spentAmount)}</dd>
        </div>
        <div>
          <dt>Remaining</dt>
          <dd>{formatCurrency(progress.remainingAmount)}</dd>
        </div>
      </dl>

      <div
        className={`budget-progress-bar budget-progress-bar--${modifier}`}
        role="progressbar"
        aria-label={`${categoryName} budget usage`}
        aria-valuemin={0}
        aria-valuemax={Math.max(100, progress.percentageUsed)}
        aria-valuenow={progress.percentageUsed}
        aria-valuetext={percentageLabel}
      >
        <span
          className="budget-progress-fill"
          style={{ width: `${barWidth}%` }}
        />
      </div>

      <div className="budget-progress-summary">
        <span className="budget-progress-percentage">{percentageLabel}</span>
        <span className={`budget-status budget-status--${modifier}`}>
          {getBudgetStatusLabel(progress.status)}
        </span>
      </div>
    </div>
  );
}
