import { beforeEach, describe, expect, it } from "vitest";

import { Prisma } from "../../../src/generated/prisma/client.js";

import { prisma } from "../../../src/lib/prisma.js";

import {
  getTotalBalance,
  getTotalIncome,
  getTotalExpenses,
  getExpensesByCategory,
  getIncomeByCategory,
  getRecentTransactions,
} from "../../../src/modules/dashboard/dashboard.repository.js";

describe("Dashboard repository", () => {
  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  describe("getTotalBalance", () => {
    it("should return the total balance of the user accounts", async () => {
      const user = await prisma.user.create({
        data: {
          email: "dashboard-balance@example.com",
          passwordHash: "hashed-password",
          firstName: "Test",
          lastName: "User",
        },
      });

      await prisma.account.create({
        data: {
          userId: user.id,
          name: "Bank",
          type: "BANK",
          balance: 1000,
        },
      });

      await prisma.account.create({
        data: {
          userId: user.id,
          name: "Cash",
          type: "CASH",
          balance: 500,
        },
      });

      const totalBalance = await getTotalBalance(user.id);

      expect(totalBalance).toBe(1500);
    });

    it("should not include another user's account balance", async () => {
      const userA = await prisma.user.create({
        data: {
          email: "dashboard-balance-a@example.com",
          passwordHash: "hashed-password",
          firstName: "User",
          lastName: "A",
        },
      });

      const userB = await prisma.user.create({
        data: {
          email: "dashboard-balance-b@example.com",
          passwordHash: "hashed-password",
          firstName: "User",
          lastName: "B",
        },
      });

      await prisma.account.create({
        data: {
          userId: userA.id,
          name: "Account A",
          type: "BANK",
          balance: 1000,
        },
      });

      await prisma.account.create({
        data: {
          userId: userB.id,
          name: "Account B",
          type: "BANK",
          balance: 5000,
        },
      });

      const totalBalance = await getTotalBalance(userA.id);

      expect(totalBalance).toBe(1000);
    });

    it("should return zero when the user has no accounts", async () => {
      const user = await prisma.user.create({
        data: {
          email: "dashboard-balance-empty@example.com",
          passwordHash: "hashed-password",
          firstName: "Test",
          lastName: "User",
        },
      });

      const totalBalance = await getTotalBalance(user.id);

      expect(totalBalance).toBe(0);
    });
  });

  describe("getTotalIncome", () => {
    it("should include transaction exactly on endDate boundary", async () => {
      const user = await prisma.user.create({
        data: {
          email: "dashboard-income-end-boundary@example.com",
          passwordHash: "hashed-password",
          firstName: "Test",
          lastName: "User",
        },
      });
    
      const account = await prisma.account.create({
        data: {
          userId: user.id,
          name: "Bank",
          type: "BANK",
          balance: 5000,
        },
      });
    
      const category = await prisma.category.create({
        data: {
          userId: user.id,
          name: "Salary",
          normalizedName: "salary",
          type: "INCOME",
        },
      });
    
      await prisma.transaction.create({
        data: {
          userId: user.id,
          type: "INCOME",
          amount: new Prisma.Decimal(2000),
          date: new Date("2026-10-31T23:59:59.999Z"),
          accountId: account.id,
          categoryId: category.id,
        },
      });
    
      const totalIncome = await getTotalIncome(user.id, {
        endDate: "2026-10-31",
      });
    
      expect(totalIncome).toBe(2000);
    });
    it("should include transaction exactly on startDate boundary", async () => {
      const user = await prisma.user.create({
        data: {
          email: "dashboard-income-start-boundary@example.com",
          passwordHash: "hashed-password",
          firstName: "Test",
          lastName: "User",
        },
      });
    
      const account = await prisma.account.create({
        data: {
          userId: user.id,
          name: "Bank",
          type: "BANK",
          balance: 5000,
        },
      });
    
      const category = await prisma.category.create({
        data: {
          userId: user.id,
          name: "Salary",
          normalizedName: "salary",
          type: "INCOME",
        },
      });
    
      await prisma.transaction.create({
        data: {
          userId: user.id,
          type: "INCOME",
          amount: new Prisma.Decimal(1000),
          date: new Date("2026-10-01T00:00:00.000Z"),
          accountId: account.id,
          categoryId: category.id,
        },
      });
    
      const totalIncome = await getTotalIncome(user.id, {
        startDate: "2026-10-01",
      });
    
      expect(totalIncome).toBe(1000);
    });
    it("should return the total income of the user", async () => {
      const user = await prisma.user.create({
        data: {
          email: "dashboard-income@example.com",
          passwordHash: "hashed-password",
          firstName: "Test",
          lastName: "User",
        },
      });

      const account = await prisma.account.create({
        data: {
          userId: user.id,
          name: "Bank",
          type: "BANK",
          balance: 5000,
        },
      });

      const category = await prisma.category.create({
        data: {
          userId: user.id,
          name: "Salary",
          normalizedName: "salary",
          type: "INCOME",
        },
      });

      await prisma.transaction.create({
        data: {
          userId: user.id,
          type: "INCOME",
          amount: new Prisma.Decimal(3000),
          date: new Date("2026-10-01T00:00:00.000Z"),
          accountId: account.id,
          categoryId: category.id,
        },
      });

      await prisma.transaction.create({
        data: {
          userId: user.id,
          type: "INCOME",
          amount: new Prisma.Decimal(2000),
          date: new Date("2026-10-05T00:00:00.000Z"),
          accountId: account.id,
          categoryId: category.id,
        },
      });

      const totalIncome = await getTotalIncome(user.id, {});

      expect(totalIncome).toBe(5000);
    });

    it("should apply date filters", async () => {
      const user = await prisma.user.create({
        data: {
          email: "dashboard-income-filter@example.com",
          passwordHash: "hashed-password",
          firstName: "Test",
          lastName: "User",
        },
      });

      const account = await prisma.account.create({
        data: {
          userId: user.id,
          name: "Bank",
          type: "BANK",
          balance: 5000,
        },
      });

      const category = await prisma.category.create({
        data: {
          userId: user.id,
          name: "Salary",
          normalizedName: "salary",
          type: "INCOME",
        },
      });

      await prisma.transaction.create({
        data: {
          userId: user.id,
          type: "INCOME",
          amount: new Prisma.Decimal(1000),
          date: new Date("2026-09-01T00:00:00.000Z"),
          accountId: account.id,
          categoryId: category.id,
        },
      });

      await prisma.transaction.create({
        data: {
          userId: user.id,
          type: "INCOME",
          amount: new Prisma.Decimal(3000),
          date: new Date("2026-10-10T00:00:00.000Z"),
          accountId: account.id,
          categoryId: category.id,
        },
      });

      const totalIncome = await getTotalIncome(user.id, {
        startDate: "2026-10-01",
        endDate: "2026-10-31",
      });

      expect(totalIncome).toBe(3000);
    });

    it("should not include another user's income", async () => {
      const userA = await prisma.user.create({
        data: {
          email: "dashboard-income-owner-a@example.com",
          passwordHash: "hashed-password",
          firstName: "User",
          lastName: "A",
        },
      });

      const userB = await prisma.user.create({
        data: {
          email: "dashboard-income-owner-b@example.com",
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
          balance: 1000,
        },
      });

      const accountB = await prisma.account.create({
        data: {
          userId: userB.id,
          name: "Account B",
          type: "BANK",
          balance: 1000,
        },
      });

      const categoryA = await prisma.category.create({
        data: {
          userId: userA.id,
          name: "Salary",
          normalizedName: "salary",
          type: "INCOME",
        },
      });

      const categoryB = await prisma.category.create({
        data: {
          userId: userB.id,
          name: "Salary",
          normalizedName: "salary",
          type: "INCOME",
        },
      });

      await prisma.transaction.create({
        data: {
          userId: userA.id,
          type: "INCOME",
          amount: new Prisma.Decimal(1000),
          date: new Date("2026-10-01T00:00:00.000Z"),
          accountId: accountA.id,
          categoryId: categoryA.id,
        },
      });

      await prisma.transaction.create({
        data: {
          userId: userB.id,
          type: "INCOME",
          amount: new Prisma.Decimal(5000),
          date: new Date("2026-10-01T00:00:00.000Z"),
          accountId: accountB.id,
          categoryId: categoryB.id,
        },
      });

      const totalIncome = await getTotalIncome(userA.id, {});

      expect(totalIncome).toBe(1000);
    });
it("should apply only startDate filter", async () => {
  const user = await prisma.user.create({
    data: {
      email: "dashboard-income-start-date@example.com",
      passwordHash: "hashed-password",
      firstName: "Test",
      lastName: "User",
    },
  });

  const account = await prisma.account.create({
    data: {
      userId: user.id,
      name: "Bank",
      type: "BANK",
      balance: 5000,
    },
  });

  const category = await prisma.category.create({
    data: {
      userId: user.id,
      name: "Salary",
      normalizedName: "salary",
      type: "INCOME",
    },
  });

  await prisma.transaction.createMany({
    data: [
      {
        userId: user.id,
        type: "INCOME",
        amount: new Prisma.Decimal(1000),
        date: new Date("2026-09-01T00:00:00.000Z"),
        accountId: account.id,
        categoryId: category.id,
      },
      {
        userId: user.id,
        type: "INCOME",
        amount: new Prisma.Decimal(2000),
        date: new Date("2026-10-01T00:00:00.000Z"),
        accountId: account.id,
        categoryId: category.id,
      },
      {
        userId: user.id,
        type: "INCOME",
        amount: new Prisma.Decimal(3000),
        date: new Date("2026-11-01T00:00:00.000Z"),
        accountId: account.id,
        categoryId: category.id,
      },
    ],
  });

  const totalIncome = await getTotalIncome(user.id, {
    startDate: "2026-10-01",
  });

  expect(totalIncome).toBe(5000);
});

    it("should apply only endDate filter", async () => {
      const user = await prisma.user.create({
        data: {
          email: "dashboard-income-end-date@example.com",
          passwordHash: "hashed-password",
          firstName: "Test",
          lastName: "User",
        },
      });
    
      const account = await prisma.account.create({
        data: {
          userId: user.id,
          name: "Bank",
          type: "BANK",
          balance: 5000,
        },
      });
    
      const category = await prisma.category.create({
        data: {
          userId: user.id,
          name: "Salary",
          normalizedName: "salary",
          type: "INCOME",
        },
      });
    
      await prisma.transaction.createMany({
        data: [
          {
            userId: user.id,
            type: "INCOME",
            amount: new Prisma.Decimal(1000),
            date: new Date("2026-09-01T00:00:00.000Z"),
            accountId: account.id,
            categoryId: category.id,
          },
          {
            userId: user.id,
            type: "INCOME",
            amount: new Prisma.Decimal(2000),
            date: new Date("2026-10-01T00:00:00.000Z"),
            accountId: account.id,
            categoryId: category.id,
          },
          {
            userId: user.id,
            type: "INCOME",
            amount: new Prisma.Decimal(3000),
            date: new Date("2026-11-01T00:00:00.000Z"),
            accountId: account.id,
            categoryId: category.id,
          },
        ],
      });
    
      const totalIncome = await getTotalIncome(user.id, {
        endDate: "2026-10-31",
      });
    
      expect(totalIncome).toBe(3000);
    });
    it("should return zero when the user has no income", async () => {
      const user = await prisma.user.create({
        data: {
          email: "dashboard-income-empty@example.com",
          passwordHash: "hashed-password",
          firstName: "Test",
          lastName: "User",
        },
      });

      const totalIncome = await getTotalIncome(user.id, {});

      expect(totalIncome).toBe(0);
    });
    
  });

  describe("getTotalExpenses", () => {
    it("should return the total expenses of the user", async () => {
      const user = await prisma.user.create({
        data: {
          email: "dashboard-expenses@example.com",
          passwordHash: "hashed-password",
          firstName: "Test",
          lastName: "User",
        },
      });

      const account = await prisma.account.create({
        data: {
          userId: user.id,
          name: "Bank",
          type: "BANK",
          balance: 5000,
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

      await prisma.transaction.create({
        data: {
          userId: user.id,
          type: "EXPENSE",
          amount: new Prisma.Decimal(300),
          date: new Date("2026-10-01T00:00:00.000Z"),
          accountId: account.id,
          categoryId: category.id,
        },
      });

      await prisma.transaction.create({
        data: {
          userId: user.id,
          type: "EXPENSE",
          amount: new Prisma.Decimal(200),
          date: new Date("2026-10-05T00:00:00.000Z"),
          accountId: account.id,
          categoryId: category.id,
        },
      });

      const totalExpenses = await getTotalExpenses(user.id, {});

      expect(totalExpenses).toBe(500);
    });

    it("should apply date filters", async () => {
      const user = await prisma.user.create({
        data: {
          email: "dashboard-expenses-filter@example.com",
          passwordHash: "hashed-password",
          firstName: "Test",
          lastName: "User",
        },
      });

      const account = await prisma.account.create({
        data: {
          userId: user.id,
          name: "Bank",
          type: "BANK",
          balance: 5000,
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

      await prisma.transaction.create({
        data: {
          userId: user.id,
          type: "EXPENSE",
          amount: new Prisma.Decimal(100),
          date: new Date("2026-09-01T00:00:00.000Z"),
          accountId: account.id,
          categoryId: category.id,
        },
      });

      await prisma.transaction.create({
        data: {
          userId: user.id,
          type: "EXPENSE",
          amount: new Prisma.Decimal(700),
          date: new Date("2026-10-10T00:00:00.000Z"),
          accountId: account.id,
          categoryId: category.id,
        },
      });

      const totalExpenses = await getTotalExpenses(user.id, {
        startDate: "2026-10-01",
        endDate: "2026-10-31",
      });

      expect(totalExpenses).toBe(700);
    });

    it("should return zero when the user has no expenses", async () => {
      const user = await prisma.user.create({
        data: {
          email: "dashboard-expenses-empty@example.com",
          passwordHash: "hashed-password",
          firstName: "Test",
          lastName: "User",
        },
      });

      const totalExpenses = await getTotalExpenses(user.id, {});

      expect(totalExpenses).toBe(0);
    });
    it("should apply only startDate filter", async () => {
  const user = await prisma.user.create({
    data: {
      email: "dashboard-expenses-start-date@example.com",
      passwordHash: "hashed-password",
      firstName: "Test",
      lastName: "User",
    },
  });

  const account = await prisma.account.create({
    data: {
      userId: user.id,
      name: "Bank",
      type: "BANK",
      balance: 5000,
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
        amount: new Prisma.Decimal(100),
        date: new Date("2026-09-01T00:00:00.000Z"),
        accountId: account.id,
        categoryId: category.id,
      },
      {
        userId: user.id,
        type: "EXPENSE",
        amount: new Prisma.Decimal(200),
        date: new Date("2026-10-01T00:00:00.000Z"),
        accountId: account.id,
        categoryId: category.id,
      },
      {
        userId: user.id,
        type: "EXPENSE",
        amount: new Prisma.Decimal(300),
        date: new Date("2026-11-01T00:00:00.000Z"),
        accountId: account.id,
        categoryId: category.id,
      },
    ],
  });

  const totalExpenses = await getTotalExpenses(user.id, {
    startDate: "2026-10-01",
  });

  expect(totalExpenses).toBe(500);
});
    
    it("should apply only endDate filter", async () => {
      const user = await prisma.user.create({
        data: {
          email: "dashboard-expenses-end-date@example.com",
          passwordHash: "hashed-password",
          firstName: "Test",
          lastName: "User",
        },
      });
    
      const account = await prisma.account.create({
        data: {
          userId: user.id,
          name: "Bank",
          type: "BANK",
          balance: 5000,
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
            amount: new Prisma.Decimal(100),
            date: new Date("2026-09-01T00:00:00.000Z"),
            accountId: account.id,
            categoryId: category.id,
          },
          {
            userId: user.id,
            type: "EXPENSE",
            amount: new Prisma.Decimal(200),
            date: new Date("2026-10-01T00:00:00.000Z"),
            accountId: account.id,
            categoryId: category.id,
          },
          {
            userId: user.id,
            type: "EXPENSE",
            amount: new Prisma.Decimal(300),
            date: new Date("2026-11-01T00:00:00.000Z"),
            accountId: account.id,
            categoryId: category.id,
          },
        ],
      });
    
      const totalExpenses = await getTotalExpenses(user.id, {
        endDate: "2026-10-31",
      });
    
      expect(totalExpenses).toBe(300);
    });
  });

  describe("getExpensesByCategory", () => {
    it("should apply only startDate filter", async () => {
      const user = await prisma.user.create({
        data: {
          email: "dashboard-expense-category-start-date@example.com",
          passwordHash: "hashed-password",
          firstName: "Test",
          lastName: "User",
        },
      });
    
      const account = await prisma.account.create({
        data: {
          userId: user.id,
          name: "Bank",
          type: "BANK",
          balance: 5000,
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
            amount: new Prisma.Decimal(100),
            date: new Date("2026-09-01T00:00:00.000Z"),
            accountId: account.id,
            categoryId: category.id,
          },
          {
            userId: user.id,
            type: "EXPENSE",
            amount: new Prisma.Decimal(200),
            date: new Date("2026-10-01T00:00:00.000Z"),
            accountId: account.id,
            categoryId: category.id,
          },
          {
            userId: user.id,
            type: "EXPENSE",
            amount: new Prisma.Decimal(300),
            date: new Date("2026-11-01T00:00:00.000Z"),
            accountId: account.id,
            categoryId: category.id,
          },
        ],
      });
    
      const result = await getExpensesByCategory(user.id, {
        startDate: "2026-10-01",
      });
    
      expect(result).toEqual([
        {
          categoryId: category.id,
          categoryName: "Food",
          total: "500",
        },
      ]);
    });
    it("should group expenses by category", async () => {
      const user = await prisma.user.create({
        data: {
          email: "dashboard-expense-category@example.com",
          passwordHash: "hashed-password",
          firstName: "Test",
          lastName: "User",
        },
      });

      const account = await prisma.account.create({
        data: {
          userId: user.id,
          name: "Bank",
          type: "BANK",
          balance: 5000,
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

      await prisma.transaction.create({
        data: {
          userId: user.id,
          type: "EXPENSE",
          amount: new Prisma.Decimal(300),
          date: new Date("2026-10-01T00:00:00.000Z"),
          accountId: account.id,
          categoryId: foodCategory.id,
        },
      });

      await prisma.transaction.create({
        data: {
          userId: user.id,
          type: "EXPENSE",
          amount: new Prisma.Decimal(200),
          date: new Date("2026-10-02T00:00:00.000Z"),
          accountId: account.id,
          categoryId: foodCategory.id,
        },
      });

      await prisma.transaction.create({
        data: {
          userId: user.id,
          type: "EXPENSE",
          amount: new Prisma.Decimal(150),
          date: new Date("2026-10-03T00:00:00.000Z"),
          accountId: account.id,
          categoryId: transportCategory.id,
        },
      });

      const result = await getExpensesByCategory(user.id, {});

      expect(result).toHaveLength(2);

      expect(result).toEqual(
        expect.arrayContaining([
          {
            categoryId: foodCategory.id,
            categoryName: "Food",
            total: "500",
          },
          {
            categoryId: transportCategory.id,
            categoryName: "Transport",
            total: "150",
          },
        ]),
      );
    });

    it("should not include income transactions", async () => {
      const user = await prisma.user.create({
        data: {
          email: "dashboard-expense-category-type@example.com",
          passwordHash: "hashed-password",
          firstName: "Test",
          lastName: "User",
        },
      });

      const account = await prisma.account.create({
        data: {
          userId: user.id,
          name: "Bank",
          type: "BANK",
          balance: 5000,
        },
      });

      const expenseCategory = await prisma.category.create({
        data: {
          userId: user.id,
          name: "Food",
          normalizedName: "food",
          type: "EXPENSE",
        },
      });

      const incomeCategory = await prisma.category.create({
        data: {
          userId: user.id,
          name: "Salary",
          normalizedName: "salary",
          type: "INCOME",
        },
      });

      await prisma.transaction.create({
        data: {
          userId: user.id,
          type: "EXPENSE",
          amount: new Prisma.Decimal(300),
          date: new Date("2026-10-01T00:00:00.000Z"),
          accountId: account.id,
          categoryId: expenseCategory.id,
        },
      });

      await prisma.transaction.create({
        data: {
          userId: user.id,
          type: "INCOME",
          amount: new Prisma.Decimal(5000),
          date: new Date("2026-10-01T00:00:00.000Z"),
          accountId: account.id,
          categoryId: incomeCategory.id,
        },
      });

      const result = await getExpensesByCategory(user.id, {});

      expect(result).toHaveLength(1);

      expect(result[0]).toEqual({
        categoryId: expenseCategory.id,
        categoryName: "Food",
        total: "300",
      });
    });

    it("should apply date filters", async () => {
      const user = await prisma.user.create({
        data: {
          email: "dashboard-expense-category-filter@example.com",
          passwordHash: "hashed-password",
          firstName: "Test",
          lastName: "User",
        },
      });

      const account = await prisma.account.create({
        data: {
          userId: user.id,
          name: "Bank",
          type: "BANK",
          balance: 5000,
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

      await prisma.transaction.create({
        data: {
          userId: user.id,
          type: "EXPENSE",
          amount: new Prisma.Decimal(100),
          date: new Date("2026-09-01T00:00:00.000Z"),
          accountId: account.id,
          categoryId: category.id,
        },
      });

      await prisma.transaction.create({
        data: {
          userId: user.id,
          type: "EXPENSE",
          amount: new Prisma.Decimal(400),
          date: new Date("2026-10-01T00:00:00.000Z"),
          accountId: account.id,
          categoryId: category.id,
        },
      });

      const result = await getExpensesByCategory(user.id, {
        startDate: "2026-10-01",
        endDate: "2026-10-31",
      });

      expect(result).toHaveLength(1);
      expect(result[0].total).toBe("400");
    });

    it("should return an empty array when there are no expenses", async () => {
      const user = await prisma.user.create({
        data: {
          email: "dashboard-expense-category-empty@example.com",
          passwordHash: "hashed-password",
          firstName: "Test",
          lastName: "User",
        },
      });

      const result = await getExpensesByCategory(user.id, {});

      expect(result).toEqual([]);
    });
  });

  describe("getIncomeByCategory", () => {
    it("should apply only endDate filter", async () => {
      const user = await prisma.user.create({
        data: {
          email: "dashboard-income-category-end-date@example.com",
          passwordHash: "hashed-password",
          firstName: "Test",
          lastName: "User",
        },
      });
    
      const account = await prisma.account.create({
        data: {
          userId: user.id,
          name: "Bank",
          type: "BANK",
          balance: 5000,
        },
      });
    
      const category = await prisma.category.create({
        data: {
          userId: user.id,
          name: "Salary",
          normalizedName: "salary",
          type: "INCOME",
        },
      });
    
      await prisma.transaction.createMany({
        data: [
          {
            userId: user.id,
            type: "INCOME",
            amount: new Prisma.Decimal(1000),
            date: new Date("2026-09-01T00:00:00.000Z"),
            accountId: account.id,
            categoryId: category.id,
          },
          {
            userId: user.id,
            type: "INCOME",
            amount: new Prisma.Decimal(2000),
            date: new Date("2026-10-01T00:00:00.000Z"),
            accountId: account.id,
            categoryId: category.id,
          },
          {
            userId: user.id,
            type: "INCOME",
            amount: new Prisma.Decimal(3000),
            date: new Date("2026-11-01T00:00:00.000Z"),
            accountId: account.id,
            categoryId: category.id,
          },
        ],
      });
    
      const result = await getIncomeByCategory(user.id, {
        endDate: "2026-10-31",
      });
    
      expect(result).toEqual([
        {
          categoryId: category.id,
          categoryName: "Salary",
          total: "3000",
        },
      ]);
    });
    it("should apply only startDate filter", async () => {
      const user = await prisma.user.create({
        data: {
          email: "dashboard-income-category-start-date@example.com",
          passwordHash: "hashed-password",
          firstName: "Test",
          lastName: "User",
        },
      });
    
      const account = await prisma.account.create({
        data: {
          userId: user.id,
          name: "Bank",
          type: "BANK",
          balance: 5000,
        },
      });
    
      const category = await prisma.category.create({
        data: {
          userId: user.id,
          name: "Salary",
          normalizedName: "salary",
          type: "INCOME",
        },
      });
    
      await prisma.transaction.createMany({
        data: [
          {
            userId: user.id,
            type: "INCOME",
            amount: new Prisma.Decimal(1000),
            date: new Date("2026-09-01T00:00:00.000Z"),
            accountId: account.id,
            categoryId: category.id,
          },
          {
            userId: user.id,
            type: "INCOME",
            amount: new Prisma.Decimal(2000),
            date: new Date("2026-10-01T00:00:00.000Z"),
            accountId: account.id,
            categoryId: category.id,
          },
          {
            userId: user.id,
            type: "INCOME",
            amount: new Prisma.Decimal(3000),
            date: new Date("2026-11-01T00:00:00.000Z"),
            accountId: account.id,
            categoryId: category.id,
          },
        ],
      });
    
      const result = await getIncomeByCategory(user.id, {
        startDate: "2026-10-01",
      });
    
      expect(result).toEqual([
        {
          categoryId: category.id,
          categoryName: "Salary",
          total: "5000",
        },
      ]);
    });
    it("should apply date filters", async () => {
      const user = await prisma.user.create({
        data: {
          email: "dashboard-income-category-filter@example.com",
          passwordHash: "hashed-password",
          firstName: "Test",
          lastName: "User",
        },
      });
    
      const account = await prisma.account.create({
        data: {
          userId: user.id,
          name: "Bank",
          type: "BANK",
          balance: 5000,
        },
      });
    
      const category = await prisma.category.create({
        data: {
          userId: user.id,
          name: "Salary",
          normalizedName: "salary",
          type: "INCOME",
        },
      });
    
      await prisma.transaction.createMany({
        data: [
          {
            userId: user.id,
            type: "INCOME",
            amount: new Prisma.Decimal(1000),
            date: new Date("2026-09-01T00:00:00.000Z"),
            accountId: account.id,
            categoryId: category.id,
          },
          {
            userId: user.id,
            type: "INCOME",
            amount: new Prisma.Decimal(3000),
            date: new Date("2026-10-01T00:00:00.000Z"),
            accountId: account.id,
            categoryId: category.id,
          },
        ],
      });
    
      const result = await getIncomeByCategory(user.id, {
        startDate: "2026-10-01",
        endDate: "2026-10-31",
      });
    
      expect(result).toEqual([
        {
          categoryId: category.id,
          categoryName: "Salary",
          total: "3000",
        },
      ]);
    });
    it("should group income by category", async () => {
      const user = await prisma.user.create({
        data: {
          email: "dashboard-income-category@example.com",
          passwordHash: "hashed-password",
          firstName: "Test",
          lastName: "User",
        },
      });

      const account = await prisma.account.create({
        data: {
          userId: user.id,
          name: "Bank",
          type: "BANK",
          balance: 5000,
        },
      });

      const salaryCategory = await prisma.category.create({
        data: {
          userId: user.id,
          name: "Salary",
          normalizedName: "salary",
          type: "INCOME",
        },
      });

      const freelanceCategory = await prisma.category.create({
        data: {
          userId: user.id,
          name: "Freelance",
          normalizedName: "freelance",
          type: "INCOME",
        },
      });

      await prisma.transaction.create({
        data: {
          userId: user.id,
          type: "INCOME",
          amount: new Prisma.Decimal(3000),
          date: new Date("2026-10-01T00:00:00.000Z"),
          accountId: account.id,
          categoryId: salaryCategory.id,
        },
      });

      await prisma.transaction.create({
        data: {
          userId: user.id,
          type: "INCOME",
          amount: new Prisma.Decimal(1000),
          date: new Date("2026-10-02T00:00:00.000Z"),
          accountId: account.id,
          categoryId: freelanceCategory.id,
        },
      });

      const result = await getIncomeByCategory(user.id, {});

      expect(result).toHaveLength(2);

      expect(result).toEqual(
        expect.arrayContaining([
          {
            categoryId: salaryCategory.id,
            categoryName: "Salary",
            total: "3000",
          },
          {
            categoryId: freelanceCategory.id,
            categoryName: "Freelance",
            total: "1000",
          },
        ]),
      );
    });

    it("should not include expense transactions", async () => {
      const user = await prisma.user.create({
        data: {
          email: "dashboard-income-category-type@example.com",
          passwordHash: "hashed-password",
          firstName: "Test",
          lastName: "User",
        },
      });

      const account = await prisma.account.create({
        data: {
          userId: user.id,
          name: "Bank",
          type: "BANK",
          balance: 5000,
        },
      });

      const incomeCategory = await prisma.category.create({
        data: {
          userId: user.id,
          name: "Salary",
          normalizedName: "salary",
          type: "INCOME",
        },
      });

      const expenseCategory = await prisma.category.create({
        data: {
          userId: user.id,
          name: "Food",
          normalizedName: "food",
          type: "EXPENSE",
        },
      });

      await prisma.transaction.create({
        data: {
          userId: user.id,
          type: "INCOME",
          amount: new Prisma.Decimal(3000),
          date: new Date("2026-10-01T00:00:00.000Z"),
          accountId: account.id,
          categoryId: incomeCategory.id,
        },
      });

      await prisma.transaction.create({
        data: {
          userId: user.id,
          type: "EXPENSE",
          amount: new Prisma.Decimal(500),
          date: new Date("2026-10-01T00:00:00.000Z"),
          accountId: account.id,
          categoryId: expenseCategory.id,
        },
      });

      const result = await getIncomeByCategory(user.id, {});

      expect(result).toHaveLength(1);

      expect(result[0]).toEqual({
        categoryId: incomeCategory.id,
        categoryName: "Salary",
        total: "3000",
      });
    });

    it("should return an empty array when there is no income", async () => {
      const user = await prisma.user.create({
        data: {
          email: "dashboard-income-category-empty@example.com",
          passwordHash: "hashed-password",
          firstName: "Test",
          lastName: "User",
        },
      });

      const result = await getIncomeByCategory(user.id, {});

      expect(result).toEqual([]);
    });
  });

  describe("getRecentTransactions", () => {
    it("should return at most 5 recent transactions by default", async () => {
      const user = await prisma.user.create({
        data: {
          email: "dashboard-recent-limit@example.com",
          passwordHash: "hashed-password",
          firstName: "Test",
          lastName: "User",
        },
      });
    
      const account = await prisma.account.create({
        data: {
          userId: user.id,
          name: "Bank",
          type: "BANK",
          balance: 5000,
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
    
      for (let i = 1; i <= 6; i++) {
        await prisma.transaction.create({
          data: {
            userId: user.id,
            type: "EXPENSE",
            amount: new Prisma.Decimal(i * 100),
            date: new Date(`2026-10-${String(i).padStart(2, "0")}T00:00:00.000Z`),
            accountId: account.id,
            categoryId: category.id,
          },
        });
      }
    
      const result = await getRecentTransactions(user.id, {});
    
      expect(result).toHaveLength(5);
      expect(result.map((transaction) => transaction.amount.toString())).toEqual([
        "600",
        "500",
        "400",
        "300",
        "200",
      ]);
    });
    it("should apply only endDate filter", async () => {
      const user = await prisma.user.create({
        data: {
          email: "dashboard-recent-end-date@example.com",
          passwordHash: "hashed-password",
          firstName: "Test",
          lastName: "User",
        },
      });
    
      const account = await prisma.account.create({
        data: {
          userId: user.id,
          name: "Bank",
          type: "BANK",
          balance: 5000,
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
            amount: new Prisma.Decimal(100),
            date: new Date("2026-09-01T00:00:00.000Z"),
            accountId: account.id,
            categoryId: category.id,
          },
          {
            userId: user.id,
            type: "EXPENSE",
            amount: new Prisma.Decimal(200),
            date: new Date("2026-10-01T00:00:00.000Z"),
            accountId: account.id,
            categoryId: category.id,
          },
          {
            userId: user.id,
            type: "EXPENSE",
            amount: new Prisma.Decimal(300),
            date: new Date("2026-11-01T00:00:00.000Z"),
            accountId: account.id,
            categoryId: category.id,
          },
        ],
      });
    
      const result = await getRecentTransactions(user.id, {
        endDate: "2026-10-31",
      });
    
      expect(result).toHaveLength(2);
      expect(result.map((transaction) => transaction.amount.toString())).toEqual([
        "200",
        "100",
      ]);
    });
    it("should apply only startDate filter", async () => {
      const user = await prisma.user.create({
        data: {
          email: "dashboard-recent-start-date@example.com",
          passwordHash: "hashed-password",
          firstName: "Test",
          lastName: "User",
        },
      });
    
      const account = await prisma.account.create({
        data: {
          userId: user.id,
          name: "Bank",
          type: "BANK",
          balance: 5000,
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
            amount: new Prisma.Decimal(100),
            date: new Date("2026-09-01T00:00:00.000Z"),
            accountId: account.id,
            categoryId: category.id,
          },
          {
            userId: user.id,
            type: "EXPENSE",
            amount: new Prisma.Decimal(200),
            date: new Date("2026-10-01T00:00:00.000Z"),
            accountId: account.id,
            categoryId: category.id,
          },
          {
            userId: user.id,
            type: "EXPENSE",
            amount: new Prisma.Decimal(300),
            date: new Date("2026-11-01T00:00:00.000Z"),
            accountId: account.id,
            categoryId: category.id,
          },
        ],
      });
    
      const result = await getRecentTransactions(user.id, {
        startDate: "2026-10-01",
      });
    
      expect(result).toHaveLength(2);
      expect(result.map((transaction) => transaction.amount.toString())).toEqual([
        "300",
        "200",
      ]);
    });
    it("should return recent transactions ordered by date descending", async () => {
      const user = await prisma.user.create({
        data: {
          email: "dashboard-recent@example.com",
          passwordHash: "hashed-password",
          firstName: "Test",
          lastName: "User",
        },
      });

      const account = await prisma.account.create({
        data: {
          userId: user.id,
          name: "Bank",
          type: "BANK",
          balance: 5000,
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

      const dates = [
        "2026-10-01T00:00:00.000Z",
        "2026-10-03T00:00:00.000Z",
        "2026-10-02T00:00:00.000Z",
      ];

      for (let i = 0; i < dates.length; i++) {
        await prisma.transaction.create({
          data: {
            userId: user.id,
            type: "EXPENSE",
            amount: new Prisma.Decimal((i + 1) * 100),
            date: new Date(dates[i]),
            accountId: account.id,
            categoryId: category.id,
          },
        });
      }

      const result = await getRecentTransactions(user.id, {});

      expect(result).toHaveLength(3);

      expect(
        result.map((transaction) => transaction.date.toISOString()),
      ).toEqual([
        "2026-10-03T00:00:00.000Z",
        "2026-10-02T00:00:00.000Z",
        "2026-10-01T00:00:00.000Z",
      ]);
    });
    it("should return at most 5 recent transactions", async () => {
      const user = await prisma.user.create({
        data: {
          email: "dashboard-recent-limit@example.com",
          passwordHash: "hashed-password",
          firstName: "Test",
          lastName: "User",
        },
      });
    
      const account = await prisma.account.create({
        data: {
          userId: user.id,
          name: "Bank",
          type: "BANK",
          balance: 5000,
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
    
      const dates = [
        "2026-10-01T00:00:00.000Z",
        "2026-10-02T00:00:00.000Z",
        "2026-10-03T00:00:00.000Z",
        "2026-10-04T00:00:00.000Z",
        "2026-10-05T00:00:00.000Z",
        "2026-10-06T00:00:00.000Z",
        "2026-10-07T00:00:00.000Z",
      ];
    
      for (let i = 0; i < dates.length; i++) {
        await prisma.transaction.create({
          data: {
            userId: user.id,
            type: "EXPENSE",
            amount: new Prisma.Decimal((i + 1) * 100),
            date: new Date(dates[i]),
            accountId: account.id,
            categoryId: category.id,
          },
        });
      }
    
      const result = await getRecentTransactions(user.id, {});
    
      expect(result).toHaveLength(5);
    
      expect(
        result.map((transaction) => transaction.date.toISOString()),
      ).toEqual([
        "2026-10-07T00:00:00.000Z",
        "2026-10-06T00:00:00.000Z",
        "2026-10-05T00:00:00.000Z",
        "2026-10-04T00:00:00.000Z",
        "2026-10-03T00:00:00.000Z",
      ]);
    });

    it("should return only the user's transactions", async () => {
      const userA = await prisma.user.create({
        data: {
          email: "dashboard-recent-a@example.com",
          passwordHash: "hashed-password",
          firstName: "User",
          lastName: "A",
        },
      });

      const userB = await prisma.user.create({
        data: {
          email: "dashboard-recent-b@example.com",
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
          balance: 1000,
        },
      });

      const accountB = await prisma.account.create({
        data: {
          userId: userB.id,
          name: "Account B",
          type: "BANK",
          balance: 1000,
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

      await prisma.transaction.create({
        data: {
          userId: userA.id,
          type: "EXPENSE",
          amount: new Prisma.Decimal(100),
          date: new Date("2026-10-01T00:00:00.000Z"),
          accountId: accountA.id,
          categoryId: categoryA.id,
        },
      });

      await prisma.transaction.create({
        data: {
          userId: userB.id,
          type: "EXPENSE",
          amount: new Prisma.Decimal(500),
          date: new Date("2026-10-02T00:00:00.000Z"),
          accountId: accountB.id,
          categoryId: categoryB.id,
        },
      });

      const result = await getRecentTransactions(userA.id, {});

      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe(userA.id);
    });

    it("should apply date filters", async () => {
      const user = await prisma.user.create({
        data: {
          email: "dashboard-recent-filter@example.com",
          passwordHash: "hashed-password",
          firstName: "Test",
          lastName: "User",
        },
      });

      const account = await prisma.account.create({
        data: {
          userId: user.id,
          name: "Bank",
          type: "BANK",
          balance: 5000,
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

      await prisma.transaction.create({
        data: {
          userId: user.id,
          type: "EXPENSE",
          amount: new Prisma.Decimal(100),
          date: new Date("2026-09-01T00:00:00.000Z"),
          accountId: account.id,
          categoryId: category.id,
        },
      });

      await prisma.transaction.create({
        data: {
          userId: user.id,
          type: "EXPENSE",
          amount: new Prisma.Decimal(200),
          date: new Date("2026-10-01T00:00:00.000Z"),
          accountId: account.id,
          categoryId: category.id,
        },
      });

      const result = await getRecentTransactions(user.id, {
        startDate: "2026-10-01",
        endDate: "2026-10-31",
      });

      expect(result).toHaveLength(1);
      expect(result[0].amount.toString()).toBe("200");
    });
    it("should return only recent transactions within the date range", async () => {
      const user = await prisma.user.create({
        data: {
          email: "dashboard-recent-date-range@example.com",
          passwordHash: "hashed-password",
          firstName: "Test",
          lastName: "User",
        },
      });
    
      const account = await prisma.account.create({
        data: {
          userId: user.id,
          name: "Bank",
          type: "BANK",
          balance: 5000,
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
    
      const dates = [
        "2026-09-25T00:00:00.000Z",
        "2026-10-01T00:00:00.000Z",
        "2026-10-10T00:00:00.000Z",
        "2026-10-20T00:00:00.000Z",
        "2026-10-31T00:00:00.000Z",
        "2026-11-05T00:00:00.000Z",
      ];
    
      for (let i = 0; i < dates.length; i++) {
        await prisma.transaction.create({
          data: {
            userId: user.id,
            type: "EXPENSE",
            amount: new Prisma.Decimal((i + 1) * 100),
            date: new Date(dates[i]),
            accountId: account.id,
            categoryId: category.id,
          },
        });
      }
    
      const result = await getRecentTransactions(user.id, {
        startDate: "2026-10-01",
        endDate: "2026-10-31",
      });
    
      expect(result).toHaveLength(4);
    
      expect(
        result.map((transaction) => transaction.date.toISOString()),
      ).toEqual([
        "2026-10-31T00:00:00.000Z",
        "2026-10-20T00:00:00.000Z",
        "2026-10-10T00:00:00.000Z",
        "2026-10-01T00:00:00.000Z",
      ]);
    });

    it("should return an empty array when there are no transactions", async () => {
      const user = await prisma.user.create({
        data: {
          email: "dashboard-recent-empty@example.com",
          passwordHash: "hashed-password",
          firstName: "Test",
          lastName: "User",
        },
      });

      const result = await getRecentTransactions(user.id, {});

      expect(result).toEqual([]);
    });
  });
});
