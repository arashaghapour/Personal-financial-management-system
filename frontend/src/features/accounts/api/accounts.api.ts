import { apiRequest } from "../../../lib/api/client";

import type {
  Account,
  CreateAccountRequest,
  UpdateAccountRequest,
} from "../types";

/**
 * Accounts API functions.
 *
 * Requests go through the shared API client so the configured base URL and
 * error envelope handling stay consistent. Authentication is attached by the
 * callers in ./accounts.queries.ts via requestWithAuth.
 */

export const getAccounts = (accessToken: string): Promise<Account[]> =>
  apiRequest<Account[]>("/accounts", { accessToken });

export const getAccount = (
  accessToken: string,
  id: number,
): Promise<Account> =>
  apiRequest<Account>(`/accounts/${id}`, { accessToken });

export const createAccount = (
  accessToken: string,
  data: CreateAccountRequest,
): Promise<Account> =>
  apiRequest<Account>("/accounts", {
    method: "POST",
    accessToken,
    body: data,
  });

export const updateAccount = (
  accessToken: string,
  id: number,
  data: UpdateAccountRequest,
): Promise<Account> =>
  apiRequest<Account>(`/accounts/${id}`, {
    method: "PATCH",
    accessToken,
    body: data,
  });

export const deleteAccount = (
  accessToken: string,
  id: number,
): Promise<void> =>
  apiRequest<void>(`/accounts/${id}`, {
    method: "DELETE",
    accessToken,
  });
