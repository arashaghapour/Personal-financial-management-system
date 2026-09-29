import * as accountRepositoryModule from "./account.repository.js";

import type {
  CreateAccountRequest,
} from "./account.types.js";

import type {
  UpdateAccountInput,
} from "./account.schema.js";

import type {
  UpdateAccountData,
} from "./account.repository.js";


import { AppError } from "../../utils/app-error.js";

export const createAccount = async (
  userId: number,
  data: CreateAccountRequest,
) => {
  return accountRepositoryModule.accountRepository.create({
    userId,
    name: data.name,
    type: data.type,
    balance: data.initialBalance ?? 0,
  });
};

export const getAccounts = async (
  userId: number,
) => {
  return accountRepositoryModule.accountRepository.findManyByUserId(
    userId,
  );
};

export const getAccount = async (
  userId: number,
  accountId: number,
) => {
  const account =
    await accountRepositoryModule.accountRepository.findByIdAndUserId(
      accountId,
      userId,
    );

  if (!account) {
    throw new AppError(
      404,
      "ACCOUNT_NOT_FOUND",
      "Account not found",
    );
  }

  return account;
};

export const updateAccount = async (
  userId: number,
  accountId: number,
  data: UpdateAccountInput,
) => {
  const updateData: UpdateAccountData = {};

  if (data.name !== undefined) {
    updateData.name = data.name;
  }

  if (data.type !== undefined) {
    updateData.type = data.type;
  }

  const account =
    await accountRepositoryModule.accountRepository.updateByIdAndUserId(
      accountId,
      userId,
      updateData,
    );

  if (!account) {
    throw new AppError(
      404,
      "ACCOUNT_NOT_FOUND",
      "Account not found",
    );
  }

  return account;
};

export const deleteAccount = async (
  userId: number,
  accountId: number,
) => {
  const account =
    await accountRepositoryModule.accountRepository.deleteByIdAndUserId(
      accountId,
      userId,
    );

  if (!account) {
    throw new AppError(
      404,
      "ACCOUNT_NOT_FOUND",
      "Account not found",
    );
  }
};