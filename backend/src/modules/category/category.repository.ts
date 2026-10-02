import type {
  Category,
  CategoryType,
  Prisma,
} from "../../generated/prisma/client.js";

import { prisma } from "../../lib/prisma.js";

export type CreateCategoryData = {
  userId: number;
  name: string;
  normalizedName: string;
  type: CategoryType;
};

export type UpdateCategoryData = {
  name?: string;
  normalizedName?: string;
  type?: CategoryType;
};

export interface CategoryRepository {
  create(
    data: CreateCategoryData,
    tx?: Prisma.TransactionClient,
  ): Promise<Category>;

  findManyByUserId(
    userId: number,
    tx?: Prisma.TransactionClient,
  ): Promise<Category[]>;

  findManyByUserIdAndType(
    userId: number,
    type: CategoryType,
    tx?: Prisma.TransactionClient,
  ): Promise<Category[]>;

  findByIdAndUserId(
    id: string,
    userId: number,
    tx?: Prisma.TransactionClient,
  ): Promise<Category | null>;

  findByNormalizedNameAndTypeAndUserId(
    normalizedName: string,
    type: CategoryType,
    userId: number,
    excludeId?: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Category | null>;

  updateByIdAndUserId(
    id: string,
    userId: number,
    data: UpdateCategoryData,
    tx?: Prisma.TransactionClient,
  ): Promise<Category | null>;

  deleteByIdAndUserId(
    id: string,
    userId: number,
    tx?: Prisma.TransactionClient,
  ): Promise<boolean>;
}

export const categoryRepository: CategoryRepository = {
  async create(data, tx = prisma) {
    return tx.category.create({
      data: {
        userId: data.userId,
        name: data.name,
        normalizedName: data.normalizedName,
        type: data.type,
      },
    });
  },

  async findManyByUserId(userId, tx = prisma) {
    return tx.category.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  },

  async findManyByUserIdAndType(userId, type, tx = prisma) {
    return tx.category.findMany({
      where: {
        userId,
        type,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  },

  async findByIdAndUserId(id, userId, tx = prisma) {
    return tx.category.findFirst({
      where: {
        id,
        userId,
      },
    });
  },

  async findByNormalizedNameAndTypeAndUserId(
    normalizedName,
    type,
    userId,
    excludeId,
    tx = prisma,
  ) {
    return tx.category.findFirst({
      where: {
        userId,
        normalizedName,
        type,
        ...(excludeId !== undefined && {
          id: {
            not: excludeId,
          },
        }),
      },
    });
  },

  async updateByIdAndUserId(
    id,
    userId,
    data,
    tx = prisma,
  ) {
    const result = await tx.category.updateMany({
      where: {
        id,
        userId,
      },
      data,
    });

    if (result.count === 0) {
      return null;
    }

    return tx.category.findUnique({
      where: {
        id,
      },
    });
  },

  async deleteByIdAndUserId(
    id,
    userId,
    tx = prisma,
  ) {
    const result = await tx.category.deleteMany({
      where: {
        id,
        userId,
      },
    });

    return result.count > 0;
  },
};