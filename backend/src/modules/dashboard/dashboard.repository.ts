import { Prisma } from "../../generated/prisma/client.js";
import type { Transaction } from "../../generated/prisma/client.js";

import { prisma } from "../../lib/prisma.js";

export type DashboardDateFilters = {
  startDate?: Date | string;
  endDate?: Date | string;
};

export type DashboardCategorySummary = {
  categoryId: string;
  categoryName: string;
  total: string;
};

const normalizeStartDate = (value: Date | string): Date => {
  if (value instanceof Date) {
    return value;
  }

  return new Date(`${value}T00:00:00.000Z`);
};

const normalizeEndDate = (value: Date | string): Date => {
  if (value instanceof Date) {
    return value;
  }

  return new Date(`${value}T23:59:59.999Z`);
};

const buildTransactionWhere = (
  userId: number,
  type: "INCOME" | "EXPENSE",
  filters: DashboardDateFilters = {},
): Prisma.TransactionWhereInput => {
  const dateFilter: Prisma.DateTimeFilter = {};

  if (filters.startDate !== undefined) {
    dateFilter.gte = normalizeStartDate(filters.startDate);
  }

  if (filters.endDate !== undefined) {
    dateFilter.lte = normalizeEndDate(filters.endDate);
  }

  return {
    userId,
    type,
    ...(Object.keys(dateFilter).length > 0
      ? {
          date: dateFilter,
        }
      : {}),
  };
};

export async function getTotalBalance(
  userId: number,
): Promise<number> {
  const result = await prisma.account.aggregate({
    where: {
      userId,
    },
    _sum: {
      balance: true,
    },
  });

  return Number(result._sum.balance ?? 0);
}

export async function getTotalIncome(
  userId: number,
  filters: DashboardDateFilters = {},
): Promise<number> {
  const result = await prisma.transaction.aggregate({
    where: buildTransactionWhere(
      userId,
      "INCOME",
      filters,
    ),
    _sum: {
      amount: true,
    },
  });

  return Number(result._sum.amount ?? 0);
}

export async function getTotalExpenses(
  userId: number,
  filters: DashboardDateFilters = {},
): Promise<number> {
  const result = await prisma.transaction.aggregate({
    where: buildTransactionWhere(
      userId,
      "EXPENSE",
      filters,
    ),
    _sum: {
      amount: true,
    },
  });

  return Number(result._sum.amount ?? 0);
}

export async function getExpensesByCategory(
  userId: number,
  filters: DashboardDateFilters = {},
): Promise<DashboardCategorySummary[]> {
  const result = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: buildTransactionWhere(
      userId,
      "EXPENSE",
      filters,
    ),
    _sum: {
      amount: true,
    },
  });

  const categoryIds = result.map(
    (item) => item.categoryId,
  );

  if (categoryIds.length === 0) {
    return [];
  }

  const categories = await prisma.category.findMany({
    where: {
      id: {
        in: categoryIds,
      },
      userId,
    },
    select: {
      id: true,
      name: true,
    },
  });

  const categoryMap = new Map(
    categories.map((category) => [
      category.id,
      category.name,
    ]),
  );

  return result
    .map((item) => ({
      categoryId: item.categoryId,
      categoryName:
        categoryMap.get(item.categoryId) ?? "",
      total: (
        item._sum.amount ?? new Prisma.Decimal(0)
      ).toString(),
    }))
    .sort((a, b) =>
      a.categoryName.localeCompare(b.categoryName),
    );
}

export async function getIncomeByCategory(
  userId: number,
  filters: DashboardDateFilters = {},
): Promise<DashboardCategorySummary[]> {
  const result = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: buildTransactionWhere(
      userId,
      "INCOME",
      filters,
    ),
    _sum: {
      amount: true,
    },
  });

  const categoryIds = result.map(
    (item) => item.categoryId,
  );

  if (categoryIds.length === 0) {
    return [];
  }

  const categories = await prisma.category.findMany({
    where: {
      id: {
        in: categoryIds,
      },
      userId,
    },
    select: {
      id: true,
      name: true,
    },
  });

  const categoryMap = new Map(
    categories.map((category) => [
      category.id,
      category.name,
    ]),
  );

  return result
    .map((item) => ({
      categoryId: item.categoryId,
      categoryName:
        categoryMap.get(item.categoryId) ?? "",
      total: (
        item._sum.amount ?? new Prisma.Decimal(0)
      ).toString(),
    }))
    .sort((a, b) =>
      a.categoryName.localeCompare(b.categoryName),
    );
}

export async function getRecentTransactions(
  userId: number,
  filters: DashboardDateFilters = {},
  limit = 5,
): Promise<Transaction[]> {
  return prisma.transaction.findMany({
    where: {
      userId,
      ...(
        filters.startDate !== undefined ||
        filters.endDate !== undefined
          ? {
              date: {
                ...(filters.startDate !== undefined && {
                  gte: normalizeStartDate(filters.startDate),
                }),
                ...(filters.endDate !== undefined && {
                  lte: normalizeEndDate(filters.endDate),
                }),
              },
            }
          : {}
      ),
    },
    orderBy: [
      {
        date: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
    take: limit,
  });
}