import { prisma } from "../../lib/prisma.js";
import type { Prisma } from "../../generated/prisma/client.js";

export type BudgetFilters = {
  year?: number;
  month?: number;
  categoryId?: string;
};

export type CreateBudgetData = {
  userId: number;
  categoryId: string;
  amount: number;
  year: number;
  month: number;
  startDate: Date;
};

export type UpdateBudgetData = {
  amount: number;
};

export const create = async (data: CreateBudgetData) => {
  return prisma.budget.create({
    data: {
      userId: data.userId,
      categoryId: data.categoryId,
      amount: data.amount,
      year: data.year,
      month: data.month,
      startDate: data.startDate,
    },
  });
};

const buildWhere = (
  userId: number,
  filters: BudgetFilters,
): Prisma.BudgetWhereInput => {
  return {
    userId,
    ...(filters.year !== undefined && {
      year: filters.year,
    }),
    ...(filters.month !== undefined && {
      month: filters.month,
    }),
    ...(filters.categoryId !== undefined && {
      categoryId: filters.categoryId,
    }),
  };
};

export const findMany = async (
  userId: number,
  filters: BudgetFilters,
) => {
  return prisma.budget.findMany({
    where: buildWhere(userId, filters),
    orderBy: [
      { year: "desc" },
      { month: "desc" },
      { createdAt: "desc" },
    ],
  });
};

export const count = async (
  userId: number,
  filters: BudgetFilters,
) => {
  return prisma.budget.count({
    where: buildWhere(userId, filters),
  });
};

export const findByIdAndUserId = async (
  budgetId: string,
  userId: number,
) => {
  return prisma.budget.findFirst({
    where: {
      id: budgetId,
      userId,
    },
  });
};

export const updateByIdAndUserId = async (
  budgetId: string,
  userId: number,
  data: UpdateBudgetData,
) => {
  const existingBudget = await prisma.budget.findFirst({
    where: {
      id: budgetId,
      userId,
    },
  });

  if (!existingBudget) {
    return null;
  }

  return prisma.budget.update({
    where: {
      id: budgetId,
    },
    data: {
      amount: data.amount,
    },
  });
};

export const deleteByIdAndUserId = async (
  budgetId: string,
  userId: number,
) => {
  const existingBudget = await prisma.budget.findFirst({
    where: {
      id: budgetId,
      userId,
    },
  });

  if (!existingBudget) {
    return null;
  }

  return prisma.budget.delete({
    where: {
      id: budgetId,
    },
  });
};

export const calculateSpentAmount = async (
  userId: number,
  categoryId: string,
  startDate: Date,
  endDate: Date,
) => {
  const result = await prisma.transaction.aggregate({
    where: {
      userId,
      categoryId,
      type: "EXPENSE",
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    _sum: {
      amount: true,
    },
  });

  return result._sum.amount ?? 0;
};

export const findByUserCategoryAndPeriod = async (
  userId: number,
  categoryId: string,
  year: number,
  month: number,
) => {
  return prisma.budget.findFirst({
    where: {
      userId,
      categoryId,
      year,
      month,
    },
  });
};