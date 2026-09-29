import type {
  NextFunction,
  Request,
  Response,
} from "express";

import * as accountService from "./account.service.js";

export const createAccountController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const account = await accountService.createAccount(
      req.user!.id,
      req.body,
    );

    return res.status(201).json(account);
  } catch (error) {
    return next(error);
  }
};

export const getAccountsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const accounts = await accountService.getAccounts(
      req.user!.id,
    );

    return res.status(200).json(accounts);
  } catch (error) {
    return next(error);
  }
};

export const getAccountController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const account = await accountService.getAccount(
      req.user!.id,
      Number(req.params.id),
    );

    return res.status(200).json(account);
  } catch (error) {
    return next(error);
  }
};

export const updateAccountController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const account =
      await accountService.updateAccount(
        req.user!.id,
        Number(req.params.id),
        req.body,
      );

    return res.status(200).json(account);
  } catch (error) {
    return next(error);
  }
};

export const deleteAccountController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await accountService.deleteAccount(
      req.user!.id,
      Number(req.params.id),
    );

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};