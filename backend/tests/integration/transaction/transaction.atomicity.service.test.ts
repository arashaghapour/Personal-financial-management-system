import { describe, expect, it, vi } from "vitest";

import { Prisma } from "../../../src/generated/prisma/client.js";
import { prisma } from "../../../src/lib/prisma.js";

import * as transactionRepositoryModule from "../../../src/modules/transaction/transaction.repository.js";

import {
  createTransaction,
  updateTransactionAmount,
  updateTransactionAccount,
  deleteTransaction,
} from "../../../src/modules/transaction/transaction.service.js";

describe("Transaction service - atomicity", () => {
  it("should rollback account balance when transaction creation fails", async () => {
    const user = await prisma.user.create({
      data: {
        email: "atomic-create-failure@example.com",
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
        balance: new Prisma.Decimal(1000),
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

    vi.spyOn(
      transactionRepositoryModule.transactionRepository,
      "create",
    ).mockRejectedValueOnce(
      new Error("Transaction creation failed"),
    );

    await expect(
      createTransaction(user.id, {
        type: "EXPENSE",
        amount: 300,
        description: "Lunch",
        date: "2026-09-20",
        accountId: account.id,
        categoryId: category.id,
      }),
    ).rejects.toThrow("Transaction creation failed");

    const accountAfterFailure = await prisma.account.findUnique({
      where: {
        id: account.id,
      },
    });

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
      },
    });

    expect(accountAfterFailure?.balance.toString()).toBe("1000");
    expect(transactions).toHaveLength(0);
  });

  it("should rollback account balance when transaction amount update fails", async () => {
    const user = await prisma.user.create({
      data: {
        email: "atomic-update-failure@example.com",
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
        balance: new Prisma.Decimal(700),
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
        amount: new Prisma.Decimal(300),
        description: "Lunch",
        date: new Date("2026-09-20T00:00:00.000Z"),
        accountId: account.id,
        categoryId: category.id,
      },
    });

    vi.spyOn(
      transactionRepositoryModule.transactionRepository,
      "updateByIdAndUserId",
    ).mockRejectedValueOnce(
      new Error("Transaction update failed"),
    );

    await expect(
      updateTransactionAmount(
        user.id,
        transaction.id,
        500,
      ),
    ).rejects.toThrow("Transaction update failed");

    const accountAfterFailure = await prisma.account.findUnique({
      where: {
        id: account.id,
      },
    });

    const transactionAfterFailure =
      await prisma.transaction.findUnique({
        where: {
          id: transaction.id,
        },
      });

    expect(accountAfterFailure?.balance.toString()).toBe("700");

    expect(transactionAfterFailure?.amount.toString()).toBe(
      "300",
    );
  });

  it("should rollback both account balances when moving transaction fails", async () => {
    const user = await prisma.user.create({
      data: {
        email: "atomic-move-failure@example.com",
        passwordHash: "hashed-password",
        firstName: "Test",
        lastName: "User",
      },
    });

    const oldAccount = await prisma.account.create({
      data: {
        userId: user.id,
        name: "Old Bank",
        type: "BANK",
        balance: new Prisma.Decimal(700),
      },
    });

    const newAccount = await prisma.account.create({
      data: {
        userId: user.id,
        name: "New Bank",
        type: "BANK",
        balance: new Prisma.Decimal(2000),
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
        amount: new Prisma.Decimal(300),
        description: "Lunch",
        date: new Date("2026-09-20T00:00:00.000Z"),
        accountId: oldAccount.id,
        categoryId: category.id,
      },
    });

    vi.spyOn(
      transactionRepositoryModule.transactionRepository,
      "updateByIdAndUserId",
    ).mockRejectedValueOnce(
      new Error("Transaction move failed"),
    );

    await expect(
      updateTransactionAccount(
        user.id,
        transaction.id,
        newAccount.id,
      ),
    ).rejects.toThrow("Transaction move failed");

    const oldAccountAfterFailure =
      await prisma.account.findUnique({
        where: {
          id: oldAccount.id,
        },
      });

    const newAccountAfterFailure =
      await prisma.account.findUnique({
        where: {
          id: newAccount.id,
        },
      });

    const transactionAfterFailure =
      await prisma.transaction.findUnique({
        where: {
          id: transaction.id,
        },
      });

    expect(oldAccountAfterFailure?.balance.toString()).toBe(
      "700",
    );

    expect(newAccountAfterFailure?.balance.toString()).toBe(
      "2000",
    );

    expect(transactionAfterFailure?.accountId).toBe(
      oldAccount.id,
    );
  });

  it("should rollback account balance when transaction deletion fails", async () => {
    const user = await prisma.user.create({
      data: {
        email: "atomic-delete-failure@example.com",
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
        balance: new Prisma.Decimal(700),
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
        amount: new Prisma.Decimal(300),
        description: "Lunch",
        date: new Date("2026-09-20T00:00:00.000Z"),
        accountId: account.id,
        categoryId: category.id,
      },
    });

    vi.spyOn(
      transactionRepositoryModule.transactionRepository,
      "deleteByIdAndUserId",
    ).mockRejectedValueOnce(
      new Error("Transaction deletion failed"),
    );

    await expect(
      deleteTransaction(
        user.id,
        transaction.id,
      ),
    ).rejects.toThrow("Transaction deletion failed");

    const accountAfterFailure = await prisma.account.findUnique({
      where: {
        id: account.id,
      },
    });

    const transactionAfterFailure =
      await prisma.transaction.findUnique({
        where: {
          id: transaction.id,
        },
      });

    expect(accountAfterFailure?.balance.toString()).toBe(
      "700",
    );

    expect(transactionAfterFailure).not.toBeNull();
    expect(transactionAfterFailure?.id).toBe(transaction.id);
  });
});