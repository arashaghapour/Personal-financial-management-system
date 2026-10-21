import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "../../../components/ui/Button";
import { ErrorState } from "../../../components/ui/ErrorState";

import type { Account } from "../../accounts/types";
import type { Category } from "../../categories/types";

import { getTransactionErrorMessage } from "../api/error-messages";
import {
  transactionFormSchema,
  type TransactionFormValues,
} from "../schemas/transaction.schemas";
import {
  TRANSACTION_TYPES,
  type Transaction,
  type TransactionFormSubmitValues,
} from "../types";
import {
  toDateInputValue,
  todayDateInputValue,
} from "../utils/transaction-format";

type TransactionFormProps = {
  mode: "create" | "edit";
  transaction?: Transaction;
  accounts: Account[];
  categories: Category[];
  optionsLoading: boolean;
  accountsError: string | null;
  categoriesError: string | null;
  onSubmit: (values: TransactionFormSubmitValues) => Promise<void>;
  onCancel: () => void;
};

const categoriesForType = (
  categories: Category[],
  type: TransactionFormValues["type"],
): Category[] => categories.filter((category) => category.type === type);

export function TransactionForm({
  mode,
  transaction,
  accounts,
  categories,
  optionsLoading,
  accountsError,
  categoriesError,
  onSubmit,
  onCancel,
}: TransactionFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<TransactionFormValues["type"]>(
    transaction?.type ?? "EXPENSE",
  );

  const {
    register: field,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      type: transaction?.type ?? "EXPENSE",
      amount: transaction ? Number(transaction.amount) : undefined,
      description: transaction?.description ?? "",
      date: transaction
        ? toDateInputValue(transaction.date)
        : todayDateInputValue(),
      accountId: transaction?.accountId,
      categoryId: transaction?.categoryId ?? "",
    },
  });

  const visibleCategories = categoriesForType(categories, selectedType);

  const optionsUnavailable =
    optionsLoading ||
    accountsError !== null ||
    categoriesError !== null ||
    accounts.length === 0 ||
    categories.length === 0;

  const submit = handleSubmit(async (values) => {
    setSubmitError(null);

    const description = values.description?.trim() ?? "";

    try {
      await onSubmit({
        type: values.type,
        amount: values.amount,
        description:
          mode === "create"
            ? description || undefined
            : description || null,
        date: values.date,
        accountId: values.accountId,
        categoryId: values.categoryId,
      });
    } catch (error) {
      setSubmitError(getTransactionErrorMessage(error));
    }
  });

  const isCreate = mode === "create";
  const isLockedType = mode === "edit";

  return (
    <form
      className="transaction-form"
      onSubmit={submit}
      noValidate
      aria-busy={isSubmitting}
    >
      {submitError ? (
        <ErrorState
          title={
            isCreate
              ? "Unable to create transaction"
              : "Unable to update transaction"
          }
          message={submitError}
        />
      ) : null}

      <div className="form-field">
        <label htmlFor="transaction-type">Transaction type</label>
        {isLockedType ? (
          <>
            <select
              id="transaction-type"
              value={selectedType}
              disabled
              aria-describedby="transaction-type-hint"
            >
              {TRANSACTION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <input type="hidden" {...field("type")} />
            <p id="transaction-type-hint" className="form-hint">
              Transaction type cannot be changed after creation.
            </p>
          </>
        ) : (
          <select
            id="transaction-type"
            aria-required="true"
            {...field("type", {
              onChange: (event) => {
                setSubmitError(null);
                setValue("categoryId", "");
                setSelectedType(
                  event.target.value as TransactionFormValues["type"],
                );
              },
            })}
          >
            {TRANSACTION_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="transaction-amount">Amount</label>
        <input
          id="transaction-amount"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          aria-required="true"
          aria-invalid={errors.amount ? true : undefined}
          aria-describedby={
            errors.amount ? "transaction-amount-error" : undefined
          }
          {...field("amount", {
            setValueAs: (value) =>
              value === "" || value === null ? undefined : Number(value),
            onChange: () => setSubmitError(null),
          })}
        />
        {errors.amount ? (
          <p
            id="transaction-amount-error"
            className="form-field-error"
            role="alert"
          >
            {errors.amount.message}
          </p>
        ) : null}
      </div>

      <div className="form-field">
        <label htmlFor="transaction-description">Description (optional)</label>
        <input
          id="transaction-description"
          type="text"
          autoComplete="off"
          maxLength={500}
          {...field("description", {
            onChange: () => setSubmitError(null),
          })}
        />
      </div>

      <div className="form-field">
        <label htmlFor="transaction-date">Date</label>
        <input
          id="transaction-date"
          type="date"
          aria-required="true"
          aria-invalid={errors.date ? true : undefined}
          aria-describedby={errors.date ? "transaction-date-error" : undefined}
          {...field("date", {
            onChange: () => setSubmitError(null),
          })}
        />
        {errors.date ? (
          <p
            id="transaction-date-error"
            className="form-field-error"
            role="alert"
          >
            {errors.date.message}
          </p>
        ) : null}
      </div>

      <div className="form-field">
        <label htmlFor="transaction-account">Account</label>
        <select
          id="transaction-account"
          aria-required="true"
          aria-invalid={errors.accountId ? true : undefined}
          aria-describedby={
            errors.accountId ? "transaction-account-error" : undefined
          }
          {...field("accountId", {
            setValueAs: (value) =>
              value === "" || value === null ? undefined : Number(value),
            onChange: () => setSubmitError(null),
          })}
        >
          <option value="">Choose an account</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
        {accountsError ? (
          <p className="form-field-error">{accountsError}</p>
        ) : null}
        {errors.accountId ? (
          <p
            id="transaction-account-error"
            className="form-field-error"
            role="alert"
          >
            {errors.accountId.message}
          </p>
        ) : null}
      </div>

      <div className="form-field">
        <label htmlFor="transaction-category">Category</label>
        <select
          id="transaction-category"
          aria-required="true"
          aria-invalid={errors.categoryId ? true : undefined}
          aria-describedby={
            errors.categoryId ? "transaction-category-error" : undefined
          }
          {...field("categoryId", {
            onChange: () => setSubmitError(null),
          })}
        >
          <option value="">Choose a category</option>
          {visibleCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        {categoriesError ? (
          <p className="form-field-error">{categoriesError}</p>
        ) : null}
        {errors.categoryId ? (
          <p
            id="transaction-category-error"
            className="form-field-error"
            role="alert"
          >
            {errors.categoryId.message}
          </p>
        ) : null}
      </div>

      <div className="transaction-form-actions">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || optionsUnavailable}
          aria-busy={isSubmitting}
        >
          {isSubmitting
            ? isCreate
              ? "Creating transaction"
              : "Saving changes…"
            : isCreate
              ? "Create transaction"
              : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
