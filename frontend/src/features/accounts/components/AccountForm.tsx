import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "../../../components/ui/Button";
import { ErrorState } from "../../../components/ui/ErrorState";

import { getAccountErrorMessage } from "../api/error-messages";
import {
  accountFormSchema,
  type AccountFormSubmitValues,
  type AccountFormValues,
} from "../schemas/account.schemas";

import { ACCOUNT_TYPES, type AccountType } from "../types";
import { formatAccountType } from "../utils/account-format";

type AccountFormProps = {
  mode: "create" | "edit";
  initialValues?: {
    name?: string;
    type?: AccountType;
  };
  onSubmit: (values: AccountFormSubmitValues) => Promise<void>;
  onCancel: () => void;
};

export function AccountForm({
  mode,
  initialValues,
  onSubmit,
  onCancel,
}: AccountFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register: field,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      name: initialValues?.name ?? "",
      type: initialValues?.type ?? "CASH",
      initialBalance: 0,
    },
  });

  const submit = handleSubmit(async (values) => {
    setSubmitError(null);

    try {
      await onSubmit({
        name: values.name,
        type: values.type,
        ...(mode === "create" && { initialBalance: values.initialBalance }),
      });
    } catch (error) {
      setSubmitError(getAccountErrorMessage(error));
    }
  });

  const isCreate = mode === "create";

  return (
    <form
      className="account-form"
      onSubmit={submit}
      noValidate
      aria-busy={isSubmitting}
    >
      {submitError ? (
        <ErrorState
          title={isCreate ? "Unable to create account" : "Unable to update account"}
          message={submitError}
        />
      ) : null}

      <div className="form-field">
        <label htmlFor="account-name">Account name</label>
        <input
          id="account-name"
          type="text"
          autoComplete="off"
          autoFocus
          aria-required="true"
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? "account-name-error" : undefined}
          {...field("name", {
            onChange: () => setSubmitError(null),
          })}
        />
        {errors.name ? (
          <p id="account-name-error" className="form-field-error" role="alert">
            {errors.name.message}
          </p>
        ) : null}
      </div>

      <div className="form-field">
        <label htmlFor="account-type">Account type</label>
        <select
          id="account-type"
          aria-required="true"
          aria-invalid={errors.type ? true : undefined}
          aria-describedby={errors.type ? "account-type-error" : undefined}
          {...field("type", {
            onChange: () => setSubmitError(null),
          })}
        >
          {ACCOUNT_TYPES.map((type) => (
            <option key={type} value={type}>
              {formatAccountType(type)}
            </option>
          ))}
        </select>
        {errors.type ? (
          <p id="account-type-error" className="form-field-error" role="alert">
            {errors.type.message}
          </p>
        ) : null}
      </div>

      {isCreate ? (
        <div className="form-field">
          <label htmlFor="account-initial-balance">Initial balance</label>
          <input
            id="account-initial-balance"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            aria-required="true"
            aria-invalid={errors.initialBalance ? true : undefined}
            aria-describedby={
              errors.initialBalance
                ? "account-initial-balance-error"
                : "account-initial-balance-hint"
            }
            {...field("initialBalance", {
              valueAsNumber: true,
              onChange: () => setSubmitError(null),
            })}
          />
          <p id="account-initial-balance-hint" className="form-hint">
            Defaults to 0. Balances cannot be edited directly later.
          </p>
          {errors.initialBalance ? (
            <p
              id="account-initial-balance-error"
              className="form-field-error"
              role="alert"
            >
              {errors.initialBalance.message}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="account-form-actions">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
          {isSubmitting
            ? isCreate
              ? "Creating account…"
              : "Saving changes…"
            : isCreate
              ? "Create account"
              : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
