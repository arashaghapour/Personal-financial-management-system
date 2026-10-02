import type {
  NextFunction,
  Request,
  Response,
} from "express";

import * as transactionService from "./transaction.service.js";

import {
  createTransaction,
} from "./transaction.service.js";

export const createTransactionController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {

    const transaction = await createTransaction(
      req.user!.id,
      req.body,
    );

    res.status(201).json(transaction);
  } catch (error) {
    next(error);
  }
};

export const getTransactionController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const transaction =
      await transactionService.getTransaction(
        req.user!.id,
        req.params.id as string,
      );

    return res.status(200).json(transaction);
  } catch (error) {
    return next(error);
  }
};

export const getTransactionsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const transactions =
      await transactionService.getTransactions(
        req.user!.id,
        res.locals.query,
      );

    return res.status(200).json(transactions);
  } catch (error) {
    return next(error);
  }
};

export const updateTransactionController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const transaction =
      await transactionService.updateTransaction(
        req.user!.id,
        req.params.id as string,
        req.body,
      );

    return res.status(200).json(transaction);
  } catch (error) {
    return next(error);
  }
};

export const deleteTransactionController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await transactionService.deleteTransaction(
      req.user!.id,
      req.params.id as string,
    );

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};