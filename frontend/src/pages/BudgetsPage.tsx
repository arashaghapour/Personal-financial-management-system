import { useMemo, useState } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";

import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingIndicator } from "../components/ui/LoadingIndicator";
import { PageContainer } from "../components/ui/PageContainer";

import { budgetKeys } from "../features/budgets/api/budget.keys";
import { fetchBudgetProgress } from "../features/budgets/api/budgets.queries";
import { getBudgetErrorMessage } from "../features/budgets/api/error-messages";
import { BudgetCard } from "../features/budgets/components/BudgetCard";
import { BudgetEditPanel } from "../features/budgets/components/BudgetEditPanel";
import { BudgetForm } from "../features/budgets/components/BudgetForm";
import { DeleteBudgetDialog } from "../features/budgets/components/DeleteBudgetDialog";
import {
  useBudgetsQuery,
  useCreateBudgetMutation,
  useDeleteBudgetMutation,
} from "../features/budgets/hooks/useBudgets";
import type { CreateBudgetFormValues } from "../features/budgets/schemas/budget.schemas";
import type { BudgetFilters } from "../features/budgets/types";
import {
  BUDGET_MONTH_OPTIONS,
  formatBudgetPeriod,
} from "../features/budgets/utils/budget-format";
import { categoryKeys } from "../features/categories/api/category.keys";
import { fetchCategories } from "../features/categories/api/categories.queries";

import "../styles/budgets.css";

type Panel =
  | { mode: "create" }
  | { mode: "edit"; budgetId: string; categoryName: string }
  | null;

type DeleteTarget = {
  id: string;
  categoryName: string;
  period: string;
};

const today = new Date();
const initialYear = today.getFullYear();
const initialMonth = today.getMonth() + 1;

