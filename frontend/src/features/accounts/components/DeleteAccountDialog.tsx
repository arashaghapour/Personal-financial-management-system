import { useEffect } from "react";

import { Button } from "../../../components/ui/Button";
import { ErrorState } from "../../../components/ui/ErrorState";

type DeleteAccountDialogProps = {
  accountName: string;
  pending: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Accessible confirmation dialog. Accounts associated with transactions are
 * rejected by the backend; the error is shown without touching transactions.
 */
export function DeleteAccountDialog({
  accountName,
  pending,
  error,
  onConfirm,
  onCancel,
}: DeleteAccountDialogProps) {
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
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !pending) {
          onCancel();
        }
      }}
    >
      <div
        className="modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-account-title"
        aria-describedby="delete-account-description"
        aria-busy={pending}
      >
        <h2 id="delete-account-title">Delete account</h2>
        <p id="delete-account-description">
          Are you sure you want to delete <strong>{accountName}</strong>? This
          action cannot be undone.
        </p>
        <p className="page-description">
          Accounts that are used by transactions cannot be deleted.
        </p>

        {error ? (
          <ErrorState title="Unable to delete account" message={error} />
        ) : null}

        <div className="account-form-actions">
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
            {pending ? "Deleting…" : "Delete account"}
          </Button>
        </div>
      </div>
    </div>
  );
}
