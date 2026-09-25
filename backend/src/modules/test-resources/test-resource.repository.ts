import { prisma } from "../../lib/prisma.js";

import type { TestResourceResponse } from "./test-resource.types.js";

export type CreateTestResourceData = {
  userId: number;
  name: string;
};

export interface TestResourceRepository {
  create(
    data: CreateTestResourceData,
  ): Promise<TestResourceResponse>;

  findByIdAndUserId(
    id: number,
    userId: number,
  ): Promise<TestResourceResponse | null>;

  updateByIdAndUserId(
    id: number,
    userId: number,
    data: {
      name?: string;
    },
  ): Promise<TestResourceResponse | null>;

  deleteByIdAndUserId(
    id: number,
    userId: number,
  ): Promise<boolean>;
}

export const testResourceRepository: TestResourceRepository = {
  async create(data) {
    return prisma.testResource.create({
      data,
    });
  },

  async findByIdAndUserId(id, userId) {
    return prisma.testResource.findFirst({
      where: {
        id,
        userId,
      },
    });
  },

  async updateByIdAndUserId(id, userId, data) {
    const result = await prisma.testResource.updateMany({
      where: {
        id,
        userId,
      },
      data,
    });

    if (result.count === 0) {
      return null;
    }

    return prisma.testResource.findUnique({
      where: {
        id,
      },
      });
  },

  async deleteByIdAndUserId(id, userId) {
    const result = await prisma.testResource.deleteMany({
      where: {
        id,
        userId,
      },
    });

    return result.count > 0;
  },
};