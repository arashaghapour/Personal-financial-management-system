import { requestWithAuth } from "../../auth/api/auth-client";

import {
  createAccount,
  deleteAccount,
  getAccount,
  getAccounts,
  updateAccount,
} from "./accounts.api";

import type {
  Account,
  CreateAccountRequest,
  UpdateAccountRequest,
} from "../types";

/**
 * Reusable authenticated account queries and mutations.
 *
 * The access token is never handled by components: requestWithAuth attaches
 * the current token and performs a single refresh/retry when necessary.
 */

export const fetchAccounts = (): Promise<Account[]> =>
  requestWithAuth((accessToken) => getAccounts(accessToken));

export const fetchAccount = (id: number): Promise<Account> =>
  requestWithAuth((accessToken) => getAccount(accessToken, id));

export const createAccountMutation = (
  data: CreateAccountRequest,
): Promise<Account> =>
  requestWithAuth((accessToken) => createAccount(accessToken, data));

export const updateAccountMutation = (
  id: number,
  data: UpdateAccountRequest,
): Promise<Account> =>
  requestWithAuth((accessToken) => updateAccount(accessToken, id, data));

export const deleteAccountMutation = (id: number): Promise<void> =>
  requestWithAuth((accessToken) => deleteAccount(accessToken, id));
