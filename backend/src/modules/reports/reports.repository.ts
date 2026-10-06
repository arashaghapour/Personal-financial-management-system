import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";

import type {
  CashFlowAggregation,
  ExpenseCategoryAggregation,
  ExpenseReportFilters,
  ExpenseSummary,
  IncomeSummary,
  ReportDateFilters,
} from "./reports.types.js";


const normalizeStartDate = (value: string): Date => {
  return new Date(`${value}T00:00:00.000Z`);
};

const normalizeEndDate = (value: string): Date => {
  return new Date(`${value}T23:59:59.999Z`);
};

const buildDateFilter = (
  filters: ReportDateFilters,
): Prisma.DateTimeFilter | undefined => {
  const dateFilter: Prisma.DateTimeFilter = {};

  if (filters.startDate !== undefined) {
    dateFilter.gte = normalizeStartDate(filters.startDate);
  }

  if (filters.endDate !== undefined) {
    dateFilter.lte = normalizeEndDate(filters.endDate);
  }

  return Object.keys(dateFilter).length > 0
    ? dateFilter
    : undefined;
};

const buildTransactionWhere = (
  userId: number,
  filters: ReportDateFilters = {},
): Prisma.TransactionWhereInput => {
  const dateFilter = buildDateFilter(filters);

  return {
    userId,
    ...(dateFilter !== undefined && {
      date: dateFilter,
    }),
  };
};

const buildExpenseWhere = (
  userId: number,
  filters: ExpenseReportFilters = {},
): Prisma.TransactionWhereInput => {
  const dateFilter = buildDateFilter(filters);

  return {
    userId,
    type: "EXPENSE",

    ...(filters.categoryId !== undefined && {
      categoryId: filters.categoryId,
    }),

    ...(dateFilter !== undefined && {
      date: dateFilter,
    }),
  };
};

export const getIncomeSummary = async (
  userId: number,
  filters: ReportDateFilters = {},
): Promise<IncomeSummary> => {
  const result = await prisma.transaction.aggregate({
    where: {
      ...buildTransactionWhere(userId, filters),
      type: "INCOME",
    },

    _sum: {
      amount: true,
    },

    _count: {
      _all: true,
    },
  });

  return {
    totalIncome: (
      result._sum.amount ?? new Prisma.Decimal(0)
    ).toString(),

    transactionCount: result._count._all,
  };
};

export const getExpenseSummary = async (
  userId: number,
  filters: ExpenseReportFilters = {},
): Promise<ExpenseSummary> => {
  const result = await prisma.transaction.aggregate({
    where: buildExpenseWhere(userId, filters),

    _sum: {
      amount: true,
    },

    _count: {
      _all: true,
    },
  });

  return {
    totalExpenses: (
      result._sum.amount ?? new Prisma.Decimal(0)
    ).toString(),

    transactionCount: result._count._all,
  };
};

export const getExpenseByCategory = async (
  userId: number,
  filters: ExpenseReportFilters = {},
): Promise<ExpenseCategoryAggregation[]> => {
  const result = await prisma.transaction.groupBy({
    by: ["categoryId"],

    where: buildExpenseWhere(userId, filters),

    _sum: {
      amount: true,
    },

    _count: {
      _all: true,
    },

    orderBy: {
      _sum: {
        amount: "desc",
      },
    },
  });

  if (result.length === 0) {
    return [];
  }

  const categoryIds = result.map(
    (item) => item.categoryId,
  );

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

  return result.map((item) => ({
    categoryId: item.categoryId,

    categoryName:
      categoryMap.get(item.categoryId) ?? "",

    amount: (
      item._sum.amount ?? new Prisma.Decimal(0)
    ).toString(),

    transactionCount: item._count._all,
  }));
};

export const getCashFlowByDate = async (
  userId: number,
  filters: ReportDateFilters = {},
): Promise<CashFlowAggregation[]> => {
  const startDate =
    filters.startDate !== undefined
      ? normalizeStartDate(filters.startDate)
      : undefined;

  const endDate =
    filters.endDate !== undefined
      ? normalizeEndDate(filters.endDate)
      : undefined;

  const result = await prisma.$queryRaw<
    Array<{
      date: Date;
      income: Prisma.Decimal;
      expenses: Prisma.Decimal;
    }>
  >`
    SELECT
      date,

      COALESCE(
        SUM(
          CASE
            WHEN type = 'INCOME' THEN amount
            ELSE 0
          END
        ),
        0
      ) AS income,

      COALESCE(
        SUM(
          CASE
            WHEN type = 'EXPENSE' THEN amount
            ELSE 0
          END
        ),
        0
      ) AS expenses

    FROM "Transaction"

    WHERE
      "userId" = ${userId}

      ${
        startDate !== undefined
          ? Prisma.sql`AND date >= ${startDate}`
          : Prisma.empty
      }

      ${
        endDate !== undefined
          ? Prisma.sql`AND date <= ${endDate}`
          : Prisma.empty
      }

    GROUP BY date

    ORDER BY date ASC
  `;

  return result.map((item) => ({
    date: item.date.toISOString().slice(0, 10),

    income: item.income.toString(),

    expenses: item.expenses.toString(),
  }));
};

export const findCategoryByIdAndUserId = async (
  categoryId: string,
  userId: number,
) => {
  return prisma.category.findFirst({
    where: {
      id: categoryId,
      userId,
    },
    select: {
      id: true,
    },
  });
};