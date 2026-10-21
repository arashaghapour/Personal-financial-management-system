import type { Account } from "../../accounts/types";
import type { Category } from "../../categories/types";

import type { TransactionFilterDraft } from "../schemas/transaction.schemas";
import {
  TRANSACTION_TYPE_FILTERS,
  type TransactionSort,
} from "../types";
import type { TransactionFilterErrors } from "../utils/transaction-filters";

const SORT_OPTIONS: Array<{ value: TransactionSort; label: string }> = [
  { value: "date_desc", label: "Newest first" },
  { value: "date_asc", label: "Oldest first" },
  { value: "amount_desc", label: "Amount: high to low" },
  { value: "amount_asc", label: "Amount: low to high" },
  { value: "createdAt_desc", label: "Recently added" },
  { value: "createdAt_asc", label: "Oldest added" },
];

const TYPE_LABELS: Record<(typeof TRANSACTION_TYPE_FILTERS)[number], string> = {
  ALL: "All types",
  INCOME: "Income",
  EXPENSE: "Expense",
};

const PER_PAGE_OPTIONS = [10, 20, 50];

type TransactionFiltersProps = {
  draft: TransactionFilterDraft;
  errors: TransactionFilterErrors;
  accounts: Account[];
  categories: Category[];
  sort: TransactionSort;
  limit: number;
  onChange: (patch: Partial<TransactionFilterDraft>) => void;
  onSortChange: (sort: TransactionSort) => void;
  onLimitChange: (limit: number) => void;
};

const filterCategories = (
  categories: Category[],
  type: TransactionFilterDraft["type"],
): Category[] =>
  type === "ALL"
    ? categories
    : categories.filter((category) => category.type === type);

export function TransactionFilters({
  draft,
  errors,
  accounts,
  categories,
  sort,
  limit,
  onChange,
  onSortChange,
  onLimitChange,
}: TransactionFiltersProps) {
  const visibleCategories = filterCategories(categories, draft.type);

  return (
    <section className="transaction-filters" aria-label="Transaction filters">
      <div className="transaction-filters-grid">
        <div className="form-field">
          <label htmlFor="transaction-filter-type">Filter type</label>
          <select
            id="transaction-filter-type"
            value={draft.type}
            onChange={(event) =>
              onChange({
                type: event.target
                  .value as TransactionFilterDraft["type"],
              })
            }
          >
            {TRANSACTION_TYPE_FILTERS.map((type) => (
              <option key={type} value={type}>
                {TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="transaction-filter-account">Filter account</label>
          <select
            id="transaction-filter-account"
            value={draft.accountId}
            onChange={(event) => onChange({ accountId: event.target.value })}
          >
            <option value="">All accounts</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="transaction-filter-category">Filter category</label>
          <select
            id="transaction-filter-category"
            value={draft.categoryId}
            onChange={(event) => onChange({ categoryId: event.target.value })}
          >
            <option value="">All categories</option>
            {visibleCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="transaction-filter-start-date">From date</label>
          <input
            id="transaction-filter-start-date"
            type="date"
            value={draft.startDate}
            aria-invalid={errors.startDate ? true : undefined}
            aria-describedby={
              errors.startDate
                ? "transaction-filter-start-date-error"
                : undefined
            }
            onChange={(event) => onChange({ startDate: event.target.value })}
          />
          {errors.startDate ? (
            <p
              id="transaction-filter-start-date-error"
              className="form-field-error"
              role="alert"
            >
              {errors.startDate}
            </p>
          ) : null}
        </div>

        <div className="form-field">
          <label htmlFor="transaction-filter-end-date">To date</label>
          <input
            id="transaction-filter-end-date"
            type="date"
            value={draft.endDate}
            onChange={(event) => onChange({ endDate: event.target.value })}
          />
        </div>

        <div className="form-field">
          <label htmlFor="transaction-filter-min-amount">Minimum amount</label>
          <input
            id="transaction-filter-min-amount"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={draft.minAmount}
            aria-invalid={errors.minAmount ? true : undefined}
            aria-describedby={
              errors.minAmount
                ? "transaction-filter-min-amount-error"
                : undefined
            }
            onChange={(event) => onChange({ minAmount: event.target.value })}
          />
          {errors.minAmount ? (
            <p
              id="transaction-filter-min-amount-error"
              className="form-field-error"
              role="alert"
            >
              {errors.minAmount}
            </p>
          ) : null}
        </div>

        <div className="form-field">
          <label htmlFor="transaction-filter-max-amount">Maximum amount</label>
          <input
            id="transaction-filter-max-amount"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={draft.maxAmount}
            onChange={(event) => onChange({ maxAmount: event.target.value })}
          />
        </div>

        <div className="form-field">
          <label htmlFor="transaction-filter-sort">Sort by</label>
          <select
            id="transaction-filter-sort"
            value={sort}
            onChange={(event) =>
              onSortChange(event.target.value as TransactionSort)
            }
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="transaction-filter-limit">Per page</label>
          <select
            id="transaction-filter-limit"
            value={limit}
            onChange={(event) => onLimitChange(Number(event.target.value))}
          >
            {PER_PAGE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
}
