import type {
  NextFunction,
  Request,
  Response,
} from "express";

import * as budgetService from "./budget.service.js";



export const createBudgetController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const budget = await budgetService.createBudget(
      req.user!.id,
      req.body,
    );

    return res.status(201).json(budget);
  } catch (error) {
    return next(error);
  }
};


export const getBudgetsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const budgets = await budgetService.getBudgets(
      req.user!.id,
      res.locals.query,
    );

    return res.status(200).json(budgets);
  } catch (error) {
    return next(error);
  }
};

export const getBudgetController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const budget = await budgetService.getBudgetById(
      req.user!.id,
      req.params.id as string,
    );

    return res.status(200).json(budget);
  } catch (error) {
    return next(error);
  }
};

export const updateBudgetController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const budget = await budgetService.updateBudget(
      req.user!.id,
      req.params.id as string,
      req.body,
    );

    return res.status(200).json(budget);
  } catch (error) {
    return next(error);
  }
};

export const deleteBudgetController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await budgetService.deleteBudget(
      req.user!.id,
      req.params.id as string,
    );

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

export const getBudgetProgressController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const progress = await budgetService.getBudgetProgress(
      req.user!.id,
      req.params.id as string,
    );

    return res.status(200).json(progress);
  } catch (error) {
    return next(error);
  }
};