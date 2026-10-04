import { errorCodes } from "../../constants/error-codes.js";
import { AppError } from "../../utils/app-error.js";

import * as budgetRepository from "./budget.repository.js";
import { categoryRepository } from "../category/category.repository.js";

import type {
  CreateBudgetInput,
  UpdateBudgetInput,
} from "./budget.validation.js";

import type {
  BudgetFilters,
} from "./budget.repository.js";


export const getBudgets = async (
  userId: number,
  filters: BudgetFilters,
) => {
  return budgetRepository.findMany(userId, filters);
};

const calculateStartDate = (
  year: number,
  month: number,
  now = new Date(),
) => {
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (year === currentYear && month === currentMonth) {
    return now;
  }

  return new Date(year, month - 1, 1);
};

export const createBudget = async (
  userId: number,
  input: CreateBudgetInput,
) => {
  const category = await categoryRepository.findByIdAndUserId(
    input.categoryId,
    userId,
  );

  if (!category || category.type !== "EXPENSE") {
    throw new AppError(
      400,
      errorCodes.INVALID_BUDGET_CATEGORY,
      "Budget category must be an expense category owned by the user",
    );
  }

  const existingBudget =
    await budgetRepository.findByUserCategoryAndPeriod(
      userId,
      input.categoryId,
      input.year,
      input.month,
    );

  if (existingBudget) {
    throw new AppError(
      409,
      errorCodes.DUPLICATE_BUDGET,
      "Budget already exists for this category and month",
    );
  }

  const startDate = calculateStartDate(
    input.year,
    input.month,
  );

  return budgetRepository.create({
    userId,
    categoryId: input.categoryId,
    amount: input.amount,
    year: input.year,
    month: input.month,
    startDate,
  });
};




export const getBudgetById = async (
  userId: number,
  budgetId: string,
) => {
  const budget = await budgetRepository.findByIdAndUserId(
    budgetId,
    userId,
  );

  if (!budget) {
    throw new AppError(
      404,
      errorCodes.NOT_FOUND,
      "Budget not found",
    );
  }

  return budget;
};

export const updateBudget = async (
  userId: number,
  budgetId: string,
  input: UpdateBudgetInput,
) => {
  const budget = await budgetRepository.findByIdAndUserId(
    budgetId,
    userId,
  );

  if (!budget) {
    throw new AppError(
      404,
      errorCodes.NOT_FOUND,
      "Budget not found",
    );
  }

  return budgetRepository.updateByIdAndUserId(
    budgetId,
    userId,
    {
      amount: input.amount,
    },
  );
};

export const deleteBudget = async (
  userId: number,
  budgetId: string,
) => {
  const budget = await budgetRepository.deleteByIdAndUserId(
    budgetId,
    userId,
  );

  if (!budget) {
    throw new AppError(
      404,
      errorCodes.NOT_FOUND,
      "Budget not found",
    );
  }

  return budget;
};

export const getBudgetProgress = async (
  userId: number,
  budgetId: string,
) => {
  const budget = await budgetRepository.findByIdAndUserId(
    budgetId,
    userId,
  );

  if (!budget) {
    throw new AppError(
      404,
      errorCodes.NOT_FOUND,
      "Budget not found",
    );
  }

  const endDate = new Date(
    budget.year,
    budget.month,
    0,
  );

  const spentAmount = await budgetRepository.calculateSpentAmount(
    userId,
    budget.categoryId,
    budget.startDate,
    endDate,
  );

  const budgetAmount = Number(budget.amount);
  const spent = Number(spentAmount);

  const remainingAmount = budgetAmount - spent;
  const percentageUsed = (spent / budgetAmount) * 100;

  let status: "UNDER_BUDGET" | "NEAR_LIMIT" | "OVER_BUDGET";

  if (percentageUsed < 90) {
    status = "UNDER_BUDGET";
  } else if (percentageUsed <= 100) {
    status = "NEAR_LIMIT";
  } else {
    status = "OVER_BUDGET";
  }

  return {
    budgetId: budget.id,
    budgetAmount,
    spentAmount: spent,
    remainingAmount,
    percentageUsed,
    status,
  };
};