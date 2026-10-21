import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "../../../components/ui/Button";
import { ErrorState } from "../../../components/ui/ErrorState";

import type { Category } from "../../categories/types";

import { getBudgetErrorMessage } from "../api/error-messages";
import {
  createBudgetSchema,
  type CreateBudgetFormValues,
} from "../schemas/budget.schemas";
import {
  BUDGET_MONTH_OPTIONS,
  formatBudgetPeriod,
} from "../utils/budget-format";

type BudgetFormProps = {
  categories: Category[];
  categoriesLoading: boolean;
  categoriesError: string | null;
  defaultPeriod: { year: number; month: number };
  onSubmit: (values: CreateBudgetFormValues) => Promise<void>;
  onCancel: () => void;
};

export function BudgetForm({
  categories,
  categoriesLoading,
  categoriesError,
  defaultPeriod,
  onSubmit,
  onCancel,
}: BudgetFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register: field,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateBudgetFormValues>({
    resolver: zodResolver(createBudgetSchema),
    defaultValues: {
      categoryId: "",
      amount: undefined,
      year: defaultPeriod.year,
      month: defaultPeriod.month,
    },
  });

  const optionsUnavailable =
    categoriesLoading || categoriesError !== null || categories.length === 0;

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
        <ErrorState title="Unable to create budget" message={submitError} />
      ) : null}

      {categoriesError ? (
        <ErrorState
          title="Unable to load expense categories"
          message={categoriesError}
        />
      ) : null}

      {!categoriesLoading &&
      categoriesError === null &&
      categories.length === 0 ? (
        <p className="form-field-error" role="alert">
          No expense categories are available. Create an expense category
          before adding a budget.
        </p>
      ) : null}

      <div className="form-field">
        <label htmlFor="budget-category">Category</label>
        <select
          id="budget-category"
          autoFocus
          disabled={optionsUnavailable}
          aria-required="true"
          aria-invalid={errors.categoryId ? true : undefined}
          aria-describedby={
            errors.categoryId ? "budget-category-error" : undefined
          }
          {...field("categoryId", {
            onChange: () => setSubmitError(null),
          })}
        >
          <option value="">
            {categoriesLoading ? "Loading categories..." : "Select a category"}
          </option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        {errors.categoryId ? (
          <p
            id="budget-category-error"
            className="form-field-error"
            role="alert"
          >
            {errors.categoryId.message}
          </p>
        ) : null}
      </div>

      <div className="form-field">
        <label htmlFor="budget-amount">Budget amount</label>
        <input
          id="budget-amount"
          type="number"
          min="0.01"
          step="0.01"
          inputMode="decimal"
          aria-required="true"
          aria-invalid={errors.amount ? true : undefined}
          aria-describedby={errors.amount ? "budget-amount-error" : undefined}
          {...field("amount", {
            valueAsNumber: true,
            onChange: () => setSubmitError(null),
          })}
        />
        {errors.amount ? (
          <p id="budget-amount-error" className="form-field-error" role="alert">
            {errors.amount.message}
          </p>
        ) : null}
      </div>

      <div className="budget-form-period">
        <div className="form-field">
          <label htmlFor="budget-month">Month</label>
          <select
            id="budget-month"
            aria-required="true"
            aria-invalid={errors.month ? true : undefined}
            aria-describedby={
              errors.month ? "budget-month-error" : undefined
            }
            {...field("month", {
              valueAsNumber: true,
              onChange: () => setSubmitError(null),
            })}
          >
            {BUDGET_MONTH_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.month ? (
            <p
              id="budget-month-error"
              className="form-field-error"
              role="alert"
            >
              {errors.month.message}
            </p>
          ) : null}
        </div>

        <div className="form-field">
          <label htmlFor="budget-year">Year</label>
          <input
            id="budget-year"
            type="number"
            min="1"
            step="1"
            inputMode="numeric"
            aria-required="true"
            aria-invalid={errors.year ? true : undefined}
            aria-describedby={errors.year ? "budget-year-error" : undefined}
            {...field("year", {
              valueAsNumber: true,
              onChange: () => setSubmitError(null),
            })}
          />
          {errors.year ? (
            <p id="budget-year-error" className="form-field-error" role="alert">
              {errors.year.message}
            </p>
          ) : null}
        </div>
      </div>

      <p className="form-hint">
        Creating for {formatBudgetPeriod(defaultPeriod.year, defaultPeriod.month)}
        . Change the month or year above to use a different period.
      </p>

      <div className="budget-form-actions">
        <Button
          type="submit"
          disabled={isSubmitting || optionsUnavailable}
        >
          {isSubmitting ? "Creating budget..." : "Create budget"}
        </Button>
        <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
