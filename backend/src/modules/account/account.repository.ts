import type {
  Account,
  AccountType,
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
  create(data: CreateAccountData): Promise<Account>;

  findManyByUserId(
    userId: number,
  ): Promise<Account[]>;

  findByIdAndUserId(
    id: number,
    userId: number,
  ): Promise<Account | null>;

  updateByIdAndUserId(
    id: number,
    userId: number,
    data: UpdateAccountData,
  ): Promise<Account | null>;

  deleteByIdAndUserId(
    id: number,
    userId: number,
  ): Promise<Account | null>;
}

export const accountRepository: AccountRepository = {
  async create(data) {
    return prisma.account.create({
      data: {
        userId: data.userId,
        name: data.name,
        type: data.type,
        balance: data.balance,
      },
    });
  },

  async findManyByUserId(userId) {
    return prisma.account.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  },

  async findByIdAndUserId(id, userId) {
    return prisma.account.findFirst({
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
  ) {
    const result = await prisma.account.updateMany({
      where: {
        id,
        userId,
      },
      data,
    });

    if (result.count === 0) {
      return null;
    }

    return prisma.account.findUnique({
      where: {
        id,
      },
    });
  },

  async deleteByIdAndUserId(id, userId) {
    const account =
      await prisma.account.findFirst({
        where: {
          id,
          userId,
        },
      });

    if (!account) {
      return null;
    }

    return prisma.account.delete({
      where: {
        id,
      },
    });
  },
};