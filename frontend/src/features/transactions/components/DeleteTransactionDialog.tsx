import { useEffect } from "react";

import { Button } from "../../../components/ui/Button";
import { ErrorState } from "../../../components/ui/ErrorState";

type DeleteTransactionDialogProps = {
  title: string;
  pending: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Accessible confirmation dialog. The transaction is only removed after the
 * backend confirms deletion and both transaction and account caches refresh.
 */
export function DeleteTransactionDialog({
  title,
  pending,
  error,
  onConfirm,
  onCancel,
}: DeleteTransactionDialogProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) {
        onCancel();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [pending, onCancel]);

  return (
    <div
      className="transaction-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !pending) {
          onCancel();
        }
      }}
    >
      <div
        className="transaction-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-transaction-title"
        aria-describedby="delete-transaction-description"
        aria-busy={pending}
      >
        <h2 id="delete-transaction-title">Delete transaction</h2>
        <p id="delete-transaction-description">
          Are you sure you want to delete <strong>{title}</strong>? This action
          cannot be undone.
        </p>
        <p className="page-description">
          Deleting a transaction also reverses its effect on the account
          balance.
        </p>

        {error ? (
          <ErrorState title="Unable to delete transaction" message={error} />
        ) : null}

        <div className="transaction-form-actions">
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={pending}
            autoFocus
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            disabled={pending}
            aria-busy={pending}
          >
            {pending ? "Deleting transaction…" : "Delete transaction"}
          </Button>
        </div>
      </div>
    </div>
  );
}
