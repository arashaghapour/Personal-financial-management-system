import { beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../../../src/lib/prisma.js";
import { getBudgetProgress } from "../../../src/modules/budget/budget.service.js";

describe("Budget progress - transaction interaction", () => {
  beforeEach(async () => {
    await prisma.transaction.deleteMany();
    await prisma.budget.deleteMany();
    await prisma.category.deleteMany();
    await prisma.account.deleteMany();
    await prisma.user.deleteMany();
  });

  it("should count EXPENSE transactions with the same category", async () => {
    const user = await prisma.user.create({
      data: {
        email: "budget-progress-expense@example.com",
        passwordHash: "hashed-password",
        firstName: "Arash",
        lastName: "Test",
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

    const account = await prisma.account.create({
      data: {
        userId: user.id,
        name: "Cash",
        type: "CASH",
        balance: 1000000,
      },
    });

    const budget = await prisma.budget.create({
      data: {
        userId: user.id,
        categoryId: category.id,
        amount: 1000,
        year: 2026,
        month: 10,
        startDate: new Date("2026-10-01"),
      },
    });

    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "EXPENSE",
        amount: 500,
        description: "Food",
        date: new Date("2026-10-10"),
        accountId: account.id,
        categoryId: category.id,
      },
    });

    const progress = await getBudgetProgress(user.id, budget.id);

    expect(progress.spentAmount).toBe(500);
  });

  it("should not count INCOME transactions with the same category", async () => {
    const user = await prisma.user.create({
      data: {
        email: "budget-progress-income@example.com",
        passwordHash: "hashed-password",
        firstName: "Arash",
        lastName: "Test",
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

    const account = await prisma.account.create({
      data: {
        userId: user.id,
        name: "Cash",
        type: "CASH",
        balance: 1000000,
      },
    });

    const budget = await prisma.budget.create({
      data: {
        userId: user.id,
        categoryId: category.id,
        amount: 1000,
        year: 2026,
        month: 10,
        startDate: new Date("2026-10-01"),
      },
    });

    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "INCOME",
        amount: 500,
        description: "Income",
        date: new Date("2026-10-10"),
        accountId: account.id,
        categoryId: category.id,
      },
    });

    const progress = await getBudgetProgress(user.id, budget.id);

    expect(progress.spentAmount).toBe(0);
  });

  it("should not count EXPENSE transactions with a different category", async () => {
    const user = await prisma.user.create({
      data: {
        email: "budget-progress-different-category@example.com",
        passwordHash: "hashed-password",
        firstName: "Arash",
        lastName: "Test",
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

    const account = await prisma.account.create({
      data: {
        userId: user.id,
        name: "Cash",
        type: "CASH",
        balance: 1000000,
      },
    });

    const budget = await prisma.budget.create({
      data: {
        userId: user.id,
        categoryId: foodCategory.id,
        amount: 1000,
        year: 2026,
        month: 10,
        startDate: new Date("2026-10-01"),
      },
    });

    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "EXPENSE",
        amount: 500,
        description: "Transport",
        date: new Date("2026-10-10"),
        accountId: account.id,
        categoryId: transportCategory.id,
      },
    });

    const progress = await getBudgetProgress(user.id, budget.id);

    expect(progress.spentAmount).toBe(0);
  });

  it("should not count another user's transaction", async () => {
    const user = await prisma.user.create({
      data: {
        email: "budget-progress-user@example.com",
        passwordHash: "hashed-password",
        firstName: "Arash",
        lastName: "User",
      },
    });

    const anotherUser = await prisma.user.create({
      data: {
        email: "budget-progress-other-user@example.com",
        passwordHash: "hashed-password",
        firstName: "Other",
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

    const anotherUserCategory = await prisma.category.create({
      data: {
        userId: anotherUser.id,
        name: "Food",
        normalizedName: "food",
        type: "EXPENSE",
      },
    });

    const account = await prisma.account.create({
      data: {
        userId: anotherUser.id,
        name: "Cash",
        type: "CASH",
        balance: 1000000,
      },
    });

    const budget = await prisma.budget.create({
      data: {
        userId: user.id,
        categoryId: category.id,
        amount: 1000,
        year: 2026,
        month: 10,
        startDate: new Date("2026-10-01"),
      },
    });

    await prisma.transaction.create({
      data: {
        userId: anotherUser.id,
        type: "EXPENSE",
        amount: 500,
        description: "Other user's food",
        date: new Date("2026-10-10"),
        accountId: account.id,
        categoryId: anotherUserCategory.id,
      },
    });

    const progress = await getBudgetProgress(user.id, budget.id);

    expect(progress.spentAmount).toBe(0);
  });

  it("should sum all matching EXPENSE transactions", async () => {
    const user = await prisma.user.create({
      data: {
        email: "budget-progress-sum@example.com",
        passwordHash: "hashed-password",
        firstName: "Arash",
        lastName: "Test",
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
  
    const account = await prisma.account.create({
      data: {
        userId: user.id,
        name: "Cash",
        type: "CASH",
        balance: 1000000,
      },
    });
  
    const budget = await prisma.budget.create({
      data: {
        userId: user.id,
        categoryId: category.id,
        amount: 2000,
        year: 2026,
        month: 10,
        startDate: new Date("2026-10-01"),
      },
    });
  
    await prisma.transaction.createMany({
      data: [
        {
          userId: user.id,
          type: "EXPENSE",
          amount: 500,
          description: "Food 1",
          date: new Date("2026-10-05"),
          accountId: account.id,
          categoryId: category.id,
        },
        {
          userId: user.id,
          type: "EXPENSE",
          amount: 200,
          description: "Food 2",
          date: new Date("2026-10-10"),
          accountId: account.id,
          categoryId: category.id,
        },
        {
          userId: user.id,
          type: "EXPENSE",
          amount: 300,
          description: "Food 3",
          date: new Date("2026-10-20"),
          accountId: account.id,
          categoryId: category.id,
        },
      ],
    });
  
    const progress = await getBudgetProgress(user.id, budget.id);
  
    expect(progress.spentAmount).toBe(1000);
  });

  it("should not count transactions before budget startDate", async () => {
    const user = await prisma.user.create({
      data: {
        email: "budget-mid-month-before@example.com",
        passwordHash: "hashed-password",
        firstName: "Arash",
        lastName: "Test",
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
  
    const account = await prisma.account.create({
      data: {
        userId: user.id,
        name: "Cash",
        type: "CASH",
        balance: 1000000,
      },
    });
  
    const budget = await prisma.budget.create({
      data: {
        userId: user.id,
        categoryId: category.id,
        amount: 1000,
        year: 2026,
        month: 10,
        startDate: new Date("2026-10-15"),
      },
    });
  
    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "EXPENSE",
        amount: 500,
        description: "Before budget start",
        date: new Date("2026-10-10"),
        accountId: account.id,
        categoryId: category.id,
      },
    });
  
    const progress = await getBudgetProgress(user.id, budget.id);
  
    expect(progress.spentAmount).toBe(0);
  });

  it("should count a transaction on the budget startDate", async () => {
    const user = await prisma.user.create({
      data: {
        email: "budget-mid-month-start@example.com",
        passwordHash: "hashed-password",
        firstName: "Arash",
        lastName: "Test",
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
  
    const account = await prisma.account.create({
      data: {
        userId: user.id,
        name: "Cash",
        type: "CASH",
        balance: 1000000,
      },
    });
  
    const budget = await prisma.budget.create({
      data: {
        userId: user.id,
        categoryId: category.id,
        amount: 1000,
        year: 2026,
        month: 10,
        startDate: new Date("2026-10-15"),
      },
    });
  
    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "EXPENSE",
        amount: 500,
        description: "On budget start",
        date: new Date("2026-10-15"),
        accountId: account.id,
        categoryId: category.id,
      },
    });
  
    const progress = await getBudgetProgress(user.id, budget.id);
  
    expect(progress.spentAmount).toBe(500);
  });
  
  it("should count transactions after budget startDate", async () => {
    const user = await prisma.user.create({
      data: {
        email: "budget-mid-month-after@example.com",
        passwordHash: "hashed-password",
        firstName: "Arash",
        lastName: "Test",
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
  
    const account = await prisma.account.create({
      data: {
        userId: user.id,
        name: "Cash",
        type: "CASH",
        balance: 1000000,
      },
    });
  
    const budget = await prisma.budget.create({
      data: {
        userId: user.id,
        categoryId: category.id,
        amount: 1000,
        year: 2026,
        month: 10,
        startDate: new Date("2026-10-15"),
      },
    });
  
    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "EXPENSE",
        amount: 500,
        description: "After budget start",
        date: new Date("2026-10-20"),
        accountId: account.id,
        categoryId: category.id,
      },
    });
  
    const progress = await getBudgetProgress(user.id, budget.id);
  
    expect(progress.spentAmount).toBe(500);
  });

  it("should count only transactions from budget startDate onward", async () => {
    const user = await prisma.user.create({
      data: {
        email: "budget-mid-month-range@example.com",
        passwordHash: "hashed-password",
        firstName: "Arash",
        lastName: "Test",
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
  
    const account = await prisma.account.create({
      data: {
        userId: user.id,
        name: "Cash",
        type: "CASH",
        balance: 1000000,
      },
    });
  
    const budget = await prisma.budget.create({
      data: {
        userId: user.id,
        categoryId: category.id,
        amount: 2000,
        year: 2026,
        month: 10,
        startDate: new Date("2026-10-15"),
      },
    });
  
    await prisma.transaction.createMany({
      data: [
        {
          userId: user.id,
          type: "EXPENSE",
          amount: 500,
          description: "Before start",
          date: new Date("2026-10-10"),
          accountId: account.id,
          categoryId: category.id,
        },
        {
          userId: user.id,
          type: "EXPENSE",
          amount: 300,
          description: "On start",
          date: new Date("2026-10-15"),
          accountId: account.id,
          categoryId: category.id,
        },
        {
          userId: user.id,
          type: "EXPENSE",
          amount: 200,
          description: "After start",
          date: new Date("2026-10-20"),
          accountId: account.id,
          categoryId: category.id,
        },
      ],
    });
  
    const progress = await getBudgetProgress(user.id, budget.id);
  
    expect(progress.spentAmount).toBe(500);
  });

  it("should not count transactions after the budget month", async () => {
    const user = await prisma.user.create({
      data: {
        email: "budget-mid-month-end@example.com",
        passwordHash: "hashed-password",
        firstName: "Arash",
        lastName: "Test",
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
  
    const account = await prisma.account.create({
      data: {
        userId: user.id,
        name: "Cash",
        type: "CASH",
        balance: 1000000,
      },
    });
  
    const budget = await prisma.budget.create({
      data: {
        userId: user.id,
        categoryId: category.id,
        amount: 2000,
        year: 2026,
        month: 10,
        startDate: new Date("2026-10-15"),
      },
    });
  
    await prisma.transaction.createMany({
      data: [
        {
          userId: user.id,
          type: "EXPENSE",
          amount: 300,
          description: "October transaction",
          date: new Date("2026-10-20"),
          accountId: account.id,
          categoryId: category.id,
        },
        {
          userId: user.id,
          type: "EXPENSE",
          amount: 500,
          description: "November transaction",
          date: new Date("2026-11-01"),
          accountId: account.id,
          categoryId: category.id,
        },
      ],
    });
  
    const progress = await getBudgetProgress(user.id, budget.id);
  
    expect(progress.spentAmount).toBe(300);
  });
  
});  