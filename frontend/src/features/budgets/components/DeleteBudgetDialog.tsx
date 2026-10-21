import { useEffect } from "react";

import { Button } from "../../../components/ui/Button";
import { ErrorState } from "../../../components/ui/ErrorState";

type DeleteBudgetDialogProps = {
  categoryName: string;
  period: string;
  pending: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
};

export function DeleteBudgetDialog({
  categoryName,
  period,
  pending,
  error,
  onConfirm,
  onCancel,
}: DeleteBudgetDialogProps) {
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
        aria-labelledby="delete-budget-title"
        aria-describedby="delete-budget-description"
        aria-busy={pending}
      >
        <h2 id="delete-budget-title">Delete budget</h2>
        <p id="delete-budget-description">
          Are you sure you want to delete the budget for{" "}
          <strong>{categoryName}</strong> ({period})? This action cannot be
          undone.
        </p>
        <p className="form-hint">
          Deleting a budget does not delete or change any transactions.
        </p>

        {error ? (
          <ErrorState title="Unable to delete budget" message={error} />
        ) : null}

        <div className="budget-form-actions">
          <Button
            variant="danger"
            onClick={onConfirm}
            disabled={pending}
            aria-busy={pending}
          >
            {pending ? "Deleting..." : "Delete budget"}
          </Button>
          <Button variant="secondary" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
