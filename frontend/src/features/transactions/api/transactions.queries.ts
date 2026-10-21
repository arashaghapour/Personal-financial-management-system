import { requestWithAuth } from "../../auth/api/auth-client";

import {
  createTransaction,
  deleteTransaction,
  getTransaction,
  getTransactions,
  updateTransaction,
} from "./transactions.api";

import type {
  CreateTransactionRequest,
  PaginatedTransactions,
  Transaction,
  TransactionFilters,
  UpdateTransactionRequest,
} from "../types";

/**
 * Reusable authenticated transaction queries and mutations.
 *
 * The access token is never handled by components: requestWithAuth attaches
 * the current token and performs a single refresh/retry when necessary.
 */

export const fetchTransactions = (
  filters: TransactionFilters = {},
): Promise<PaginatedTransactions> =>
  requestWithAuth((accessToken) => getTransactions(accessToken, filters));

export const fetchTransaction = (id: string): Promise<Transaction> =>
  requestWithAuth((accessToken) => getTransaction(accessToken, id));

export const createTransactionMutation = (
  data: CreateTransactionRequest,
): Promise<Transaction> =>
  requestWithAuth((accessToken) => createTransaction(accessToken, data));

export const updateTransactionMutation = (
  id: string,
  data: UpdateTransactionRequest,
): Promise<Transaction> =>
  requestWithAuth((accessToken) => updateTransaction(accessToken, id, data));

export const deleteTransactionMutation = (id: string): Promise<void> =>
  requestWithAuth((accessToken) => deleteTransaction(accessToken, id));
