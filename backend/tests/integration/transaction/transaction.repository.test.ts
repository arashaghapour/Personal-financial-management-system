import { describe, expect, it } from "vitest";

import { prisma } from "../../../src/lib/prisma.js";

import { Prisma } from "../../../src/generated/prisma/client.js";

import { transactionRepository } from "../../../src/modules/transaction/transaction.repository.js";

describe("Transaction repository", () => {
  it("should create a transaction with correct persisted fields", async () => {
    const user = await prisma.user.create({
      data: {
        email: "transaction-repository-create@example.com",
        passwordHash: "hashed-password",
        firstName: "Test",
        lastName: "User",
      },
    });

    const account = await prisma.account.create({
      data: {
        userId: user.id,
        name: "Bank Account",
        type: "BANK",
        balance: 1000,
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

    const date = new Date("2026-09-20T00:00:00.000Z");

    const transaction = await transactionRepository.create({
      userId: user.id,
      type: "EXPENSE",
      amount: new Prisma.Decimal(250),
      description: "Lunch",
      date,
      accountId: account.id,
      categoryId: category.id,
    });

    expect(transaction.id).toEqual(expect.any(String));
    expect(transaction.userId).toBe(user.id);
    expect(transaction.type).toBe("EXPENSE");
    expect(transaction.amount.toString()).toBe("250");
    expect(transaction.description).toBe("Lunch");
    expect(transaction.date).toEqual(date);
    expect(transaction.accountId).toBe(account.id);
    expect(transaction.categoryId).toBe(category.id);
    expect(transaction.createdAt).toEqual(expect.any(Date));
    expect(transaction.updatedAt).toEqual(expect.any(Date));
  });

  it("should persist the transaction relations", async () => {
    const user = await prisma.user.create({
      data: {
        email: "transaction-repository-relations@example.com",
        passwordHash: "hashed-password",
        firstName: "Test",
        lastName: "User",
      },
    });

    const account = await prisma.account.create({
      data: {
        userId: user.id,
        name: "Cash",
        type: "CASH",
        balance: 500,
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

    const transaction = await transactionRepository.create({
      userId: user.id,
      type: "INCOME",
      amount: new Prisma.Decimal(3000),
      description: "Monthly salary",
      date: new Date("2026-09-01T00:00:00.000Z"),
      accountId: account.id,
      categoryId: category.id,
    });

    const transactionWithRelations =
      await prisma.transaction.findUnique({
        where: {
          id: transaction.id,
        },
        include: {
          user: true,
          account: true,
          category: true,
        },
      });

    expect(transactionWithRelations).not.toBeNull();

    expect(transactionWithRelations?.user.id).toBe(user.id);
    expect(transactionWithRelations?.account.id).toBe(account.id);
    expect(transactionWithRelations?.category.id).toBe(category.id);
  });

  it("should return only the user's transactions from findMany", async () => {
    const userA = await prisma.user.create({
      data: {
        email: "transaction-repository-find-many-a@example.com",
        passwordHash: "hashed-password",
        firstName: "User",
        lastName: "A",
      },
    });

    const userB = await prisma.user.create({
      data: {
        email: "transaction-repository-find-many-b@example.com",
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

    await transactionRepository.create({
      userId: userA.id,
      type: "EXPENSE",
      amount: new Prisma.Decimal(100),
      date: new Date("2026-09-10T00:00:00.000Z"),
      accountId: accountA.id,
      categoryId: categoryA.id,
    });

    await transactionRepository.create({
      userId: userB.id,
      type: "EXPENSE",
      amount: new Prisma.Decimal(200),
      date: new Date("2026-09-11T00:00:00.000Z"),
      accountId: accountB.id,
      categoryId: categoryB.id,
    });

    const transactions = await transactionRepository.findMany(
      {
        userId: userA.id,
      },
      {
        page: 1,
        limit: 20,
      },
      "date_desc",
    );

    expect(transactions).toHaveLength(1);
    expect(transactions[0].userId).toBe(userA.id);
  });

  it("should apply filters in findMany", async () => {
    const user = await prisma.user.create({
      data: {
        email: "transaction-repository-filters@example.com",
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

    await transactionRepository.create({
      userId: user.id,
      type: "EXPENSE",
      amount: new Prisma.Decimal(100),
      date: new Date("2026-09-10T00:00:00.000Z"),
      accountId: account.id,
      categoryId: expenseCategory.id,
    });

    await transactionRepository.create({
      userId: user.id,
      type: "INCOME",
      amount: new Prisma.Decimal(3000),
      date: new Date("2026-09-15T00:00:00.000Z"),
      accountId: account.id,
      categoryId: incomeCategory.id,
    });

    const transactions = await transactionRepository.findMany(
      {
        userId: user.id,
        type: "EXPENSE",
        minAmount: new Prisma.Decimal(50),
        maxAmount: new Prisma.Decimal(150),
        startDate: new Date("2026-09-01T00:00:00.000Z"),
        endDate: new Date("2026-09-30T00:00:00.000Z"),
      },
      {
        page: 1,
        limit: 20,
      },
      "date_desc",
    );

    expect(transactions).toHaveLength(1);
    expect(transactions[0].type).toBe("EXPENSE");
    expect(transactions[0].amount.toString()).toBe("100");
  });

  it("should apply pagination in findMany", async () => {
    const user = await prisma.user.create({
      data: {
        email: "transaction-repository-pagination@example.com",
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

    for (let i = 1; i <= 5; i++) {
      await transactionRepository.create({
        userId: user.id,
        type: "EXPENSE",
        amount: new Prisma.Decimal(i * 100),
        date: new Date(`2026-09-${String(i).padStart(2, "0")}T00:00:00.000Z`),
        accountId: account.id,
        categoryId: category.id,
      });
    }

    const transactions = await transactionRepository.findMany(
      {
        userId: user.id,
      },
      {
        page: 2,
        limit: 2,
      },
      "date_asc",
    );

    expect(transactions).toHaveLength(2);
    expect(transactions[0].amount.toString()).toBe("300");
    expect(transactions[1].amount.toString()).toBe("400");
  });

  it("should apply sorting in findMany", async () => {
    const user = await prisma.user.create({
      data: {
        email: "transaction-repository-sorting@example.com",
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

    await transactionRepository.create({
      userId: user.id,
      type: "EXPENSE",
      amount: new Prisma.Decimal(300),
      date: new Date("2026-09-03T00:00:00.000Z"),
      accountId: account.id,
      categoryId: category.id,
    });

    await transactionRepository.create({
      userId: user.id,
      type: "EXPENSE",
      amount: new Prisma.Decimal(100),
      date: new Date("2026-09-01T00:00:00.000Z"),
      accountId: account.id,
      categoryId: category.id,
    });

    await transactionRepository.create({
      userId: user.id,
      type: "EXPENSE",
      amount: new Prisma.Decimal(200),
      date: new Date("2026-09-02T00:00:00.000Z"),
      accountId: account.id,
      categoryId: category.id,
    });

    const transactions = await transactionRepository.findMany(
      {
        userId: user.id,
      },
      {
        page: 1,
        limit: 20,
      },
      "amount_asc",
    );

    expect(
      transactions.map((transaction) =>
        transaction.amount.toString(),
      ),
    ).toEqual(["100", "200", "300"]);
  });

  it("should count only the user's transactions", async () => {
    const userA = await prisma.user.create({
      data: {
        email: "transaction-repository-count-a@example.com",
        passwordHash: "hashed-password",
        firstName: "User",
        lastName: "A",
      },
    });

    const userB = await prisma.user.create({
      data: {
        email: "transaction-repository-count-b@example.com",
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

    await transactionRepository.create({
      userId: userA.id,
      type: "EXPENSE",
      amount: new Prisma.Decimal(100),
      date: new Date("2026-09-01T00:00:00.000Z"),
      accountId: accountA.id,
      categoryId: categoryA.id,
    });

    await transactionRepository.create({
      userId: userA.id,
      type: "EXPENSE",
      amount: new Prisma.Decimal(200),
      date: new Date("2026-09-02T00:00:00.000Z"),
      accountId: accountA.id,
      categoryId: categoryA.id,
    });

    await transactionRepository.create({
      userId: userB.id,
      type: "EXPENSE",
      amount: new Prisma.Decimal(300),
      date: new Date("2026-09-03T00:00:00.000Z"),
      accountId: accountB.id,
      categoryId: categoryB.id,
    });

    const count = await transactionRepository.count({
      userId: userA.id,
    });

    expect(count).toBe(2);
  });

  it("should apply filters in count", async () => {
    const user = await prisma.user.create({
      data: {
        email: "transaction-repository-count-filters@example.com",
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

    await transactionRepository.create({
      userId: user.id,
      type: "EXPENSE",
      amount: new Prisma.Decimal(100),
      date: new Date("2026-09-05T00:00:00.000Z"),
      accountId: account.id,
      categoryId: category.id,
    });

    await transactionRepository.create({
      userId: user.id,
      type: "EXPENSE",
      amount: new Prisma.Decimal(500),
      date: new Date("2026-09-10T00:00:00.000Z"),
      accountId: account.id,
      categoryId: category.id,
    });

    const count = await transactionRepository.count({
      userId: user.id,
      minAmount: new Prisma.Decimal(400),
    });

    expect(count).toBe(1);
  });

  it("should find a transaction by id and userId", async () => {
    const user = await prisma.user.create({
      data: {
        email: "transaction-repository-find-by-id@example.com",
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
        balance: 1000,
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

    const created = await transactionRepository.create({
      userId: user.id,
      type: "EXPENSE",
      amount: new Prisma.Decimal(100),
      date: new Date("2026-09-10T00:00:00.000Z"),
      accountId: account.id,
      categoryId: category.id,
    });

    const transaction =
      await transactionRepository.findByIdAndUserId(
        created.id,
        user.id,
      );

    expect(transaction).not.toBeNull();
    expect(transaction?.id).toBe(created.id);
    expect(transaction?.userId).toBe(user.id);
  });

  it("should not find another user's transaction", async () => {
    const userA = await prisma.user.create({
      data: {
        email: "transaction-repository-ownership-a@example.com",
        passwordHash: "hashed-password",
        firstName: "User",
        lastName: "A",
      },
    });

    const userB = await prisma.user.create({
      data: {
        email: "transaction-repository-ownership-b@example.com",
        passwordHash: "hashed-password",
        firstName: "User",
        lastName: "B",
      },
    });

    const account = await prisma.account.create({
      data: {
        userId: userA.id,
        name: "Bank",
        type: "BANK",
        balance: 1000,
      },
    });

    const category = await prisma.category.create({
      data: {
        userId: userA.id,
        name: "Food",
        normalizedName: "food",
        type: "EXPENSE",
      },
    });

    const created = await transactionRepository.create({
      userId: userA.id,
      type: "EXPENSE",
      amount: new Prisma.Decimal(100),
      date: new Date("2026-09-10T00:00:00.000Z"),
      accountId: account.id,
      categoryId: category.id,
    });

    const transaction =
      await transactionRepository.findByIdAndUserId(
        created.id,
        userB.id,
      );

    expect(transaction).toBeNull();
  });

  it("should update a transaction belonging to the user", async () => {
    const user = await prisma.user.create({
      data: {
        email: "transaction-repository-update@example.com",
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
        balance: 1000,
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

    const created = await transactionRepository.create({
      userId: user.id,
      type: "EXPENSE",
      amount: new Prisma.Decimal(100),
      description: "Old description",
      date: new Date("2026-09-10T00:00:00.000Z"),
      accountId: account.id,
      categoryId: category.id,
    });

    const updated =
      await transactionRepository.updateByIdAndUserId(
        created.id,
        user.id,
        {
          amount: new Prisma.Decimal(200),
          description: "Updated description",
        },
      );

    expect(updated).not.toBeNull();
    expect(updated?.amount.toString()).toBe("200");
    expect(updated?.description).toBe("Updated description");
  });

  it("should not update another user's transaction", async () => {
    const userA = await prisma.user.create({
      data: {
        email: "transaction-repository-update-owner-a@example.com",
        passwordHash: "hashed-password",
        firstName: "User",
        lastName: "A",
      },
    });

    const userB = await prisma.user.create({
      data: {
        email: "transaction-repository-update-owner-b@example.com",
        passwordHash: "hashed-password",
        firstName: "User",
        lastName: "B",
      },
    });

    const account = await prisma.account.create({
      data: {
        userId: userA.id,
        name: "Bank",
        type: "BANK",
        balance: 1000,
      },
    });

    const category = await prisma.category.create({
      data: {
        userId: userA.id,
        name: "Food",
        normalizedName: "food",
        type: "EXPENSE",
      },
    });

    const created = await transactionRepository.create({
      userId: userA.id,
      type: "EXPENSE",
      amount: new Prisma.Decimal(100),
      date: new Date("2026-09-10T00:00:00.000Z"),
      accountId: account.id,
      categoryId: category.id,
    });

    const updated =
      await transactionRepository.updateByIdAndUserId(
        created.id,
        userB.id,
        {
          amount: new Prisma.Decimal(999),
        },
      );

    expect(updated).toBeNull();

    const transaction = await prisma.transaction.findUnique({
      where: {
        id: created.id,
      },
    });

    expect(transaction?.amount.toString()).toBe("100");
  });

  it("should delete a transaction belonging to the user", async () => {
    const user = await prisma.user.create({
      data: {
        email: "transaction-repository-delete@example.com",
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
        balance: 1000,
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

    const created = await transactionRepository.create({
      userId: user.id,
      type: "EXPENSE",
      amount: new Prisma.Decimal(100),
      date: new Date("2026-09-10T00:00:00.000Z"),
      accountId: account.id,
      categoryId: category.id,
    });

    const deleted =
      await transactionRepository.deleteByIdAndUserId(
        created.id,
        user.id,
      );

    expect(deleted).not.toBeNull();
    expect(deleted?.id).toBe(created.id);

    const transaction = await prisma.transaction.findUnique({
      where: {
        id: created.id,
      },
    });

    expect(transaction).toBeNull();
  });

  it("should not delete another user's transaction", async () => {
    const userA = await prisma.user.create({
      data: {
        email: "transaction-repository-delete-owner-a@example.com",
        passwordHash: "hashed-password",
        firstName: "User",
        lastName: "A",
      },
    });

    const userB = await prisma.user.create({
      data: {
        email: "transaction-repository-delete-owner-b@example.com",
        passwordHash: "hashed-password",
        firstName: "User",
        lastName: "B",
      },
    });

    const account = await prisma.account.create({
      data: {
        userId: userA.id,
        name: "Bank",
        type: "BANK",
        balance: 1000,
      },
    });

    const category = await prisma.category.create({
      data: {
        userId: userA.id,
        name: "Food",
        normalizedName: "food",
        type: "EXPENSE",
      },
    });

    const created = await transactionRepository.create({
      userId: userA.id,
      type: "EXPENSE",
      amount: new Prisma.Decimal(100),
      date: new Date("2026-09-10T00:00:00.000Z"),
      accountId: account.id,
      categoryId: category.id,
    });

    const deleted =
      await transactionRepository.deleteByIdAndUserId(
        created.id,
        userB.id,
      );

    expect(deleted).toBeNull();

    const transaction = await prisma.transaction.findUnique({
      where: {
        id: created.id,
      },
    });

    expect(transaction).not.toBeNull();
    expect(transaction?.userId).toBe(userA.id);
  });
});