import { Button } from "../../../components/ui/Button";
import { ErrorState } from "../../../components/ui/ErrorState";
import { LoadingIndicator } from "../../../components/ui/LoadingIndicator";

import { getBudgetErrorMessage } from "../api/error-messages";
import { useBudgetQuery, useUpdateBudgetMutation } from "../hooks/useBudgets";
import { formatBudgetPeriod } from "../utils/budget-format";

import { BudgetEditForm } from "./BudgetEditForm";

type BudgetEditPanelProps = {
  budgetId: string;
  categoryName: string;
  onSaved: () => void;
  onCancel: () => void;
};

export function BudgetEditPanel({
  budgetId,
  categoryName,
  onSaved,
  onCancel,
}: BudgetEditPanelProps) {
  const { data: budget, isLoading, error, refetch } = useBudgetQuery(budgetId);
  const updateMutation = useUpdateBudgetMutation();
  const headingId = "edit-budget-heading";

  if (isLoading) {
    return (
      <section className="budget-panel" aria-labelledby={headingId}>
        <h2 id={headingId}>Edit budget</h2>
        <LoadingIndicator label="Loading budget..." />
      </section>
    );
  }

  if (error || !budget) {
    return (
      <section className="budget-panel" aria-labelledby={headingId}>
        <h2 id={headingId}>Edit budget</h2>
        <ErrorState
          title="Unable to load budget"
          message={getBudgetErrorMessage(error)}
          action={
            <Button variant="secondary" onClick={() => void refetch()}>
              Try again
            </Button>
          }
        />
        <div className="budget-form-actions">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="budget-panel" aria-labelledby={headingId}>
      <h2 id={headingId}>Edit budget</h2>
      <p className="page-description">
        {categoryName} - {formatBudgetPeriod(budget.year, budget.month)}
      </p>
      <p className="form-hint">
        Only the budget amount can be changed. To use another category or
        period, delete this budget and create a new one.
      </p>
      <BudgetEditForm
        initialAmount={Number(budget.amount)}
        onSubmit={async (values) => {
          await updateMutation.mutateAsync({
            id: budget.id,
            data: { amount: values.amount },
          });
          onSaved();
        }}
        onCancel={onCancel}
      />
    </section>
  );
}
