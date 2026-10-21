import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingIndicator } from "../components/ui/LoadingIndicator";
import { PageContainer } from "../components/ui/PageContainer";

import { accountKeys } from "../features/accounts/api/account.keys";
import { fetchAccounts } from "../features/accounts/api/accounts.queries";

import { fetchCategories } from "../features/categories/api/categories.queries";
import { categoryKeys } from "../features/categories/api/category.keys";

import { getTransactionErrorMessage } from "../features/transactions/api/error-messages";
import { DeleteTransactionDialog } from "../features/transactions/components/DeleteTransactionDialog";
import { TransactionCard } from "../features/transactions/components/TransactionCard";
import { TransactionEditPanel } from "../features/transactions/components/TransactionEditPanel";
import { TransactionFilters } from "../features/transactions/components/TransactionFilters";
import { TransactionForm } from "../features/transactions/components/TransactionForm";
import {
  useCreateTransactionMutation,
  useDeleteTransactionMutation,
  useTransactionsQuery,
} from "../features/transactions/hooks/useTransactions";
import {
  emptyTransactionFilterDraft,
  transactionFilterDraftSchema,
  type TransactionFilterDraft,
} from "../features/transactions/schemas/transaction.schemas";
import type {
  Transaction,
  TransactionSort,
} from "../features/transactions/types";
import {
  getTransactionFilterErrors,
  hasActiveFilters,
  toTransactionFilters,
} from "../features/transactions/utils/transaction-filters";

import "../styles/transactions.css";

type PanelState =
  | { mode: "create" }
  | { mode: "edit"; transactionId: string }
  | null;

