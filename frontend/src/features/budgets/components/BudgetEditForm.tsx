import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "../../../components/ui/Button";
import { ErrorState } from "../../../components/ui/ErrorState";

import { getBudgetErrorMessage } from "../api/error-messages";
import {
  updateBudgetSchema,
  type UpdateBudgetFormValues,
} from "../schemas/budget.schemas";

type BudgetEditFormProps = {
  initialAmount: number;
  onSubmit: (values: UpdateBudgetFormValues) => Promise<void>;
  onCancel: () => void;
};

export function BudgetEditForm({
  initialAmount,
  onSubmit,
  onCancel,
}: BudgetEditFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register: field,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateBudgetFormValues>({
    resolver: zodResolver(updateBudgetSchema),
    defaultValues: { amount: initialAmount },
  });

  const submit = handleSubmit(async (values) => {
    setSubmitError(null);

    try {
      await onSubmit(values);
    } catch (error) {
      setSubmitError(getBudgetErrorMessage(error));
    }
  });

  return (
    <form
      className="budget-form"
      onSubmit={submit}
      noValidate
      aria-busy={isSubmitting}
    >
      {submitError ? (
        <ErrorState title="Unable to update budget" message={submitError} />
      ) : null}

      <div className="form-field">
        <label htmlFor="edit-budget-amount">Budget amount</label>
        <input
          id="edit-budget-amount"
          type="number"
          min="0.01"
          step="0.01"
          inputMode="decimal"
          autoFocus
          aria-required="true"
          aria-invalid={errors.amount ? true : undefined}
          aria-describedby={
            errors.amount ? "edit-budget-amount-error" : undefined
          }
          {...field("amount", {
            valueAsNumber: true,
            onChange: () => setSubmitError(null),
          })}
        />
        {errors.amount ? (
          <p
            id="edit-budget-amount-error"
            className="form-field-error"
            role="alert"
          >
            {errors.amount.message}
          </p>
        ) : null}
      </div>

      <div className="budget-form-actions">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save changes"}
        </Button>
        <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
