import { Button } from "../../../components/ui/Button";
import { ErrorState } from "../../../components/ui/ErrorState";
import { LoadingIndicator } from "../../../components/ui/LoadingIndicator";

import type { Account } from "../../accounts/types";
import type { Category } from "../../categories/types";

import { getTransactionErrorMessage } from "../api/error-messages";
import {
  useTransactionQuery,
  useUpdateTransactionMutation,
} from "../hooks/useTransactions";
import type { Transaction, TransactionFormSubmitValues } from "../types";

import { TransactionForm } from "./TransactionForm";

type TransactionEditPanelProps = {
  transactionId: string;
  accounts: Account[];
  categories: Category[];
  optionsLoading: boolean;
  accountsError: string | null;
  categoriesError: string | null;
  onSaved: (transaction: Transaction) => void;
  onCancel: () => void;
};

export function TransactionEditPanel({
  transactionId,
  accounts,
  categories,
  optionsLoading,
  accountsError,
  categoriesError,
  onSaved,
  onCancel,
}: TransactionEditPanelProps) {
  const { data: transaction, isLoading, error, refetch } =
    useTransactionQuery(transactionId);
  const updateMutation = useUpdateTransactionMutation();

  if (isLoading) {
    return (
      <section
        className="transaction-panel"
        aria-label="Loading transaction"
      >
        <LoadingIndicator label="Loading transaction…" />
      </section>
    );
  }

  if (error || !transaction) {
    return (
      <section className="transaction-panel" aria-label="Edit transaction">
        <h2>Edit transaction</h2>
        <ErrorState
          title="Unable to load transaction"
          message={
            error ? getTransactionErrorMessage(error) : "This transaction could not be found."
          }
          action={
            <Button variant="secondary" onClick={() => void refetch()}>
              Try again
            </Button>
          }
        />
        <div className="transaction-form-actions">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </section>
    );
  }

  const handleSubmit = async (values: TransactionFormSubmitValues) => {
    const updated = await updateMutation.mutateAsync({
      id: transaction.id,
      data: {
        amount: values.amount,
        description: values.description ?? null,
        date: values.date,
        accountId: values.accountId,
        categoryId: values.categoryId,
      },
    });

    onSaved(updated);
  };

  return (
    <section
      className="transaction-panel"
      aria-labelledby="edit-transaction-heading"
    >
      <h2 id="edit-transaction-heading">Edit transaction</h2>
      <p className="page-description">
        Update the amount, description, date, account, or category. The
        transaction type cannot be changed.
      </p>
      <TransactionForm
        mode="edit"
        transaction={transaction}
        accounts={accounts}
        categories={categories}
        optionsLoading={optionsLoading}
        accountsError={accountsError}
        categoriesError={categoriesError}
        onSubmit={handleSubmit}
        onCancel={onCancel}
      />
    </section>
  );
}
