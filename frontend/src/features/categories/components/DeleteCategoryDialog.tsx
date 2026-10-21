import { useEffect } from "react";

import { Button } from "../../../components/ui/Button";
import { ErrorState } from "../../../components/ui/ErrorState";

type DeleteCategoryDialogProps = {
  categoryName: string;
  pending: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Accessible confirmation dialog. Categories referenced by transactions are
 * rejected by the backend; the error is shown without touching transactions.
 */
export function DeleteCategoryDialog({
  categoryName,
  pending,
  error,
  onConfirm,
  onCancel,
}: DeleteCategoryDialogProps) {
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
        aria-labelledby="delete-category-title"
        aria-describedby="delete-category-description"
        aria-busy={pending}
      >
        <h2 id="delete-category-title">Delete category</h2>
        <p id="delete-category-description">
          Are you sure you want to delete <strong>{categoryName}</strong>? This
          action cannot be undone.
        </p>
        <p className="page-description">
          Categories that are used by transactions cannot be deleted.
        </p>

        {error ? (
          <ErrorState title="Unable to delete category" message={error} />
        ) : null}

        <div className="category-form-actions">
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
            {pending ? "Deleting…" : "Delete category"}
          </Button>
        </div>
      </div>
    </div>
  );
}
