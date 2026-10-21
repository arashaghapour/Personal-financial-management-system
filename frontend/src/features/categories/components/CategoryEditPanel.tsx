import { Button } from "../../../components/ui/Button";
import { ErrorState } from "../../../components/ui/ErrorState";
import { LoadingIndicator } from "../../../components/ui/LoadingIndicator";

import { updateCategoryMutation } from "../api/categories.queries";
import { useCategoryQuery } from "../hooks/useCategory";

import type { Category } from "../types";

import { CategoryForm } from "./CategoryForm";

type CategoryEditPanelProps = {
  categoryId: string;
  onSaved: (category: Category) => void;
  onCancel: () => void;
};

export function CategoryEditPanel({
  categoryId,
  onSaved,
  onCancel,
}: CategoryEditPanelProps) {
  const { category, isLoading, error, refetch } =
    useCategoryQuery(categoryId);

  if (isLoading) {
    return (
      <section className="category-panel" aria-label="Edit category">
        <LoadingIndicator label="Loading category…" />
      </section>
    );
  }

  if (error || !category) {
    return (
      <section className="category-panel" aria-label="Edit category">
        <ErrorState
          title="Unable to load category"
          message={error ?? "This category could not be found."}
          action={
            <Button variant="secondary" onClick={() => void refetch()}>
              Try again
            </Button>
          }
        />
        <div className="category-form-actions">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section
      className="category-panel"
      aria-labelledby="edit-category-heading"
    >
      <h2 id="edit-category-heading">Edit category</h2>
      <p className="page-description">
        Update the category name or type. Categories used by transactions
        cannot be deleted, but they can still be renamed.
      </p>
      <CategoryForm
        mode="edit"
        initialValues={{ name: category.name, type: category.type }}
        onSubmit={async (values) => {
          const updated = await updateCategoryMutation(categoryId, {
            name: values.name,
            type: values.type,
          });

          onSaved(updated);
        }}
        onCancel={onCancel}
      />
    </section>
  );
}
