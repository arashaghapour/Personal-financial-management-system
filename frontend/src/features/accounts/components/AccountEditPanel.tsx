import { Button } from "../../../components/ui/Button";
import { ErrorState } from "../../../components/ui/ErrorState";
import { LoadingIndicator } from "../../../components/ui/LoadingIndicator";

import { updateAccountMutation } from "../api/accounts.queries";
import { useAccountQuery } from "../hooks/useAccount";

import type { Account } from "../types";

import { AccountForm } from "./AccountForm";

type AccountEditPanelProps = {
  accountId: number;
  onSaved: (account: Account) => void;
  onCancel: () => void;
};

export function AccountEditPanel({
  accountId,
  onSaved,
  onCancel,
}: AccountEditPanelProps) {
  const { account, isLoading, error, refetch } = useAccountQuery(accountId);

  if (isLoading) {
    return (
      <section className="account-panel" aria-label="Edit account">
        <LoadingIndicator label="Loading account…" />
      </section>
    );
  }

  if (error || !account) {
    return (
      <section className="account-panel" aria-label="Edit account">
        <ErrorState
          title="Unable to load account"
          message={error ?? "This account could not be found."}
          action={
            <Button variant="secondary" onClick={() => void refetch()}>
              Try again
            </Button>
          }
        />
        <div className="account-form-actions">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="account-panel" aria-labelledby="edit-account-heading">
      <h2 id="edit-account-heading">Edit account</h2>
      <p className="page-description">
        Update the account name or type. The current balance is managed by
        transactions and cannot be edited here.
      </p>
      <AccountForm
        mode="edit"
        initialValues={{ name: account.name, type: account.type }}
        onSubmit={async (values) => {
          const updated = await updateAccountMutation(accountId, {
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
