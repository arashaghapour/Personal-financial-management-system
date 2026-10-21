import { Button } from "../../../components/ui/Button";

import type { Account } from "../types";
import { formatAccountType, formatCurrency } from "../utils/account-format";

type AccountCardProps = {
  account: Account;
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
};

export function AccountCard({ account, onEdit, onDelete }: AccountCardProps) {
  const headingId = `account-${account.id}-name`;

  return (
    <article className="account-card" aria-labelledby={headingId}>
      <div className="account-card-header">
        <h2 id={headingId} className="account-card-name">
          {account.name}
        </h2>
      </div>

      <dl className="account-card-meta">
        <div>
          <dt>Type</dt>
          <dd>{formatAccountType(account.type)}</dd>
        </div>
        <div>
          <dt>Current balance</dt>
          <dd>{formatCurrency(account.balance)}</dd>
        </div>
      </dl>

      <div className="account-card-actions">
        <Button
          variant="secondary"
          onClick={() => onEdit(account)}
          aria-label={`Edit ${account.name}`}
        >
          Edit
        </Button>
        <Button
          variant="danger"
          onClick={() => onDelete(account)}
          aria-label={`Delete ${account.name}`}
        >
          Delete
        </Button>
      </div>
    </article>
  );
}
