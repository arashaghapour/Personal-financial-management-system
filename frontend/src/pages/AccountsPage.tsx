import { useState } from "react";

import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingIndicator } from "../components/ui/LoadingIndicator";
import { PageContainer } from "../components/ui/PageContainer";

import { AccountCard } from "../features/accounts/components/AccountCard";
import { AccountEditPanel } from "../features/accounts/components/AccountEditPanel";
import { AccountForm } from "../features/accounts/components/AccountForm";
import { DeleteAccountDialog } from "../features/accounts/components/DeleteAccountDialog";

import {
  createAccountMutation,
  deleteAccountMutation,
} from "../features/accounts/api/accounts.queries";
import { getDeleteAccountErrorMessage } from "../features/accounts/api/error-messages";
import { useAccountsQuery } from "../features/accounts/hooks/useAccounts";

import type { Account } from "../features/accounts/types";

import "../styles/accounts.css";

type PanelState =
  | { mode: "create" }
  | { mode: "edit"; accountId: number }
  | null;

export default function AccountsPage() {
  const {
    accounts,
    isLoading,
    isFetching,
    error,
    refetch,
    addAccount,
    replaceAccount,
    removeAccount,
  } = useAccountsQuery();

  const [panel, setPanel] = useState<PanelState>(null);
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const openCreate = () => {
    setNotice(null);
    setPanel({ mode: "create" });
  };

  const openEdit = (account: Account) => {
    setNotice(null);
    setPanel({ mode: "edit", accountId: account.id });
  };

  const openDelete = (account: Account) => {
    setNotice(null);
    setDeleteError(null);
    setDeleteTarget(account);
  };

  const closeDelete = () => {
    if (deletePending) {
      return;
    }

    setDeleteError(null);
    setDeleteTarget(null);
  };

  const handleCreated = (account: Account) => {
    addAccount(account);
    setPanel(null);
    setNotice("Account created.");
    void refetch();
  };

  const handleSaved = (account: Account) => {
    replaceAccount(account);
    setPanel(null);
    setNotice("Account updated.");
    void refetch();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    const accountId = deleteTarget.id;

    setDeletePending(true);
    setDeleteError(null);

    try {
      await deleteAccountMutation(accountId);
      removeAccount(accountId);
      setDeleteTarget(null);
      setNotice("Account deleted.");
      await refetch();
    } catch (caught) {
      setDeleteError(getDeleteAccountErrorMessage(caught));
    } finally {
      setDeletePending(false);
    }
  };

  return (
    <PageContainer className="accounts-page">
      <div className="page-header">
        <div>
          <h1>Accounts</h1>
          <p className="page-description">
            Manage the accounts that hold your money and track their current
            balances.
          </p>
        </div>
        <Button onClick={openCreate} disabled={panel?.mode === "create"}>
          Add account
        </Button>
      </div>

      {notice ? (
        <div className="account-notice" role="status">
          {notice}
        </div>
      ) : null}

      {panel?.mode === "create" ? (
        <section
          className="account-panel"
          aria-labelledby="create-account-heading"
        >
          <h2 id="create-account-heading">Add account</h2>
          <p className="page-description">
            Give the account a name and choose the type that best describes it.
          </p>
          <AccountForm
            mode="create"
            onSubmit={async (values) => {
              const created = await createAccountMutation({
                name: values.name,
                type: values.type,
                initialBalance: values.initialBalance ?? 0,
              });

              handleCreated(created);
            }}
            onCancel={() => setPanel(null)}
          />
        </section>
      ) : null}

      {panel?.mode === "edit" ? (
        <AccountEditPanel
          accountId={panel.accountId}
          onSaved={handleSaved}
          onCancel={() => setPanel(null)}
        />
      ) : null}

      {isLoading ? (
        <LoadingIndicator label="Loading accounts…" />
      ) : error && accounts === null ? (
        <ErrorState
          title="Unable to load accounts"
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
      ) : accounts && accounts.length === 0 ? (
        <EmptyState
          title="No accounts yet"
          description="Add your first account to start tracking your finances."
          action={<Button onClick={openCreate}>Add account</Button>}
        />
      ) : accounts ? (
        <>
          {error ? (
            <ErrorState
              title="Unable to refresh accounts"
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

          <ul className="accounts-list">
            {accounts.map((account) => (
              <li key={account.id}>
                <AccountCard
                  account={account}
                  onEdit={openEdit}
                  onDelete={openDelete}
                />
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {deleteTarget ? (
        <DeleteAccountDialog
          accountName={deleteTarget.name}
          pending={deletePending}
          error={deleteError}
          onConfirm={() => void confirmDelete()}
          onCancel={closeDelete}
        />
      ) : null}
    </PageContainer>
  );
}
