import { beforeEach, describe, expect, it } from "vitest";

import request from "supertest";

import app from "../../../src/app.js";
import { prisma } from "../../../src/lib/prisma.js";

let accessToken: string;

beforeEach(async () => {
  const response = await request(app)
    .post("/api/auth/register")
    .send({
      email: "transaction-api@example.com",
      password: "Password123!",
      firstName: "Test",
      lastName: "User",
    });

  expect(response.status).toBe(201);

  const loginResponse = await request(app)
    .post("/api/auth/login")
    .send({
      email: "transaction-api@example.com",
      password: "Password123!",
    });

  expect(loginResponse.status).toBe(200);

  accessToken = loginResponse.body.accessToken;
});

describe("Transaction API", () => {
  describe("POST /api/transactions", () => {
    it("should create an INCOME transaction", async () => {
      const accountResponse = await request(app)
        .post("/api/accounts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "Main Bank",
          type: "BANK",
          initialBalance: 1000,
        });

      expect(accountResponse.status).toBe(201);

      const categoryResponse = await request(app)
        .post("/api/categories")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "Salary",
          type: "INCOME",
        });

      expect(categoryResponse.status).toBe(201);
      
      const response = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          type: "INCOME",
          accountId: accountResponse.body.id,
          categoryId: categoryResponse.body.id,
          amount: 500,
          description: "Monthly salary",
          date: "2026-09-20",
        });
      expect(response.status).toBe(201);

      expect(response.body).toMatchObject({
        type: "INCOME",
        accountId: accountResponse.body.id,
        categoryId: categoryResponse.body.id,
        description: "Monthly salary",
      });

      expect(response.body.amount).toBe("500");

      const account = await prisma.account.findUnique({
        where: {
          id: accountResponse.body.id,
        },
      });

      expect(account?.balance.toString()).toBe("1500");
    });

    it("should create an EXPENSE transaction", async () => {
      const accountResponse = await request(app)
        .post("/api/accounts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "Main Bank",
          type: "BANK",
          initialBalance: 1000,
        });

      expect(accountResponse.status).toBe(201);

      const categoryResponse = await request(app)
        .post("/api/categories")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "Food",
          type: "EXPENSE",
        });

      expect(categoryResponse.status).toBe(201);

      const response = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          type: "EXPENSE",
          accountId: accountResponse.body.id,
          categoryId: categoryResponse.body.id,
          amount: 300,
          description: "Groceries",
          date: "2026-09-20",
        });

      expect(response.status).toBe(201);

      expect(response.body).toMatchObject({
        type: "EXPENSE",
        accountId: accountResponse.body.id,
        categoryId: categoryResponse.body.id,
        description: "Groceries",
      });

      expect(response.body.amount).toBe("300");

      const account = await prisma.account.findUnique({
        where: {
          id: accountResponse.body.id,
        },
      });

      expect(account?.balance.toString()).toBe("700");
    });

    it("should reject transaction without authentication", async () => {
      const response = await request(app)
        .post("/api/transactions")
        .send({
          type: "EXPENSE",
          accountId: 1,
          categoryId: "00000000-0000-0000-0000-000000000001",
          amount: 100,
          date: "2026-09-20",
        });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe("UNAUTHORIZED");
    });

    it("should reject invalid transaction body", async () => {
      const response = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          type: "INVALID",
          accountId: -1,
          categoryId: "invalid",
          amount: -100,
          date: "invalid-date",
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should reject transaction when account does not exist", async () => {
      const categoryResponse = await request(app)
        .post("/api/categories")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "Food",
          type: "EXPENSE",
        });

      expect(categoryResponse.status).toBe(201);

      const response = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          type: "EXPENSE",
          accountId: 999999999,
          categoryId: categoryResponse.body.id,
          amount: 100,
          date: "2026-09-20",
        });

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe("ACCOUNT_NOT_FOUND");
    });

    it("should reject transaction when category does not exist", async () => {
      const accountResponse = await request(app)
        .post("/api/accounts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "Main Bank",
          type: "BANK",
          initialBalance: 1000,
        });

      expect(accountResponse.status).toBe(201);

      const response = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          type: "EXPENSE",
          accountId: accountResponse.body.id,
          categoryId: "00000000-0000-0000-0000-000000000000",
          amount: 100,
          date: "2026-09-20",
        });

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe("CATEGORY_NOT_FOUND");
    });

    it("should reject transaction when category type does not match transaction type", async () => {
      const accountResponse = await request(app)
        .post("/api/accounts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "Main Bank",
          type: "BANK",
          initialBalance: 1000,
        });

      expect(accountResponse.status).toBe(201);

      const categoryResponse = await request(app)
        .post("/api/categories")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "Salary",
          type: "INCOME",
        });

      expect(categoryResponse.status).toBe(201);

      const response = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          type: "EXPENSE",
          accountId: accountResponse.body.id,
          categoryId: categoryResponse.body.id,
          amount: 100,
          date: "2026-09-20",
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe(
        "CATEGORY_TYPE_MISMATCH",
      );
    });
  });

  describe("GET /api/transactions", () => {
    it("should return user's transactions", async () => {
      const accountResponse = await request(app)
        .post("/api/accounts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "Main Bank",
          type: "BANK",
          initialBalance: 1000,
        });

      expect(accountResponse.status).toBe(201);

      const categoryResponse = await request(app)
        .post("/api/categories")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "Food",
          type: "EXPENSE",
        });

      expect(categoryResponse.status).toBe(201);

      const createResponse = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          type: "EXPENSE",
          accountId: accountResponse.body.id,
          categoryId: categoryResponse.body.id,
          amount: 200,
          description: "Groceries",
          date: "2026-09-20",
        });

      expect(createResponse.status).toBe(201);

      const response = await request(app)
        .get("/api/transactions")
        .set("Authorization", `Bearer ${accessToken}`);
      expect(response.status).toBe(200);

      expect(response.body.data).toHaveLength(1);

      expect(response.body.data[0]).toMatchObject({
        id: createResponse.body.id,
        type: "EXPENSE",
        accountId: accountResponse.body.id,
        categoryId: categoryResponse.body.id,
        description: "Groceries",
      });

      expect(response.body.data[0].amount).toBe("200");

      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      });
    });

    it("should filter transactions by type", async () => {
      const accountResponse = await request(app)
        .post("/api/accounts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "Main Bank",
          type: "BANK",
          initialBalance: 1000,
        });

      expect(accountResponse.status).toBe(201);

      const expenseCategoryResponse = await request(app)
        .post("/api/categories")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "Food",
          type: "EXPENSE",
        });

      expect(expenseCategoryResponse.status).toBe(201);

      const incomeCategoryResponse = await request(app)
        .post("/api/categories")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "Salary",
          type: "INCOME",
        });

      expect(incomeCategoryResponse.status).toBe(201);

      await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          type: "EXPENSE",
          accountId: accountResponse.body.id,
          categoryId: expenseCategoryResponse.body.id,
          amount: 200,
          date: "2026-09-20",
        });

      await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          type: "INCOME",
          accountId: accountResponse.body.id,
          categoryId: incomeCategoryResponse.body.id,
          amount: 500,
          date: "2026-09-21",
        });

      const response = await request(app)
        .get("/api/transactions")
        .query({
          type: "EXPENSE",
        })
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].type).toBe("EXPENSE");
    });

    it("should reject invalid query", async () => {
      const response = await request(app)
        .get("/api/transactions")
        .query({
          type: "INVALID",
        })
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should reject get transactions without authentication", async () => {
      const response = await request(app)
        .get("/api/transactions");

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe("UNAUTHORIZED");
    });
  });

  describe("GET /api/transactions/:id", () => {
    it("should return a transaction", async () => {
      const accountResponse = await request(app)
        .post("/api/accounts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "Main Bank",
          type: "BANK",
          initialBalance: 1000,
        });

      expect(accountResponse.status).toBe(201);

      const categoryResponse = await request(app)
        .post("/api/categories")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "Food",
          type: "EXPENSE",
        });

      expect(categoryResponse.status).toBe(201);

      const createResponse = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          type: "EXPENSE",
          accountId: accountResponse.body.id,
          categoryId: categoryResponse.body.id,
          amount: 200,
          description: "Lunch",
          date: "2026-09-20",
        });

      expect(createResponse.status).toBe(201);

      const response = await request(app)
        .get(`/api/transactions/${createResponse.body.id}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);

      expect(response.body).toMatchObject({
        id: createResponse.body.id,
        type: "EXPENSE",
        accountId: accountResponse.body.id,
        categoryId: categoryResponse.body.id,
        description: "Lunch",
      });

      expect(response.body.amount).toBe("200");
    });

    it("should reject invalid transaction id", async () => {
      const response = await request(app)
        .get("/api/transactions/invalid-id")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should not return another user's transaction", async () => {
      const accountResponse = await request(app)
        .post("/api/accounts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "Main Bank",
          type: "BANK",
          initialBalance: 1000,
        });

      expect(accountResponse.status).toBe(201);

      const categoryResponse = await request(app)
        .post("/api/categories")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "Food",
          type: "EXPENSE",
        });

      expect(categoryResponse.status).toBe(201);

      const createResponse = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          type: "EXPENSE",
          accountId: accountResponse.body.id,
          categoryId: categoryResponse.body.id,
          amount: 200,
          date: "2026-09-20",
        });

      expect(createResponse.status).toBe(201);

      await request(app)
        .post("/api/auth/register")
        .send({
          email: "transaction-api-other@example.com",
          password: "Password123!",
          firstName: "Other",
          lastName: "User",
        });

      const otherLoginResponse = await request(app)
        .post("/api/auth/login")
        .send({
          email: "transaction-api-other@example.com",
          password: "Password123!",
        });

      expect(otherLoginResponse.status).toBe(200);

      const response = await request(app)
        .get(`/api/transactions/${createResponse.body.id}`)
        .set(
          "Authorization",
          `Bearer ${otherLoginResponse.body.accessToken}`,
        );

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe("TRANSACTION_NOT_FOUND");
    });
  });

  describe("PATCH /api/transactions/:id", () => {
    it("should update transaction amount and account balance", async () => {
      const accountResponse = await request(app)
        .post("/api/accounts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "Main Bank",
          type: "BANK",
          initialBalance: 1000,
        });

      expect(accountResponse.status).toBe(201);

      const categoryResponse = await request(app)
        .post("/api/categories")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "Food",
          type: "EXPENSE",
        });

      expect(categoryResponse.status).toBe(201);

      const createResponse = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          type: "EXPENSE",
          accountId: accountResponse.body.id,
          categoryId: categoryResponse.body.id,
          amount: 300,
          description: "Food",
          date: "2026-09-20",
        });

      expect(createResponse.status).toBe(201);

      const response = await request(app)
        .patch(`/api/transactions/${createResponse.body.id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          amount: 500,
        });

      expect(response.status).toBe(200);
      expect(response.body.amount).toBe("500");

      const account = await prisma.account.findUnique({
        where: {
          id: accountResponse.body.id,
        },
      });

      expect(account?.balance.toString()).toBe("500");
    });

    it("should update transaction account", async () => {
      const oldAccountResponse = await request(app)
        .post("/api/accounts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "Old Bank",
          type: "BANK",
          initialBalance: 1000,
        });

      expect(oldAccountResponse.status).toBe(201);

      const newAccountResponse = await request(app)
        .post("/api/accounts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "New Bank",
          type: "BANK",
          initialBalance: 2000,
        });

      expect(newAccountResponse.status).toBe(201);

      const categoryResponse = await request(app)
        .post("/api/categories")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "Food",
          type: "EXPENSE",
        });

      expect(categoryResponse.status).toBe(201);

      const createResponse = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          type: "EXPENSE",
          accountId: oldAccountResponse.body.id,
          categoryId: categoryResponse.body.id,
          amount: 300,
          date: "2026-09-20",
        });

      expect(createResponse.status).toBe(201);

      const response = await request(app)
        .patch(`/api/transactions/${createResponse.body.id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          accountId: newAccountResponse.body.id,
        });

      expect(response.status).toBe(200);
      expect(response.body.accountId).toBe(
        newAccountResponse.body.id,
      );

      const oldAccount = await prisma.account.findUnique({
        where: {
          id: oldAccountResponse.body.id,
        },
      });

      const newAccount = await prisma.account.findUnique({
        where: {
          id: newAccountResponse.body.id,
        },
      });

      expect(oldAccount?.balance.toString()).toBe("1000");
      expect(newAccount?.balance.toString()).toBe("1700");
    });

    it("should update transaction category", async () => {
      const accountResponse = await request(app)
        .post("/api/accounts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "Main Bank",
          type: "BANK",
          initialBalance: 1000,
        });

      expect(accountResponse.status).toBe(201);

      const oldCategoryResponse = await request(app)
        .post("/api/categories")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "Food",
          type: "EXPENSE",
        });

      expect(oldCategoryResponse.status).toBe(201);

      const newCategoryResponse = await request(app)
        .post("/api/categories")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "Transport",
          type: "EXPENSE",
        });

      expect(newCategoryResponse.status).toBe(201);

      const createResponse = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          type: "EXPENSE",
          accountId: accountResponse.body.id,
          categoryId: oldCategoryResponse.body.id,
          amount: 200,
          date: "2026-09-20",
        });

      expect(createResponse.status).toBe(201);

      const response = await request(app)
        .patch(`/api/transactions/${createResponse.body.id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          categoryId: newCategoryResponse.body.id,
        });

      expect(response.status).toBe(200);

      expect(response.body.categoryId).toBe(
        newCategoryResponse.body.id,
      );
    });

    it("should update transaction description and date", async () => {
      const accountResponse = await request(app)
        .post("/api/accounts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "Main Bank",
          type: "BANK",
          initialBalance: 1000,
        });

      expect(accountResponse.status).toBe(201);

      const categoryResponse = await request(app)
        .post("/api/categories")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "Food",
          type: "EXPENSE",
        });

      expect(categoryResponse.status).toBe(201);

      const createResponse = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          type: "EXPENSE",
          accountId: accountResponse.body.id,
          categoryId: categoryResponse.body.id,
          amount: 200,
          description: "Old description",
          date: "2026-09-20",
        });

      expect(createResponse.status).toBe(201);

      const response = await request(app)
        .patch(`/api/transactions/${createResponse.body.id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          description: "Updated description",
          date: "2026-09-25",
        });

      expect(response.status).toBe(200);

      expect(response.body.description).toBe(
        "Updated description",
      );

      expect(response.body.date).toContain("2026-09-25");
    });

    it("should reject empty update body", async () => {
      const response = await request(app)
        .patch(
          "/api/transactions/00000000-0000-0000-0000-000000000001",
        )
        .set("Authorization", `Bearer ${accessToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should reject type in update body", async () => {
      const response = await request(app)
        .patch(
          "/api/transactions/00000000-0000-0000-0000-000000000001",
        )
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          type: "INCOME",
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should not allow another user to update the transaction", async () => {
      const accountResponse = await request(app)
        .post("/api/accounts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "Main Bank",
          type: "BANK",
          initialBalance: 1000,
        });

      expect(accountResponse.status).toBe(201);

      const categoryResponse = await request(app)
        .post("/api/categories")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "Food",
          type: "EXPENSE",
        });

      expect(categoryResponse.status).toBe(201);

      const createResponse = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          type: "EXPENSE",
          accountId: accountResponse.body.id,
          categoryId: categoryResponse.body.id,
          amount: 200,
          date: "2026-09-20",
        });

      expect(createResponse.status).toBe(201);

      await request(app)
        .post("/api/auth/register")
        .send({
          email: "transaction-api-other-update@example.com",
          password: "Password123!",
          firstName: "Other",
          lastName: "User",
        });

      const otherLoginResponse = await request(app)
        .post("/api/auth/login")
        .send({
          email: "transaction-api-other-update@example.com",
          password: "Password123!",
        });

      expect(otherLoginResponse.status).toBe(200);

      const response = await request(app)
        .patch(`/api/transactions/${createResponse.body.id}`)
        .set(
          "Authorization",
          `Bearer ${otherLoginResponse.body.accessToken}`,
        )
        .send({
          amount: 500,
        });

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe(
        "TRANSACTION_NOT_FOUND",
      );
    });
  });

  describe("DELETE /api/transactions/:id", () => {
    it("should delete an INCOME transaction and decrease account balance", async () => {
      const accountResponse = await request(app)
        .post("/api/accounts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "Main Bank",
          type: "BANK",
          initialBalance: 1000,
        });

      expect(accountResponse.status).toBe(201);

      const categoryResponse = await request(app)
        .post("/api/categories")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "Salary",
          type: "INCOME",
        });

      expect(categoryResponse.status).toBe(201);

      const createResponse = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          type: "INCOME",
          accountId: accountResponse.body.id,
          categoryId: categoryResponse.body.id,
          amount: 500,
          date: "2026-09-20",
        });

      expect(createResponse.status).toBe(201);

      const deleteResponse = await request(app)
        .delete(`/api/transactions/${createResponse.body.id}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(deleteResponse.status).toBe(204);

      const transaction = await prisma.transaction.findUnique({
        where: {
          id: createResponse.body.id,
        },
      });

      expect(transaction).toBeNull();

      const account = await prisma.account.findUnique({
        where: {
          id: accountResponse.body.id,
        },
      });

      expect(account?.balance.toString()).toBe("1000");
    });

    it("should delete an EXPENSE transaction and increase account balance", async () => {
      const accountResponse = await request(app)
        .post("/api/accounts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "Main Bank",
          type: "BANK",
          initialBalance: 1000,
        });

      expect(accountResponse.status).toBe(201);

      const categoryResponse = await request(app)
        .post("/api/categories")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "Food",
          type: "EXPENSE",
        });

      expect(categoryResponse.status).toBe(201);

      const createResponse = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          type: "EXPENSE",
          accountId: accountResponse.body.id,
          categoryId: categoryResponse.body.id,
          amount: 300,
          date: "2026-09-20",
        });

      expect(createResponse.status).toBe(201);

      const deleteResponse = await request(app)
        .delete(`/api/transactions/${createResponse.body.id}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(deleteResponse.status).toBe(204);

      const transaction = await prisma.transaction.findUnique({
        where: {
          id: createResponse.body.id,
        },
      });

      expect(transaction).toBeNull();

      const account = await prisma.account.findUnique({
        where: {
          id: accountResponse.body.id,
        },
      });

      expect(account?.balance.toString()).toBe("1000");
    });

    it("should not allow another user to delete the transaction", async () => {
      const accountResponse = await request(app)
        .post("/api/accounts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "Main Bank",
          type: "BANK",
          initialBalance: 1000,
        });

      expect(accountResponse.status).toBe(201);

      const categoryResponse = await request(app)
        .post("/api/categories")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "Food",
          type: "EXPENSE",
        });

      expect(categoryResponse.status).toBe(201);

      const createResponse = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          type: "EXPENSE",
          accountId: accountResponse.body.id,
          categoryId: categoryResponse.body.id,
          amount: 200,
          date: "2026-09-20",
        });

      expect(createResponse.status).toBe(201);

      await request(app)
        .post("/api/auth/register")
        .send({
          email: "transaction-api-other-delete@example.com",
          password: "Password123!",
          firstName: "Other",
          lastName: "User",
        });

      const otherLoginResponse = await request(app)
        .post("/api/auth/login")
        .send({
          email: "transaction-api-other-delete@example.com",
          password: "Password123!",
        });

      expect(otherLoginResponse.status).toBe(200);

      const response = await request(app)
        .delete(`/api/transactions/${createResponse.body.id}`)
        .set(
          "Authorization",
          `Bearer ${otherLoginResponse.body.accessToken}`,
        );

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe(
        "TRANSACTION_NOT_FOUND",
      );

      const transaction = await prisma.transaction.findUnique({
        where: {
          id: createResponse.body.id,
        },
      });

      expect(transaction).not.toBeNull();
    });

    it("should reject delete without authentication", async () => {
      const response = await request(app).delete(
        "/api/transactions/00000000-0000-0000-0000-000000000001",
      );

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe("UNAUTHORIZED");
    });

    it("should reject invalid transaction id", async () => {
      const response = await request(app)
        .delete("/api/transactions/invalid-id")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });
  });
});