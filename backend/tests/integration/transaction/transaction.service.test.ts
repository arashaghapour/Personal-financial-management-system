import { describe, expect, it } from "vitest";

import { prisma } from "../../../src/lib/prisma.js";

import {
  createTransaction,
  deleteTransaction,
} from "../../../src/modules/transaction/transaction.service.js";

describe("Transaction service - create", () => {
  it("should create an INCOME transaction and increase account balance", async () => {
    const user = await prisma.user.create({
      data: {
        email: "transaction-service-income@example.com",
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
        name: "Salary",
        normalizedName: "salary",
        type: "INCOME",
      },
    });

    const transaction = await createTransaction(user.id, {
      type: "INCOME",
      accountId: account.id,
      categoryId: category.id,
      amount: 500,
      description: "Monthly salary",
      date: "2026-09-20",
    });

    expect(transaction.userId).toBe(user.id);
    expect(transaction.type).toBe("INCOME");
    expect(transaction.amount.toString()).toBe("500");
    expect(transaction.accountId).toBe(account.id);
    expect(transaction.categoryId).toBe(category.id);
    expect(transaction.description).toBe("Monthly salary");

    const updatedAccount = await prisma.account.findUnique({
      where: {
        id: account.id,
      },
    });

    expect(updatedAccount?.balance.toString()).toBe("1500");
  });

  it("should create an EXPENSE transaction and decrease account balance", async () => {
    const user = await prisma.user.create({
      data: {
        email: "transaction-service-expense@example.com",
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

    const transaction = await createTransaction(user.id, {
      type: "EXPENSE",
      accountId: account.id,
      categoryId: category.id,
      amount: 300,
      description: "Groceries",
      date: "2026-09-20",
    });

    expect(transaction.userId).toBe(user.id);
    expect(transaction.type).toBe("EXPENSE");
    expect(transaction.amount.toString()).toBe("300");
    expect(transaction.accountId).toBe(account.id);
    expect(transaction.categoryId).toBe(category.id);
    expect(transaction.description).toBe("Groceries");

    const updatedAccount = await prisma.account.findUnique({
      where: {
        id: account.id,
      },
    });

    expect(updatedAccount?.balance.toString()).toBe("700");
  });

  it("should reject an EXPENSE when account balance is insufficient", async () => {
    const user = await prisma.user.create({
      data: {
        email: "transaction-service-insufficient@example.com",
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
        balance: 100,
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

    await expect(
      createTransaction(user.id, {
        type: "EXPENSE",
        accountId: account.id,
        categoryId: category.id,
        amount: 200,
        description: "Groceries",
        date: "2026-09-20",
      }),
    ).rejects.toMatchObject({
      statusCode: 400,
      code: "INSUFFICIENT_BALANCE",
    });

    const updatedAccount = await prisma.account.findUnique({
      where: {
        id: account.id,
      },
    });

    expect(updatedAccount?.balance.toString()).toBe("100");

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
      },
    });

    expect(transactions).toHaveLength(0);
  });

  it("should reject the transaction when account does not belong to the user", async () => {
    const userA = await prisma.user.create({
      data: {
        email: "transaction-service-account-owner-a@example.com",
        passwordHash: "hashed-password",
        firstName: "User",
        lastName: "A",
      },
    });

    const userB = await prisma.user.create({
      data: {
        email: "transaction-service-account-owner-b@example.com",
        passwordHash: "hashed-password",
        firstName: "User",
        lastName: "B",
      },
    });

    const account = await prisma.account.create({
      data: {
        userId: userB.id,
        name: "Bank Account",
        type: "BANK",
        balance: 1000,
      },
    });

    const category = await prisma.category.create({
      data: {
        userId: userA.id,
        name: "Salary",
        normalizedName: "salary",
        type: "INCOME",
      },
    });

    await expect(
      createTransaction(userA.id, {
        type: "INCOME",
        accountId: account.id,
        categoryId: category.id,
        amount: 500,
        date: "2026-09-20",
      }),
    ).rejects.toMatchObject({
      statusCode: 404,
      code: "ACCOUNT_NOT_FOUND",
    });

    const transactions = await prisma.transaction.findMany();

    expect(transactions).toHaveLength(0);

    const unchangedAccount = await prisma.account.findUnique({
      where: {
        id: account.id,
      },
    });

    expect(unchangedAccount?.balance.toString()).toBe("1000");
  });

  it("should reject the transaction when category does not belong to the user", async () => {
    const userA = await prisma.user.create({
      data: {
        email: "transaction-service-category-owner-a@example.com",
        passwordHash: "hashed-password",
        firstName: "User",
        lastName: "A",
      },
    });

    const userB = await prisma.user.create({
      data: {
        email: "transaction-service-category-owner-b@example.com",
        passwordHash: "hashed-password",
        firstName: "User",
        lastName: "B",
      },
    });

    const account = await prisma.account.create({
      data: {
        userId: userA.id,
        name: "Bank Account",
        type: "BANK",
        balance: 1000,
      },
    });

    const category = await prisma.category.create({
      data: {
        userId: userB.id,
        name: "Salary",
        normalizedName: "salary",
        type: "INCOME",
      },
    });

    await expect(
      createTransaction(userA.id, {
        type: "INCOME",
        accountId: account.id,
        categoryId: category.id,
        amount: 500,
        date: "2026-09-20",
      }),
    ).rejects.toMatchObject({
      statusCode: 404,
      code: "CATEGORY_NOT_FOUND",
    });

    const transactions = await prisma.transaction.findMany();

    expect(transactions).toHaveLength(0);

    const unchangedAccount = await prisma.account.findUnique({
      where: {
        id: account.id,
      },
    });

    expect(unchangedAccount?.balance.toString()).toBe("1000");
  });

  it("should reject the transaction when category type does not match transaction type", async () => {
    const user = await prisma.user.create({
      data: {
        email: "transaction-service-category-type@example.com",
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

    await expect(
      createTransaction(user.id, {
        type: "INCOME",
        accountId: account.id,
        categoryId: category.id,
        amount: 500,
        date: "2026-09-20",
      }),
    ).rejects.toMatchObject({
      statusCode: 400,
      code: "CATEGORY_TYPE_MISMATCH",
    });

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
      },
    });

    expect(transactions).toHaveLength(0);

    const unchangedAccount = await prisma.account.findUnique({
      where: {
        id: account.id,
      },
    });

    expect(unchangedAccount?.balance.toString()).toBe("1000");
  });
it("should delete an INCOME transaction and decrease account balance", async () => {
  const user = await prisma.user.create({
    data: {
      email: "transaction-service-delete-income@example.com",
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
      balance: 1500,
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

  const transaction = await prisma.transaction.create({
    data: {
      userId: user.id,
      type: "INCOME",
      amount: 500,
      description: "Monthly salary",
      date: new Date("2026-09-20T00:00:00.000Z"),
      accountId: account.id,
      categoryId: category.id,
    },
  });

  await deleteTransaction(user.id, transaction.id);

  const deletedTransaction = await prisma.transaction.findUnique({
    where: {
      id: transaction.id,
    },
  });

  expect(deletedTransaction).toBeNull();

  const updatedAccount = await prisma.account.findUnique({
    where: {
      id: account.id,
    },
  });

  expect(updatedAccount?.balance.toString()).toBe("1000");
});

  it("should delete an EXPENSE transaction and increase account balance", async () => {
    const user = await prisma.user.create({
      data: {
        email: "transaction-service-delete-expense@example.com",
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
        balance: 700,
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
  
    const transaction = await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "EXPENSE",
        amount: 300,
        description: "Groceries",
        date: new Date("2026-09-20T00:00:00.000Z"),
        accountId: account.id,
        categoryId: category.id,
      },
    });
  
    await deleteTransaction(user.id, transaction.id);
  
    const deletedTransaction = await prisma.transaction.findUnique({
      where: {
        id: transaction.id,
      },
    });
  
    expect(deletedTransaction).toBeNull();
  
    const updatedAccount = await prisma.account.findUnique({
      where: {
        id: account.id,
      },
    });
  
    expect(updatedAccount?.balance.toString()).toBe("1000");
  });
});  