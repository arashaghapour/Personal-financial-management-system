import type {
  Account,
  AccountType,
  Prisma,
} from "../../generated/prisma/client.js";

import { prisma } from "../../lib/prisma.js";

export type CreateAccountData = {
  userId: number;
  name: string;
  type: AccountType;
  balance: number;
};

export type UpdateAccountData = {
  name?: string;
  type?: AccountType;
};

export interface AccountRepository {
  create(
    data: CreateAccountData,
    tx?: Prisma.TransactionClient,
  ): Promise<Account>;

  findManyByUserId(
    userId: number,
    tx?: Prisma.TransactionClient,
  ): Promise<Account[]>;

  findByIdAndUserId(
    id: number,
    userId: number,
    tx?: Prisma.TransactionClient,
  ): Promise<Account | null>;

  updateByIdAndUserId(
    id: number,
    userId: number,
    data: UpdateAccountData,
    tx?: Prisma.TransactionClient,
  ): Promise<Account | null>;

  deleteByIdAndUserId(
    id: number,
    userId: number,
    tx?: Prisma.TransactionClient,
  ): Promise<Account | null>;

  increaseBalance(
    id: number,
    userId: number,
    amount: Prisma.Decimal,
    tx?: Prisma.TransactionClient,
  ): Promise<Account | null>;

  decreaseBalance(
    id: number,
    userId: number,
    amount: Prisma.Decimal,
    tx?: Prisma.TransactionClient,
  ): Promise<Account | null>;
}

export const accountRepository: AccountRepository = {
  async create(data, tx = prisma) {
    return tx.account.create({
      data: {
        userId: data.userId,
        name: data.name,
        type: data.type,
        balance: data.balance,
      },
    });
  },

  async findManyByUserId(userId, tx = prisma) {
    return tx.account.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  },

  async findByIdAndUserId(id, userId, tx = prisma) {
    return tx.account.findFirst({
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
    const result = await tx.account.updateMany({
      where: {
        id,
        userId,
      },
      data,
    });

    if (result.count === 0) {
      return null;
    }

    return tx.account.findUnique({
      where: {
        id,
      },
    });
  },

  async deleteByIdAndUserId(id, userId, tx = prisma) {
    const account = await tx.account.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!account) {
      return null;
    }

    return tx.account.delete({
      where: {
        id,
      },
    });
  },

  async increaseBalance(
    id,
    userId,
    amount,
    tx = prisma,
  ) {
    const result = await tx.account.updateMany({
      where: {
        id,
        userId,
      },
      data: {
        balance: {
          increment: amount,
        },
      },
    });

    if (result.count === 0) {
      return null;
    }

    return tx.account.findUnique({
      where: {
        id,
      },
    });
  },

  async decreaseBalance(
    id,
    userId,
    amount,
    tx = prisma,
  ) {
    const result = await tx.account.updateMany({
      where: {
        id,
        userId,
        balance: {
          gte: amount,
        },
      },
      data: {
        balance: {
          decrement: amount,
        },
      },
    });

    if (result.count === 0) {
      return null;
    }

    return tx.account.findUnique({
      where: {
        id,
      },
    });
  },
};