import { useState } from "react";

import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingIndicator } from "../components/ui/LoadingIndicator";
import { PageContainer } from "../components/ui/PageContainer";

import { CategoryCard } from "../features/categories/components/CategoryCard";
import { CategoryEditPanel } from "../features/categories/components/CategoryEditPanel";
import { CategoryForm } from "../features/categories/components/CategoryForm";
import { DeleteCategoryDialog } from "../features/categories/components/DeleteCategoryDialog";

import {
  createCategoryMutation,
  deleteCategoryMutation,
} from "../features/categories/api/categories.queries";
import { getDeleteCategoryErrorMessage } from "../features/categories/api/error-messages";
import { useCategoriesQuery } from "../features/categories/hooks/useCategories";

import type {
  Category,
  CategoryFilter,
} from "../features/categories/types";

import "../styles/categories.css";

type PanelState =
  | { mode: "create" }
  | { mode: "edit"; categoryId: string }
  | null;

const FILTER_OPTIONS: Array<{ value: CategoryFilter; label: string }> = [
  { value: "ALL", label: "All" },
  { value: "INCOME", label: "Income" },
  { value: "EXPENSE", label: "Expense" },
];

const EMPTY_COPY: Record<
  CategoryFilter,
  { title: string; description: string }
> = {
  ALL: {
    title: "No categories yet",
    description:
      "Add your first category to start classifying your income and expenses.",
  },
  INCOME: {
    title: "No income categories yet",
    description: "Add an income category such as Salary or Freelance.",
  },
  EXPENSE: {
    title: "No expense categories yet",
    description: "Add an expense category such as Food or Transport.",
  },
};

export default function CategoriesPage() {
  const [filter, setFilter] = useState<CategoryFilter>("ALL");

  const {
    categories,
    isLoading,
    isFetching,
    error,
    refetch,
    addCategory,
    replaceCategory,
    removeCategory,
  } = useCategoriesQuery(filter);

  const [panel, setPanel] = useState<PanelState>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const openCreate = () => {
    setNotice(null);
    setPanel({ mode: "create" });
  };

  const openEdit = (category: Category) => {
    setNotice(null);
    setPanel({ mode: "edit", categoryId: category.id });
  };

  const openDelete = (category: Category) => {
    setNotice(null);
    setDeleteError(null);
    setDeleteTarget(category);
  };

  const closeDelete = () => {
    if (deletePending) {
      return;
    }

    setDeleteError(null);
    setDeleteTarget(null);
  };

  const handleCreated = (category: Category) => {
    addCategory(category);
    setPanel(null);
    setNotice("Category created.");
    void refetch();
  };

  const handleSaved = (category: Category) => {
    replaceCategory(category);
    setPanel(null);
    setNotice("Category updated.");
    void refetch();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    const categoryId = deleteTarget.id;

    setDeletePending(true);
    setDeleteError(null);

    try {
      await deleteCategoryMutation(categoryId);
      removeCategory(categoryId);
      setDeleteTarget(null);
      setNotice("Category deleted.");
      await refetch();
    } catch (caught) {
      setDeleteError(getDeleteCategoryErrorMessage(caught));
    } finally {
      setDeletePending(false);
    }
  };

  const emptyCopy = EMPTY_COPY[filter];

  return (
    <PageContainer className="categories-page">
      <div className="page-header">
        <div>
          <h1>Categories</h1>
          <p className="page-description">
            Organize your income and expenses into categories you can reuse.
          </p>
        </div>
        <Button onClick={openCreate} disabled={panel?.mode === "create"}>
          Add category
        </Button>
      </div>

      <div
        className="category-filters"
        role="group"
        aria-label="Filter categories"
      >
        {FILTER_OPTIONS.map((option) => (
          <Button
            key={option.value}
            variant={filter === option.value ? "primary" : "secondary"}
            aria-pressed={filter === option.value}
            onClick={() => setFilter(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      {notice ? (
        <div className="category-notice" role="status">
          {notice}
        </div>
      ) : null}

      {panel?.mode === "create" ? (
        <section
          className="category-panel"
          aria-labelledby="create-category-heading"
        >
          <h2 id="create-category-heading">Add category</h2>
          <p className="page-description">
            Give the category a name and choose whether it applies to income
            or expenses.
          </p>
          <CategoryForm
            mode="create"
            onSubmit={async (values) => {
              const created = await createCategoryMutation({
                name: values.name,
                type: values.type,
              });

              handleCreated(created);
            }}
            onCancel={() => setPanel(null)}
          />
        </section>
      ) : null}

      {panel?.mode === "edit" ? (
        <CategoryEditPanel
          categoryId={panel.categoryId}
          onSaved={handleSaved}
          onCancel={() => setPanel(null)}
        />
      ) : null}

      {isLoading ? (
        <LoadingIndicator label="Loading categories…" />
      ) : error && categories === null ? (
        <ErrorState
          title="Unable to load categories"
          message={error}
          action={
            <Button
              variant="secondary"
              onClick={() => void refetch()}
              disabled={isFetching}
            >
              {isFetching ? "Trying again…" : "Try again"}
            </Button>
          }
        />
      ) : categories && categories.length === 0 ? (
        <EmptyState
          title={emptyCopy.title}
          description={emptyCopy.description}
          action={<Button onClick={openCreate}>Add category</Button>}
        />
      ) : categories ? (
        <>
          {error ? (
            <ErrorState
              title="Unable to refresh categories"
              message={`${error} The list below may be out of date.`}
              action={
                <Button
                  variant="secondary"
                  onClick={() => void refetch()}
                  disabled={isFetching}
                >
                  {isFetching ? "Refreshing…" : "Refresh"}
                </Button>
              }
            />
          ) : null}

          <ul className="categories-list">
            {categories.map((category) => (
              <li key={category.id}>
                <CategoryCard
                  category={category}
                  onEdit={openEdit}
                  onDelete={openDelete}
                />
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {deleteTarget ? (
        <DeleteCategoryDialog
          categoryName={deleteTarget.name}
          pending={deletePending}
          error={deleteError}
          onConfirm={() => void confirmDelete()}
          onCancel={closeDelete}
        />
      ) : null}
    </PageContainer>
  );
}