export default function TransactionsPage() {
  const accountsQuery = useQuery({
    queryKey: accountKeys.list(),
    queryFn: fetchAccounts,
  });

  const categoriesQuery = useQuery({
    queryKey: categoryKeys.list(),
    queryFn: () => fetchCategories(),
  });

  const accounts = accountsQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];

  const [draft, setDraft] = useState<TransactionFilterDraft>({
    ...emptyTransactionFilterDraft,
  });
  const [appliedDraft, setAppliedDraft] = useState<TransactionFilterDraft>({
    ...emptyTransactionFilterDraft,
  });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [sort, setSort] = useState<TransactionSort>("date_desc");

  const [panel, setPanel] = useState<PanelState>(null);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const filterErrors = getTransactionFilterErrors(draft);

  const filters = toTransactionFilters(appliedDraft, { page, limit, sort });

  const transactionsQuery = useTransactionsQuery(filters);
  const createMutation = useCreateTransactionMutation();
  const deleteMutation = useDeleteTransactionMutation();

  const transactions = transactionsQuery.data?.data ?? [];
  const pagination = transactionsQuery.data?.pagination;

  const accountNames = new Map(
    accounts.map((account) => [account.id, account.name]),
  );
  const categoryNames = new Map(
    categories.map((category) => [category.id, category.name]),
  );

  const filterErrorMessage = (isError: boolean, resource: string): string | null =>
    isError ? `Unable to load ${resource}` : null;

  const accountsError = filterErrorMessage(
    accountsQuery.isError,
    "accounts",
  );
  const categoriesError = filterErrorMessage(
    categoriesQuery.isError,
    "categories",
  );

  const optionsLoading = accountsQuery.isLoading || categoriesQuery.isLoading;

  const handleFilterChange = (patch: Partial<TransactionFilterDraft>) => {
    const next = { ...draft, ...patch };

    if (patch.type !== undefined && patch.type !== "ALL") {
      const selectedCategory = categories.find(
        (category) => category.id === next.categoryId,
      );

      if (selectedCategory && selectedCategory.type !== patch.type) {
        next.categoryId = "";
      }
    }

    setDraft(next);
    setPage(1);
    setNotice(null);

    if (transactionFilterDraftSchema.safeParse(next).success) {
      setAppliedDraft(next);
    }
  };

  const handleSortChange = (nextSort: TransactionSort) => {
    setPage(1);
    setNotice(null);
    setSort(nextSort);
  };

  const handleLimitChange = (nextLimit: number) => {
    setPage(1);
    setNotice(null);
    setLimit(nextLimit);
  };

  const openCreate = () => {
    setNotice(null);
    setPanel({ mode: "create" });
  };

  const openEdit = (transaction: Transaction) => {
    setNotice(null);
    setPanel({ mode: "edit", transactionId: transaction.id });
  };

  const openDelete = (transaction: Transaction) => {
    setNotice(null);
    setDeleteError(null);
    setDeleteTarget(transaction);
  };

  const closeDelete = () => {
    if (deleteMutation.isPending) {
      return;
    }

    setDeleteError(null);
    setDeleteTarget(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    setDeleteError(null);

    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      setNotice("Transaction deleted.");
    } catch (error) {
      setDeleteError(getTransactionErrorMessage(error));
    }
  };

  const isInitialLoading = transactionsQuery.isLoading;
  const showError = transactionsQuery.isError && !transactionsQuery.data;

  return (
    <PageContainer className="transactions-page">
      <div className="page-header">
        <div>
          <h1>Transactions</h1>
          <p className="page-description">
            Record income and expenses, then filter and sort them to understand
            where your money goes.
          </p>
        </div>
        <Button onClick={openCreate} disabled={panel?.mode === "create"}>
          Add transaction
        </Button>
      </div>

      {notice ? (
        <div className="transaction-notice" role="status">
          {notice}
        </div>
      ) : null}

      {panel?.mode === "create" ? (
        <section
          className="transaction-panel"
          aria-labelledby="create-transaction-heading"
        >
          <h2 id="create-transaction-heading">Add transaction</h2>
          <p className="page-description">
            Choose a type, enter the details, and link the transaction to an
            account and category.
          </p>
          <TransactionForm
            mode="create"
            accounts={accounts}
            categories={categories}
            optionsLoading={optionsLoading}
            accountsError={accountsError}
            categoriesError={categoriesError}
            onSubmit={async (values) => {
              await createMutation.mutateAsync({
                type: values.type,
                amount: values.amount,
                ...(values.description
                  ? { description: values.description }
                  : {}),
                date: values.date,
                accountId: values.accountId,
                categoryId: values.categoryId,
              });

              setPanel(null);
              setNotice("Transaction created.");
            }}
            onCancel={() => setPanel(null)}
          />
        </section>
      ) : null}

      {panel?.mode === "edit" ? (
        <TransactionEditPanel
          transactionId={panel.transactionId}
          accounts={accounts}
          categories={categories}
          optionsLoading={optionsLoading}
          accountsError={accountsError}
          categoriesError={categoriesError}
          onSaved={() => {
            setPanel(null);
            setNotice("Transaction updated.");
          }}
          onCancel={() => setPanel(null)}
        />
      ) : null}

      <TransactionFilters
        draft={draft}
        errors={filterErrors}
        accounts={accounts}
        categories={categories}
        sort={sort}
        limit={limit}
        onChange={handleFilterChange}
        onSortChange={handleSortChange}
        onLimitChange={handleLimitChange}
      />

      {isInitialLoading ? (
        <LoadingIndicator label="Loading transactions" />
      ) : showError ? (
        <ErrorState
          title="Unable to load transactions"
          message={getTransactionErrorMessage(transactionsQuery.error)}
          action={
            <Button
              variant="secondary"
              onClick={() => void transactionsQuery.refetch()}
              disabled={transactionsQuery.isFetching}
            >
              Try again
            </Button>
          }
        />
      ) : transactions.length === 0 ? (
        <EmptyState
          title={
            hasActiveFilters(appliedDraft)
              ? "No transactions match your filters"
              : "No transactions yet"
          }
          description={
            hasActiveFilters(appliedDraft)
              ? "Try clearing or widening the filters to see more results."
              : "Add your first transaction to start tracking your money."
          }
          action={
            hasActiveFilters(appliedDraft) ? undefined : (
              <Button onClick={openCreate}>Add transaction</Button>
            )
          }
        />
      ) : (
        <>
          <ul className="transactions-list">
            {transactions.map((transaction) => (
              <li key={transaction.id}>
                <TransactionCard
                  transaction={transaction}
                  accountName={
                    accountNames.get(transaction.accountId) ??
                    "Unknown account"
                  }
                  categoryName={
                    categoryNames.get(transaction.categoryId) ??
                    "Unknown category"
                  }
                  onEdit={openEdit}
                  onDelete={openDelete}
                />
              </li>
            ))}
          </ul>

          {pagination && pagination.totalPages > 1 ? (
            <nav
              className="transaction-pagination"
              aria-label="Transaction pagination"
            >
              <Button
                variant="secondary"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={pagination.page <= 1}
              >
                Previous page
              </Button>
              <span className="transaction-pagination-status">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="secondary"
                onClick={() => setPage((current) => current + 1)}
                disabled={pagination.page >= pagination.totalPages}
              >
                Next page
              </Button>
            </nav>
          ) : null}
        </>
      )}

      {deleteTarget ? (
        <DeleteTransactionDialog
          title={deleteTarget.description?.trim() || "Untitled transaction"}
          pending={deleteMutation.isPending}
          error={deleteError}
          onConfirm={() => void confirmDelete()}
          onCancel={closeDelete}
        />
      ) : null}
    </PageContainer>
  );
}
