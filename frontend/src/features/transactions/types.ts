/**
 * Transaction types mirroring the backend contract
 * (see docs/OpenAPI.yml and backend/src/modules/transaction/transaction.schema.ts).
 */

export const TRANSACTION_TYPES = ["INCOME", "EXPENSE"] as const;

export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const TRANSACTION_TYPE_FILTERS = ["ALL", ...TRANSACTION_TYPES] as const;

export type TransactionTypeFilter = (typeof TRANSACTION_TYPE_FILTERS)[number];

export const TRANSACTION_SORTS = [
  "date_asc",
  "date_desc",
  "amount_asc",
  "amount_desc",
  "createdAt_asc",
  "createdAt_desc",
] as const;

export type TransactionSort = (typeof TRANSACTION_SORTS)[number];

/**
 * Transaction returned by the backend. `amount` is a Prisma Decimal serialized
 * as a numeric string, while account and category are exposed only as IDs.
 */
export type Transaction = {
  id: string;
  userId: number;
  type: TransactionType;
  amount: number | string;
  description: string | null;
  date: string;
  accountId: number;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
};

export type TransactionPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

/** GET /api/transactions response. Never a bare array. */
export type PaginatedTransactions = {
  data: Transaction[];
  pagination: TransactionPagination;
};

/**
 * Supported filters. `userId` is deliberately absent: the backend derives it
 * from the access token and rejects unknown query parameters.
 */
export type TransactionFilters = {
  type?: TransactionType;
  accountId?: number;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  limit?: number;
  sort?: TransactionSort;
};

/** POST /api/transactions request body. */
export type CreateTransactionRequest = {
  type: TransactionType;
  amount: number;
  description?: string;
  date: string;
  accountId: number;
  categoryId: string;
};

/**
 * PATCH /api/transactions/:id request body. Transaction type cannot be
 * changed and `id`, `userId`, and timestamps are managed by the backend.
 */
export type UpdateTransactionRequest = {
  amount?: number;
  description?: string | null;
  date?: string;
  accountId?: number;
  categoryId?: string;
};

export type TransactionFormSubmitValues = {
  type: TransactionType;
  amount: number;
  description: string | null | undefined;
  date: string;
  accountId: number;
  categoryId: string;
};
