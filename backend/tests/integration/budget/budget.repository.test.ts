import { beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../../../src/lib/prisma.js";

import {
  calculateSpentAmount,
  count,
  create,
  deleteByIdAndUserId,
  findByIdAndUserId,
  findMany,
  updateByIdAndUserId,
} from "../../../src/modules/budget/budget.repository.js";

describe("Budget repository", () => {
  beforeEach(async () => {
    await prisma.transaction.deleteMany();
    await prisma.budget.deleteMany();
    await prisma.category.deleteMany();
    await prisma.account.deleteMany();
    await prisma.user.deleteMany();
  });

  describe("create", () => {
    it("should create a budget", async () => {
      const user = await prisma.user.create({
        data: {
          email: "budget-repository-create@example.com",
          passwordHash: "hashed-password",
          firstName: "Test",
          lastName: "User",
        },
      });

      const category = await prisma.category.create({
        data: {
          userId: user.id,
          name: "Food",
          normalizedName: "food",
          type: "EXPENSE",
        },
      });

      const startDate = new Date("2026-10-15");

      const budget = await create({
        userId: user.id,
        categoryId: category.id,
        amount: 1000,
        year: 2026,
        month: 10,
        startDate,
      });

      expect(budget.userId).toBe(user.id);
      expect(budget.categoryId).toBe(category.id);
      expect(Number(budget.amount)).toBe(1000);
      expect(budget.year).toBe(2026);
      expect(budget.month).toBe(10);
      expect(budget.startDate).toEqual(startDate);
    });
  });

  describe("findMany", () => {
    it("should return user's budgets", async () => {
      const user = await prisma.user.create({
        data: {
          email: "budget-repository-find-many@example.com",
          passwordHash: "hashed-password",
          firstName: "Test",
          lastName: "User",
        },
      });

      const category = await prisma.category.create({
        data: {
          userId: user.id,
          name: "Food",
          normalizedName: "food",
          type: "EXPENSE",
        },
      });

      await create({
        userId: user.id,
        categoryId: category.id,
        amount: 1000,
        year: 2026,
        month: 10,
        startDate: new Date("2026-10-01"),
      });

      await create({
        userId: user.id,
        categoryId: category.id,
        amount: 1500,
        year: 2026,
        month: 11,
        startDate: new Date("2026-11-01"),
      });

      const result = await findMany(user.id, {});

      expect(result).toHaveLength(2);
      expect(result.every((budget) => budget.userId === user.id)).toBe(true);
    });

    it("should exclude another user's budgets", async () => {
      const userA = await prisma.user.create({
        data: {
          email: "budget-repository-user-a@example.com",
          passwordHash: "hashed-password",
          firstName: "User",
          lastName: "A",
        },
      });

      const userB = await prisma.user.create({
        data: {
          email: "budget-repository-user-b@example.com",
          passwordHash: "hashed-password",
          firstName: "User",
          lastName: "B",
        },
      });

      const categoryA = await prisma.category.create({
        data: {
          userId: userA.id,
          name: "Food",
          normalizedName: "food",
          type: "EXPENSE",
        },
      });

      const categoryB = await prisma.category.create({
        data: {
          userId: userB.id,
          name: "Food",
          normalizedName: "food",
          type: "EXPENSE",
        },
      });

      await create({
        userId: userA.id,
        categoryId: categoryA.id,
        amount: 1000,
        year: 2026,
        month: 10,
        startDate: new Date("2026-10-01"),
      });

      await create({
        userId: userB.id,
        categoryId: categoryB.id,
        amount: 2000,
        year: 2026,
        month: 10,
        startDate: new Date("2026-10-01"),
      });

      const result = await findMany(userA.id, {});

      expect(result).toHaveLength(1);
      expect(result[0]?.userId).toBe(userA.id);
    });

    it("should filter by year", async () => {
      const user = await prisma.user.create({
        data: {
          email: "budget-repository-year@example.com",
          passwordHash: "hashed-password",
          firstName: "Test",
          lastName: "User",
        },
      });

      const category = await prisma.category.create({
        data: {
          userId: user.id,
          name: "Food",
          normalizedName: "food",
          type: "EXPENSE",
        },
      });

      await create({
        userId: user.id,
        categoryId: category.id,
        amount: 1000,
        year: 2026,
        month: 10,
        startDate: new Date("2026-10-01"),
      });

      await create({
        userId: user.id,
        categoryId: category.id,
        amount: 2000,
        year: 2027,
        month: 10,
        startDate: new Date("2027-10-01"),
      });

      const result = await findMany(user.id, { year: 2026 });

      expect(result).toHaveLength(1);
      expect(result[0]?.year).toBe(2026);
    });

    it("should filter by month", async () => {
      const user = await prisma.user.create({
        data: {
          email: "budget-repository-month@example.com",
          passwordHash: "hashed-password",
          firstName: "Test",
          lastName: "User",
        },
      });

      const category = await prisma.category.create({
        data: {
          userId: user.id,
          name: "Food",
          normalizedName: "food",
          type: "EXPENSE",
        },
      });

      await create({
        userId: user.id,
        categoryId: category.id,
        amount: 1000,
        year: 2026,
        month: 10,
        startDate: new Date("2026-10-01"),
      });

      await create({
        userId: user.id,
        categoryId: category.id,
        amount: 2000,
        year: 2026,
        month: 11,
        startDate: new Date("2026-11-01"),
      });

      const result = await findMany(user.id, { month: 10 });

      expect(result).toHaveLength(1);
      expect(result[0]?.month).toBe(10);
    });

    it("should filter by category", async () => {
      const user = await prisma.user.create({
        data: {
          email: "budget-repository-category@example.com",
          passwordHash: "hashed-password",
          firstName: "Test",
          lastName: "User",
        },
      });

      const foodCategory = await prisma.category.create({
        data: {
          userId: user.id,
          name: "Food",
          normalizedName: "food",
          type: "EXPENSE",
        },
      });

      const transportCategory = await prisma.category.create({
        data: {
          userId: user.id,
          name: "Transport",
          normalizedName: "transport",
          type: "EXPENSE",
        },
      });

      await create({
        userId: user.id,
        categoryId: foodCategory.id,
        amount: 1000,
        year: 2026,
        month: 10,
        startDate: new Date("2026-10-01"),
      });

      await create({
        userId: user.id,
        categoryId: transportCategory.id,
        amount: 2000,
        year: 2026,
        month: 10,
        startDate: new Date("2026-10-01"),
      });

      const result = await findMany(user.id, {
        categoryId: foodCategory.id,
      });

      expect(result).toHaveLength(1);
      expect(result[0]?.categoryId).toBe(foodCategory.id);
    });

    it("should apply combined filters", async () => {
      const user = await prisma.user.create({
        data: {
          email: "budget-repository-combined@example.com",
          passwordHash: "hashed-password",
          firstName: "Test",
          lastName: "User",
        },
      });

      const foodCategory = await prisma.category.create({
        data: {
          userId: user.id,
          name: "Food",
          normalizedName: "food",
          type: "EXPENSE",
        },
      });

      const transportCategory = await prisma.category.create({
        data: {
          userId: user.id,
          name: "Transport",
          normalizedName: "transport",
          type: "EXPENSE",
        },
      });

      await create({
        userId: user.id,
        categoryId: foodCategory.id,
        amount: 1000,
        year: 2026,
        month: 10,
        startDate: new Date("2026-10-01"),
      });

      await create({
        userId: user.id,
        categoryId: foodCategory.id,
        amount: 2000,
        year: 2026,
        month: 11,
        startDate: new Date("2026-11-01"),
      });

      await create({
        userId: user.id,
        categoryId: transportCategory.id,
        amount: 3000,
        year: 2026,
        month: 10,
        startDate: new Date("2026-10-01"),
      });

      const result = await findMany(user.id, {
        year: 2026,
        month: 10,
        categoryId: foodCategory.id,
      });

      expect(result).toHaveLength(1);
      expect(result[0]?.categoryId).toBe(foodCategory.id);
      expect(result[0]?.year).toBe(2026);
      expect(result[0]?.month).toBe(10);
    });
  });

  describe("count", () => {
    it("should count user's budgets", async () => {
      const user = await prisma.user.create({
        data: {
          email: "budget-repository-count@example.com",
          passwordHash: "hashed-password",
          firstName: "Test",
          lastName: "User",
        },
      });

      const category = await prisma.category.create({
        data: {
          userId: user.id,
          name: "Food",
          normalizedName: "food",
          type: "EXPENSE",
        },
      });

      await create({
        userId: user.id,
        categoryId: category.id,
        amount: 1000,
        year: 2026,
        month: 10,
        startDate: new Date("2026-10-01"),
      });

      await create({
        userId: user.id,
        categoryId: category.id,
        amount: 2000,
        year: 2026,
        month: 11,
        startDate: new Date("2026-11-01"),
      });

      const result = await count(user.id, {});

      expect(result).toBe(2);
    });

    it("should count budgets with filters", async () => {
      const user = await prisma.user.create({
        data: {
          email: "budget-repository-count-filter@example.com",
          passwordHash: "hashed-password",
          firstName: "Test",
          lastName: "User",
        },
      });

      const category = await prisma.category.create({
        data: {
          userId: user.id,
          name: "Food",
          normalizedName: "food",
          type: "EXPENSE",
        },
      });

      await create({
        userId: user.id,
        categoryId: category.id,
        amount: 1000,
        year: 2026,
        month: 10,
        startDate: new Date("2026-10-01"),
      });

      await create({
        userId: user.id,
        categoryId: category.id,
        amount: 2000,
        year: 2026,
        month: 11,
        startDate: new Date("2026-11-01"),
      });

      const result = await count(user.id, {
        year: 2026,
        month: 10,
      });

      expect(result).toBe(1);
    });
  });

  describe("findByIdAndUserId", () => {
    it("should find budget by id and user id", async () => {
      const user = await prisma.user.create({
        data: {
          email: "budget-repository-find-by-id@example.com",
          passwordHash: "hashed-password",
          firstName: "Test",
          lastName: "User",
        },
      });

      const category = await prisma.category.create({
        data: {
          userId: user.id,
          name: "Food",
          normalizedName: "food",
          type: "EXPENSE",
        },
      });

      const budget = await create({
        userId: user.id,
        categoryId: category.id,
        amount: 1000,
        year: 2026,
        month: 10,
        startDate: new Date("2026-10-01"),
      });

      const result = await findByIdAndUserId(budget.id, user.id);

      expect(result?.id).toBe(budget.id);
      expect(result?.userId).toBe(user.id);
    });

    it("should return null for another user's budget", async () => {
      const userA = await prisma.user.create({
        data: {
          email: "budget-repository-find-user-a@example.com",
          passwordHash: "hashed-password",
          firstName: "User",
          lastName: "A",
        },
      });

      const userB = await prisma.user.create({
        data: {
          email: "budget-repository-find-user-b@example.com",
          passwordHash: "hashed-password",
          firstName: "User",
          lastName: "B",
        },
      });

      const category = await prisma.category.create({
        data: {
          userId: userB.id,
          name: "Food",
          normalizedName: "food",
          type: "EXPENSE",
        },
      });

      const budget = await create({
        userId: userB.id,
        categoryId: category.id,
        amount: 1000,
        year: 2026,
        month: 10,
        startDate: new Date("2026-10-01"),
      });

      const result = await findByIdAndUserId(budget.id, userA.id);

      expect(result).toBeNull();
    });

    it("should return null for nonexistent budget", async () => {
      const user = await prisma.user.create({
        data: {
          email: "budget-repository-find-not-found@example.com",
          passwordHash: "hashed-password",
          firstName: "Test",
          lastName: "User",
        },
      });

      const result = await findByIdAndUserId(
        "00000000-0000-4000-8000-000000000000",
        user.id,
      );

      expect(result).toBeNull();
    });
  });

  describe("updateByIdAndUserId", () => {
    it("should update user's budget", async () => {
      const user = await prisma.user.create({
        data: {
          email: "budget-repository-update@example.com",
          passwordHash: "hashed-password",
          firstName: "Test",
          lastName: "User",
        },
      });

      const category = await prisma.category.create({
        data: {
          userId: user.id,
          name: "Food",
          normalizedName: "food",
          type: "EXPENSE",
        },
      });

      const budget = await create({
        userId: user.id,
        categoryId: category.id,
        amount: 1000,
        year: 2026,
        month: 10,
        startDate: new Date("2026-10-01"),
      });

      const result = await updateByIdAndUserId(
        budget.id,
        user.id,
        { amount: 1500 },
      );

      expect(Number(result.amount)).toBe(1500);
    });

    it("should not update another user's budget", async () => {
      const userA = await prisma.user.create({
        data: {
          email: "budget-repository-update-user-a@example.com",
          passwordHash: "hashed-password",
          firstName: "User",
          lastName: "A",
        },
      });

      const userB = await prisma.user.create({
        data: {
          email: "budget-repository-update-user-b@example.com",
          passwordHash: "hashed-password",
          firstName: "User",
          lastName: "B",
        },
      });

      const category = await prisma.category.create({
        data: {
          userId: userB.id,
          name: "Food",
          normalizedName: "food",
          type: "EXPENSE",
        },
      });

      const budget = await create({
        userId: userB.id,
        categoryId: category.id,
        amount: 1000,
        year: 2026,
        month: 10,
        startDate: new Date("2026-10-01"),
      });

      const result = await updateByIdAndUserId(
        budget.id,
        userA.id,
        { amount: 1500 },
      );

      expect(result).toBeNull();

      const unchanged = await prisma.budget.findUnique({
        where: { id: budget.id },
      });

      expect(Number(unchanged?.amount)).toBe(1000);
    });
  });

  describe("deleteByIdAndUserId", () => {
    it("should delete user's budget", async () => {
      const user = await prisma.user.create({
        data: {
          email: "budget-repository-delete@example.com",
          passwordHash: "hashed-password",
          firstName: "Test",
          lastName: "User",
        },
      });

      const category = await prisma.category.create({
        data: {
          userId: user.id,
          name: "Food",
          normalizedName: "food",
          type: "EXPENSE",
        },
      });

      const budget = await create({
        userId: user.id,
        categoryId: category.id,
        amount: 1000,
        year: 2026,
        month: 10,
        startDate: new Date("2026-10-01"),
      });

      const result = await deleteByIdAndUserId(budget.id, user.id);

      expect(result.id).toBe(budget.id);

      const deleted = await prisma.budget.findUnique({
        where: { id: budget.id },
      });

      expect(deleted).toBeNull();
    });

    it("should not delete another user's budget", async () => {
      const userA = await prisma.user.create({
        data: {
          email: "budget-repository-delete-user-a@example.com",
          passwordHash: "hashed-password",
          firstName: "User",
          lastName: "A",
        },
      });

      const userB = await prisma.user.create({
        data: {
          email: "budget-repository-delete-user-b@example.com",
          passwordHash: "hashed-password",
          firstName: "User",
          lastName: "B",
        },
      });

      const category = await prisma.category.create({
        data: {
          userId: userB.id,
          name: "Food",
          normalizedName: "food",
          type: "EXPENSE",
        },
      });

      const budget = await create({
        userId: userB.id,
        categoryId: category.id,
        amount: 1000,
        year: 2026,
        month: 10,
        startDate: new Date("2026-10-01"),
      });

      const result = await deleteByIdAndUserId(budget.id, userA.id);

      expect(result).toBeNull();

      const existing = await prisma.budget.findUnique({
        where: { id: budget.id },
      });

      expect(existing).not.toBeNull();
    });
  });

  describe("calculateSpentAmount", () => {
    it("should calculate total expense amount", async () => {
      const user = await prisma.user.create({
        data: {
          email: "budget-repository-spent@example.com",
          passwordHash: "hashed-password",
          firstName: "Test",
          lastName: "User",
        },
      });

      const account = await prisma.account.create({
        data: {
          userId: user.id,
          name: "Main Account",
          type: "BANK",
          balance: 10000,
        },
      });

      const category = await prisma.category.create({
        data: {
          userId: user.id,
          name: "Food",
          normalizedName: "food",
          type: "EXPENSE",
        },
      });

      await prisma.transaction.createMany({
        data: [
          {
            userId: user.id,
            type: "EXPENSE",
            amount: 500,
            description: "Lunch",
            date: new Date("2026-10-15"),
            accountId: account.id,
            categoryId: category.id,
          },
          {
            userId: user.id,
            type: "EXPENSE",
            amount: 200,
            description: "Dinner",
            date: new Date("2026-10-20"),
            accountId: account.id,
            categoryId: category.id,
          },
        ],
      });

      const result = await calculateSpentAmount(
        user.id,
        category.id,
        new Date("2026-10-01"),
        new Date("2026-10-31"),
      );

      expect(Number(result)).toBe(700);
    });

    it("should ignore income transactions", async () => {
      const user = await prisma.user.create({
        data: {
          email: "budget-repository-ignore-income@example.com",
          passwordHash: "hashed-password",
          firstName: "Test",
          lastName: "User",
        },
      });

      const account = await prisma.account.create({
        data: {
          userId: user.id,
          name: "Main Account",
          type: "BANK",
          balance: 10000,
        },
      });

      const category = await prisma.category.create({
        data: {
          userId: user.id,
          name: "Food",
          normalizedName: "food",
          type: "EXPENSE",
        },
      });

      await prisma.transaction.createMany({
        data: [
          {
            userId: user.id,
            type: "EXPENSE",
            amount: 500,
            date: new Date("2026-10-15"),
            accountId: account.id,
            categoryId: category.id,
          },
          {
            userId: user.id,
            type: "INCOME",
            amount: 1000,
            date: new Date("2026-10-20"),
            accountId: account.id,
            categoryId: category.id,
          },
        ],
      });

      const result = await calculateSpentAmount(
        user.id,
        category.id,
        new Date("2026-10-01"),
        new Date("2026-10-31"),
      );

      expect(Number(result)).toBe(500);
    });

    it("should ignore transactions from another category", async () => {
      const user = await prisma.user.create({
        data: {
          email: "budget-repository-ignore-category@example.com",
          passwordHash: "hashed-password",
          firstName: "Test",
          lastName: "User",
        },
      });

      const account = await prisma.account.create({
        data: {
          userId: user.id,
          name: "Main Account",
          type: "BANK",
          balance: 10000,
        },
      });

      const foodCategory = await prisma.category.create({
        data: {
          userId: user.id,
          name: "Food",
          normalizedName: "food",
          type: "EXPENSE",
        },
      });

      const transportCategory = await prisma.category.create({
        data: {
          userId: user.id,
          name: "Transport",
          normalizedName: "transport",
          type: "EXPENSE",
        },
      });

      await prisma.transaction.createMany({
        data: [
          {
            userId: user.id,
            type: "EXPENSE",
            amount: 500,
            date: new Date("2026-10-15"),
            accountId: account.id,
            categoryId: foodCategory.id,
          },
          {
            userId: user.id,
            type: "EXPENSE",
            amount: 700,
            date: new Date("2026-10-20"),
            accountId: account.id,
            categoryId: transportCategory.id,
          },
        ],
      });

      const result = await calculateSpentAmount(
        user.id,
        foodCategory.id,
        new Date("2026-10-01"),
        new Date("2026-10-31"),
      );

      expect(Number(result)).toBe(500);
    });

    it("should ignore transactions from another user", async () => {
      const userA = await prisma.user.create({
        data: {
          email: "budget-repository-spent-user-a@example.com",
          passwordHash: "hashed-password",
          firstName: "User",
          lastName: "A",
        },
      });

      const userB = await prisma.user.create({
        data: {
          email: "budget-repository-spent-user-b@example.com",
          passwordHash: "hashed-password",
          firstName: "User",
          lastName: "B",
        },
      });

      const accountA = await prisma.account.create({
        data: {
          userId: userA.id,
          name: "Account A",
          type: "BANK",
          balance: 10000,
        },
      });

      const accountB = await prisma.account.create({
        data: {
          userId: userB.id,
          name: "Account B",
          type: "BANK",
          balance: 10000,
        },
      });

      const categoryA = await prisma.category.create({
        data: {
          userId: userA.id,
          name: "Food",
          normalizedName: "food",
          type: "EXPENSE",
        },
      });

      const categoryB = await prisma.category.create({
        data: {
          userId: userB.id,
          name: "Food",
          normalizedName: "food",
          type: "EXPENSE",
        },
      });

      await prisma.transaction.createMany({
        data: [
          {
            userId: userA.id,
            type: "EXPENSE",
            amount: 500,
            date: new Date("2026-10-15"),
            accountId: accountA.id,
            categoryId: categoryA.id,
          },
          {
            userId: userB.id,
            type: "EXPENSE",
            amount: 900,
            date: new Date("2026-10-15"),
            accountId: accountB.id,
            categoryId: categoryB.id,
          },
        ],
      });

      const result = await calculateSpentAmount(
        userA.id,
        categoryA.id,
        new Date("2026-10-01"),
        new Date("2026-10-31"),
      );

      expect(Number(result)).toBe(500);
    });

    it("should respect start date", async () => {
      const user = await prisma.user.create({
        data: {
          email: "budget-repository-start-date@example.com",
          passwordHash: "hashed-password",
          firstName: "Test",
          lastName: "User",
        },
      });

      const account = await prisma.account.create({
        data: {
          userId: user.id,
          name: "Main Account",
          type: "BANK",
          balance: 10000,
        },
      });

      const category = await prisma.category.create({
        data: {
          userId: user.id,
          name: "Food",
          normalizedName: "food",
          type: "EXPENSE",
        },
      });

      await prisma.transaction.createMany({
        data: [
          {
            userId: user.id,
            type: "EXPENSE",
            amount: 100,
            date: new Date("2026-10-10"),
            accountId: account.id,
            categoryId: category.id,
          },
          {
            userId: user.id,
            type: "EXPENSE",
            amount: 500,
            date: new Date("2026-10-15"),
            accountId: account.id,
            categoryId: category.id,
          },
        ],
      });

      const result = await calculateSpentAmount(
        user.id,
        category.id,
        new Date("2026-10-15"),
        new Date("2026-10-31"),
      );

      expect(Number(result)).toBe(500);
    });

    it("should respect end date", async () => {
      const user = await prisma.user.create({
        data: {
          email: "budget-repository-end-date@example.com",
          passwordHash: "hashed-password",
          firstName: "Test",
          lastName: "User",
        },
      });

      const account = await prisma.account.create({
        data: {
          userId: user.id,
          name: "Main Account",
          type: "BANK",
          balance: 10000,
        },
      });

      const category = await prisma.category.create({
        data: {
          userId: user.id,
          name: "Food",
          normalizedName: "food",
          type: "EXPENSE",
        },
      });

      await prisma.transaction.createMany({
        data: [
          {
            userId: user.id,
            type: "EXPENSE",
            amount: 500,
            date: new Date("2026-10-31"),
            accountId: account.id,
            categoryId: category.id,
          },
          {
            userId: user.id,
            type: "EXPENSE",
            amount: 700,
            date: new Date("2026-11-01"),
            accountId: account.id,
            categoryId: category.id,
          },
        ],
      });

      const result = await calculateSpentAmount(
        user.id,
        category.id,
        new Date("2026-10-01"),
        new Date("2026-10-31"),
      );

      expect(Number(result)).toBe(500);
    });
  });
});