export function BudgetsPage() {
  const [year, setYear] = useState(initialYear);
  const [yearDraft, setYearDraft] = useState(String(initialYear));
  const [month, setMonth] = useState(initialMonth);
  const [categoryId, setCategoryId] = useState("");
  const [panel, setPanel] = useState<Panel>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const filters = useMemo<BudgetFilters>(
    () => ({
      year,
      month,
      ...(categoryId ? { categoryId } : {}),
    }),
    [year, month, categoryId],
  );

  const budgetsQuery = useBudgetsQuery(filters);
  const categoriesQuery = useQuery({
    queryKey: categoryKeys.list("EXPENSE"),
    queryFn: () => fetchCategories("EXPENSE"),
  });
  const createMutation = useCreateBudgetMutation();
  const deleteMutation = useDeleteBudgetMutation();

  const categories = useMemo(
    () =>
      (categoriesQuery.data ?? []).filter(
        (category) => category.type === "EXPENSE",
      ),
    [categoriesQuery.data],
  );

  const categoryNames = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );

  const budgets = budgetsQuery.data ?? [];

  const progressQueries = useQueries({
    queries: budgets.map((budget) => ({
      queryKey: budgetKeys.progress(budget.id),
      queryFn: () => fetchBudgetProgress(budget.id),
    })),
  });

  const invalidYear =
    yearDraft.trim() === "" ||
    !/^\d+$/.test(yearDraft) ||
    Number(yearDraft) < 1;

  const handleYearChange = (value: string) => {
    setYearDraft(value);
    setNotice(null);

    if (value.trim() === "") {
      return;
    }

    const parsed = Number(value);

    if (Number.isInteger(parsed) && parsed >= 1) {
      setYear(parsed);
    }
  };

  const handleMonthChange = (value: string) => {
    setMonth(Number(value));
    setNotice(null);
  };

  const handleCategoryFilterChange = (value: string) => {
    setCategoryId(value);
    setNotice(null);
  };

  const openCreatePanel = () => {
    setPanel({ mode: "create" });
    setDeleteTarget(null);
    setNotice(null);
  };

  const openEditPanel = (budgetId: string, categoryName: string) => {
    setPanel({ mode: "edit", budgetId, categoryName });
    setDeleteTarget(null);
    setNotice(null);
  };

  const openDeleteDialog = (target: DeleteTarget) => {
    deleteMutation.reset();
    setDeleteTarget(target);
    setNotice(null);
  };

  const handleCreate = async (values: CreateBudgetFormValues) => {
    await createMutation.mutateAsync(values);
    setPanel(null);
    setNotice("Budget created.");
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      setNotice("Budget deleted.");
    } catch {
      // The dialog renders the mapped mutation error below.
    }
  };

  const renderBudgetList = () => {
    if (budgetsQuery.isLoading) {
      return <LoadingIndicator label="Loading budgets..." />;
    }

    if (budgetsQuery.isError) {
      return (
        <ErrorState
          title="Unable to load budgets"
          message={getBudgetErrorMessage(budgetsQuery.error)}
          action={
            <Button
              variant="secondary"
              onClick={() => void budgetsQuery.refetch()}
            >
              Try again
            </Button>
          }
        />
      );
    }

    if (budgets.length === 0) {
      return (
        <EmptyState
          title="No budgets for this period"
          description="Create a budget to start tracking spending for this month."
          action={
            <Button onClick={openCreatePanel}>Create your first budget</Button>
          }
        />
      );
    }

    return (
      <div className="budgets-list">
        {budgets.map((budget, index) => {
          const progressResult = progressQueries[index];
          const categoryName =
            categoryNames.get(budget.categoryId) ?? "Unknown category";

          return (
            <BudgetCard
              key={budget.id}
              budget={budget}
              categoryName={categoryName}
              progress={progressResult?.data}
              isProgressLoading={progressResult?.isLoading ?? true}
              progressError={
                progressResult?.isError
                  ? getBudgetErrorMessage(progressResult.error)
                  : null
              }
              onRetryProgress={() => void progressResult?.refetch()}
              onEdit={() => openEditPanel(budget.id, categoryName)}
              onDelete={() =>
                openDeleteDialog({
                  id: budget.id,
                  categoryName,
                  period: formatBudgetPeriod(budget.year, budget.month),
                })
              }
            />
          );
        })}
      </div>
    );
  };

  return (
    <PageContainer className="budgets-page">
      <header className="page-header">
        <div>
          <h1>Budgets</h1>
          <p className="page-description">
            Set monthly spending limits by expense category and track your
            progress.
          </p>
        </div>
        <Button onClick={openCreatePanel}>Add budget</Button>
      </header>

      {notice ? (
        <p className="budget-notice" role="status">
          {notice}
        </p>
      ) : null}

      <section className="budget-filters" aria-label="Budget filters">
        <div className="form-field">
          <label htmlFor="budget-filter-month">Filter month</label>
          <select
            id="budget-filter-month"
            value={month}
            onChange={(event) => handleMonthChange(event.target.value)}
          >
            {BUDGET_MONTH_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="budget-filter-year">Filter year</label>
          <input
            id="budget-filter-year"
            type="number"
            min="1"
            step="1"
            inputMode="numeric"
            value={yearDraft}
            aria-invalid={invalidYear ? true : undefined}
            aria-describedby={
              invalidYear ? "budget-filter-year-error" : undefined
            }
            onChange={(event) => handleYearChange(event.target.value)}
          />
          {invalidYear ? (
            <p
              id="budget-filter-year-error"
              className="form-field-error"
              role="alert"
            >
              Enter a valid year.
            </p>
          ) : null}
        </div>

        <div className="form-field">
          <label htmlFor="budget-filter-category">Filter category</label>
          <select
            id="budget-filter-category"
            value={categoryId}
            onChange={(event) =>
              handleCategoryFilterChange(event.target.value)
            }
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {categoriesQuery.isError ? (
            <p className="form-field-error" role="alert">
              Unable to load expense categories.
            </p>
          ) : null}
        </div>
      </section>

      {panel?.mode === "create" ? (
        <section className="budget-panel" aria-labelledby="add-budget-heading">
          <h2 id="add-budget-heading">Add budget</h2>
          <p className="page-description">
            Choose an expense category, amount, and monthly period.
          </p>
          <BudgetForm
            categories={categories}
            categoriesLoading={categoriesQuery.isLoading}
            categoriesError={
              categoriesQuery.isError
                ? getBudgetErrorMessage(categoriesQuery.error)
                : null
            }
            defaultPeriod={{ year, month }}
            onSubmit={handleCreate}
            onCancel={() => setPanel(null)}
          />
        </section>
      ) : null}

      {panel?.mode === "edit" ? (
        <BudgetEditPanel
          budgetId={panel.budgetId}
          categoryName={panel.categoryName}
          onSaved={() => {
            setPanel(null);
            setNotice("Budget updated.");
          }}
          onCancel={() => setPanel(null)}
        />
      ) : null}

      {renderBudgetList()}

      {deleteTarget ? (
        <DeleteBudgetDialog
          categoryName={deleteTarget.categoryName}
          period={deleteTarget.period}
          pending={deleteMutation.isPending}
          error={
            deleteMutation.error
              ? getBudgetErrorMessage(deleteMutation.error)
              : null
          }
          onConfirm={() => void handleDelete()}
          onCancel={() => setDeleteTarget(null)}
        />
      ) : null}
    </PageContainer>
  );
}

export default BudgetsPage;
