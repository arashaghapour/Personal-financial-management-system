import { Button } from "../../../components/ui/Button";

import type { Transaction } from "../types";
import {
  formatTransactionAmount,
  formatTransactionDate,
} from "../utils/transaction-format";

type TransactionCardProps = {
  transaction: Transaction;
  accountName: string;
  categoryName: string;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
};

export function TransactionCard({
  transaction,
  accountName,
  categoryName,
  onEdit,
  onDelete,
}: TransactionCardProps) {
  const title = transaction.description?.trim() || "Untitled transaction";
  const headingId = `transaction-${transaction.id}-title`;

  return (
    <article className="transaction-card" aria-labelledby={headingId}>
      <div className="transaction-card-header">
        <h2 id={headingId} className="transaction-card-title">
          {title}
        </h2>
        <span
          className={`transaction-type transaction-type--${transaction.type.toLowerCase()}`}
        >
          {transaction.type}
        </span>
      </div>

      <p
        className={`transaction-amount transaction-amount--${transaction.type.toLowerCase()}`}
      >
        {formatTransactionAmount(transaction.type, transaction.amount)}
      </p>

      <dl className="transaction-card-meta">
        <div>
          <dt>Date</dt>
          <dd>{formatTransactionDate(transaction.date)}</dd>
        </div>
        <div>
          <dt>Account</dt>
          <dd>{accountName}</dd>
        </div>
        <div>
          <dt>Category</dt>
          <dd>{categoryName}</dd>
        </div>
      </dl>

      <div className="transaction-card-actions">
        <Button
          variant="secondary"
          onClick={() => onEdit(transaction)}
          aria-label={`Edit ${title}`}
        >
          Edit
        </Button>
        <Button
          variant="danger"
          onClick={() => onDelete(transaction)}
          aria-label={`Delete ${title}`}
        >
          Delete
        </Button>
      </div>
    </article>
  );
}
