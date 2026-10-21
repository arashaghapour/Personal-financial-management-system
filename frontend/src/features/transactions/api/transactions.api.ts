import { apiRequest } from "../../../lib/api/client";

import type {
  CreateTransactionRequest,
  PaginatedTransactions,
  Transaction,
  TransactionFilters,
  UpdateTransactionRequest,
} from "../types";

/**
 * Transactions API functions.
 *
 * Requests go through the shared API client so the configured base URL,
 * authentication header, and error envelope handling stay consistent.
 * `requestWithAuth` in ./transactions.queries.ts attaches the access token.
 */

const appendQueryValue = (
  params: URLSearchParams,
  key: string,
  value: string | number | undefined,
): void => {
  if (value !== undefined) {
    params.set(key, String(value));
  }
};

export const buildTransactionQuery = (
  filters: TransactionFilters = {},
): string => {
  const params = new URLSearchParams();

  appendQueryValue(params, "type", filters.type);
  appendQueryValue(params, "accountId", filters.accountId);
  appendQueryValue(params, "categoryId", filters.categoryId);
  appendQueryValue(params, "startDate", filters.startDate);
  appendQueryValue(params, "endDate", filters.endDate);
  appendQueryValue(params, "minAmount", filters.minAmount);
  appendQueryValue(params, "maxAmount", filters.maxAmount);
  appendQueryValue(params, "page", filters.page);
  appendQueryValue(params, "limit", filters.limit);
  appendQueryValue(params, "sort", filters.sort);

  const query = params.toString();

  return query ? `?${query}` : "";
};

export const getTransactions = (
  accessToken: string,
  filters: TransactionFilters = {},
): Promise<PaginatedTransactions> =>
  apiRequest<PaginatedTransactions>(
    `/transactions${buildTransactionQuery(filters)}`,
    { accessToken },
  );

export const getTransaction = (
  accessToken: string,
  id: string,
): Promise<Transaction> =>
  apiRequest<Transaction>(`/transactions/${id}`, { accessToken });

export const createTransaction = (
  accessToken: string,
  data: CreateTransactionRequest,
): Promise<Transaction> =>
  apiRequest<Transaction>("/transactions", {
    method: "POST",
    accessToken,
    body: data,
  });

export const updateTransaction = (
  accessToken: string,
  id: string,
  data: UpdateTransactionRequest,
): Promise<Transaction> =>
  apiRequest<Transaction>(`/transactions/${id}`, {
    method: "PATCH",
    accessToken,
    body: data,
  });

export const deleteTransaction = (
  accessToken: string,
  id: string,
): Promise<void> =>
  apiRequest<void>(`/transactions/${id}`, {
    method: "DELETE",
    accessToken,
  });
