import { useId } from "react";

import { Button } from "../../../components/ui/Button";

import { BudgetProgressView } from "./BudgetProgressView";

import { formatBudgetPeriod } from "../utils/budget-format";

import type { Budget, BudgetProgress } from "../types";

type BudgetCardProps = {
  budget: Budget;
  categoryName: string;
  progress: BudgetProgress | undefined;
  isProgressLoading: boolean;
  progressError: string | null;
  onRetryProgress: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function BudgetCard({
  budget,
  categoryName,
  progress,
  isProgressLoading,
  progressError,
  onRetryProgress,
  onEdit,
  onDelete,
}: BudgetCardProps) {
  const headingId = useId();

  return (
    <article className="budget-card" aria-labelledby={headingId}>
      <header className="budget-card-header">
        <div>
          <h3 id={headingId} className="budget-card-title">
            {categoryName}
          </h3>
          <p className="budget-card-period">
            {formatBudgetPeriod(budget.year, budget.month)}
          </p>
        </div>
      </header>

      {isProgressLoading ? (
        <p className="budget-progress-message" role="status">
          Loading budget progress...
        </p>
      ) : null}

      {!isProgressLoading && progressError ? (
        <div className="budget-progress-error" role="alert">
          <p className="budget-progress-error-title">
            Unable to load budget progress
          </p>
          <p className="budget-progress-error-message">{progressError}</p>
          <Button variant="secondary" onClick={onRetryProgress}>
            Retry progress
          </Button>
        </div>
      ) : null}

      {!isProgressLoading && !progressError && progress ? (
        <BudgetProgressView progress={progress} categoryName={categoryName} />
      ) : null}

      <div className="budget-card-actions">
        <Button
          variant="secondary"
          aria-label={`Edit ${categoryName} budget`}
          onClick={onEdit}
        >
          Edit
        </Button>
        <Button
          variant="danger"
          aria-label={`Delete ${categoryName} budget`}
          onClick={onDelete}
        >
          Delete
        </Button>
      </div>
    </article>
  );
}
