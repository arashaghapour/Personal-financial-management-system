import type {
  Category,
  CategoryType,
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
  ): Promise<Category>;

  findManyByUserId(
    userId: number,
  ): Promise<Category[]>;

  findManyByUserIdAndType(
    userId: number,
    type: CategoryType,
  ): Promise<Category[]>;

  findByIdAndUserId(
    id: string,
    userId: number,
  ): Promise<Category | null>;

  findByNormalizedNameAndTypeAndUserId(
    normalizedName: string,
    type: CategoryType,
    userId: number,
    excludeId?: string,
  ): Promise<Category | null>;

  updateByIdAndUserId(
    id: string,
    userId: number,
    data: UpdateCategoryData,
  ): Promise<Category | null>;

  deleteByIdAndUserId(
    id: string,
    userId: number,
  ): Promise<boolean>;
}

export const categoryRepository: CategoryRepository = {
  async create(data) {
    return prisma.category.create({
      data: {
        userId: data.userId,
        name: data.name,
        normalizedName: data.normalizedName,
        type: data.type,
      },
    });
  },

  async findManyByUserId(userId) {
    return prisma.category.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  },

  async findManyByUserIdAndType(userId, type) {
    return prisma.category.findMany({
      where: {
        userId,
        type,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  },

  async findByIdAndUserId(id, userId) {
    return prisma.category.findFirst({
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
  ) {
    return prisma.category.findFirst({
      where: {
        userId,
        normalizedName,
        type,
        ...(excludeId !== undefined
          ? {
              id: {
                not: excludeId,
              },
            }
          : {}),
      },
    });
  },

  async updateByIdAndUserId(
    id,
    userId,
    data,
  ) {
    const result = await prisma.category.updateMany({
      where: {
        id,
        userId,
      },
      data,
    });

    if (result.count === 0) {
      return null;
    }

    return prisma.category.findUnique({
      where: {
        id,
      },
    });
  },

  async deleteByIdAndUserId(
    id,
    userId,
  ) {
    const result = await prisma.category.deleteMany({
      where: {
        id,
        userId,
      },
    });

    return result.count > 0;
  },
};