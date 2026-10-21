import { Link } from "react-router-dom";

import { EmptyState } from "../../../components/ui/EmptyState";
import {
  formatTransactionAmount,
  formatTransactionDate,
} from "../../transactions/utils/transaction-format";

import type { Account } from "../../accounts/types";
import type { Category } from "../../categories/types";
import type { Transaction } from "../../transactions/types";

type DashboardRecentTransactionsProps = {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
};

const accountLabel = (accountsById: Map<number, string>, id: number) =>
  accountsById.get(id) ?? `Account #${id}`;

const categoryLabel = (categoriesById: Map<string, string>, id: string) =>
  categoriesById.get(id) ?? "Unknown category";

/**
 * The backend returns the latest matching transactions already ordered. This
 * component deliberately preserves that order and only maps IDs to names.
 */
export function DashboardRecentTransactions({
  transactions,
  accounts,
  categories,
}: DashboardRecentTransactionsProps) {
  const accountsById = new Map(
    accounts.map((account) => [account.id, account.name]),
  );
  const categoriesById = new Map(
    categories.map((category) => [category.id, category.name]),
  );

  return (
    <section
      className="dashboard-panel dashboard-recent-transactions"
      aria-labelledby="dashboard-recent-transactions-heading"
    >
      <div className="dashboard-panel-heading">
        <h2 id="dashboard-recent-transactions-heading">
          Recent transactions
        </h2>
        <Link className="dashboard-panel-link" to="/transactions">
          View all transactions
        </Link>
      </div>

      {transactions.length === 0 ? (
        <EmptyState
          title="No recent transactions"
          description="No transactions match this date range."
        />
      ) : (
        <ul
          className="dashboard-transaction-list"
          aria-label="Recent transactions list"
        >
          {transactions.map((transaction) => {
            const description =
              transaction.description?.trim() || "Untitled transaction";
            const typeLabel =
              transaction.type === "INCOME" ? "Income" : "Expense";

            return (
              <li className="dashboard-transaction" key={transaction.id}>
                <div className="dashboard-transaction-main">
                  <p className="dashboard-transaction-description">
                    {description}
                  </p>
                  <p className="dashboard-transaction-meta">
                    <span>{formatTransactionDate(transaction.date)}</span>
                    <span aria-hidden="true"> &middot; </span>
                    <span>
                      {accountLabel(accountsById, transaction.accountId)}
                    </span>
                    <span aria-hidden="true"> &middot; </span>
                    <span>
                      {categoryLabel(categoriesById, transaction.categoryId)}
                    </span>
                    <span className="dashboard-transaction-type">
                      {typeLabel}
                    </span>
                  </p>
                </div>
                <p
                  className={`dashboard-transaction-amount dashboard-transaction-amount--${transaction.type.toLowerCase()}`}
                >
                  {formatTransactionAmount(transaction.type, transaction.amount)}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
