import type {
  Prisma,
  Transaction,
  TransactionType,
} from "../../generated/prisma/client.js";

import { prisma } from "../../lib/prisma.js";

export type CreateTransactionData = {
  userId: number;
  type: TransactionType;
  amount: Prisma.Decimal;
  description?: string | null;
  date: Date;
  accountId: number;
  categoryId: string;
};

export type UpdateTransactionData = {
  amount?: Prisma.Decimal;
  description?: string | null;
  date?: Date;
  accountId?: number;
  categoryId?: string;
};

export type TransactionFilters = {
  userId: number;
  type?: TransactionType;
  accountId?: number;
  categoryId?: string;
  startDate?: Date;
  endDate?: Date;
  minAmount?: Prisma.Decimal;
  maxAmount?: Prisma.Decimal;
};

export type TransactionPagination = {
  page: number;
  limit: number;
};

export type TransactionSort =
  | "date_asc"
  | "date_desc"
  | "amount_asc"
  | "amount_desc"
  | "createdAt_asc"
  | "createdAt_desc";

export interface TransactionRepository {
  create(
    data: CreateTransactionData,
    tx?: Prisma.TransactionClient,
  ): Promise<Transaction>;

  findMany(
    filters: TransactionFilters,
    pagination: TransactionPagination,
    sort: TransactionSort,
    tx?: Prisma.TransactionClient,
  ): Promise<Transaction[]>;

  count(
    filters: TransactionFilters,
    tx?: Prisma.TransactionClient,
  ): Promise<number>;

  findByIdAndUserId(
    id: string,
    userId: number,
    tx?: Prisma.TransactionClient,
  ): Promise<Transaction | null>;

  updateByIdAndUserId(
    id: string,
    userId: number,
    data: UpdateTransactionData,
    tx?: Prisma.TransactionClient,
  ): Promise<Transaction | null>;

  deleteByIdAndUserId(
    id: string,
    userId: number,
    tx?: Prisma.TransactionClient,
  ): Promise<Transaction | null>;
}

const buildWhere = (
  filters: TransactionFilters,
): Prisma.TransactionWhereInput => {
  return {
    userId: filters.userId,
    ...(filters.type !== undefined && {
      type: filters.type,
    }),
    ...(filters.accountId !== undefined && {
      accountId: filters.accountId,
    }),
    ...(filters.categoryId !== undefined && {
      categoryId: filters.categoryId,
    }),
    ...(filters.startDate !== undefined ||
    filters.endDate !== undefined
      ? {
          date: {
            ...(filters.startDate !== undefined && {
              gte: filters.startDate,
            }),
            ...(filters.endDate !== undefined && {
              lte: filters.endDate,
            }),
          },
        }
      : {}),
    ...(filters.minAmount !== undefined ||
    filters.maxAmount !== undefined
      ? {
          amount: {
            ...(filters.minAmount !== undefined && {
              gte: filters.minAmount,
            }),
            ...(filters.maxAmount !== undefined && {
              lte: filters.maxAmount,
            }),
          },
        }
      : {}),
  };
};

const buildOrderBy = (
  sort: TransactionSort,
): Prisma.TransactionOrderByWithRelationInput => {
  switch (sort) {
    case "date_asc":
      return {
        date: "asc",
      };

    case "date_desc":
      return {
        date: "desc",
      };

    case "amount_asc":
      return {
        amount: "asc",
      };

    case "amount_desc":
      return {
        amount: "desc",
      };

    case "createdAt_asc":
      return {
        createdAt: "asc",
      };

    case "createdAt_desc":
      return {
        createdAt: "desc",
      };
  }
};

export const transactionRepository: TransactionRepository = {
  async create(data, tx = prisma) {
    return tx.transaction.create({
      data: {
        userId: data.userId,
        type: data.type,
        amount: data.amount,
        ...(data.description !== undefined && {
          description: data.description,
        }),
        date: data.date,
        accountId: data.accountId,
        categoryId: data.categoryId,
      },
    });
  },

  async findMany(
    filters,
    pagination,
    sort,
    tx = prisma,
  ) {
    const skip = (pagination.page - 1) * pagination.limit;

    return tx.transaction.findMany({
      where: buildWhere(filters),
      orderBy: buildOrderBy(sort),
      skip,
      take: pagination.limit,
    });
  },

  async count(filters, tx = prisma) {
    return tx.transaction.count({
      where: buildWhere(filters),
    });
  },

  async findByIdAndUserId(id, userId, tx = prisma) {
    return tx.transaction.findFirst({
      where: {
        id,
        userId,
      },
    });
  },

  async updateByIdAndUserId(
    id,
    userId,
    data,
    tx = prisma,
  ) {
    const result = await tx.transaction.updateMany({
      where: {
        id,
        userId,
      },
      data,
    });

    if (result.count === 0) {
      return null;
    }

    return tx.transaction.findUnique({
      where: {
        id,
      },
    });
  },

  async deleteByIdAndUserId(id, userId, tx = prisma) {
    const transaction = await tx.transaction.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!transaction) {
      return null;
    }

    return tx.transaction.delete({
      where: {
        id,
      },
    });
  },
};