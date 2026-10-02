import { describe, expect, it } from "vitest";

import request from "supertest";

import app from "../../../src/app.js";

type AuthUser = {
  accessToken: string;
};

type TransactionContext = {
  userA: AuthUser;
  userB: AuthUser;
  userBAccountId: number;
  userBCategoryId: string;
  userBTransactionId: string;
};

const registerAndLogin = async (
  email: string,
): Promise<AuthUser> => {
  const registerResponse = await request(app)
    .post("/api/auth/register")
    .send({
      email,
      password: "Password123!",
      firstName: "Test",
      lastName: "User",
    });

  expect(registerResponse.status).toBe(201);

  const loginResponse = await request(app)
    .post("/api/auth/login")
    .send({
      email,
      password: "Password123!",
    });

  expect(loginResponse.status).toBe(200);

  return {
    accessToken: loginResponse.body.accessToken,
  };
};

const createAccount = async (
  accessToken: string,
  name: string,
) => {
  const response = await request(app)
    .post("/api/accounts")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      name,
      type: "BANK",
      initialBalance: 100000,
    });

  expect(response.status).toBe(201);

  return response.body;
};

const createCategory = async (
  accessToken: string,
  name: string,
) => {
  const response = await request(app)
    .post("/api/categories")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      name,
      type: "EXPENSE",
    });

  expect(response.status).toBe(201);

  return response.body;
};

const createTransaction = async (
  accessToken: string,
  accountId: number,
  categoryId: string,
) => {
  const response = await request(app)
    .post("/api/transactions")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      type: "EXPENSE",
      amount: 5000,
      description: "Test transaction",
      date: "2026-09-20",
      accountId,
      categoryId,
    });

  expect(response.status).toBe(201);

  return response.body;
};

const createTransactionContext =
  async (): Promise<TransactionContext> => {
    const userA = await registerAndLogin(
      "transaction-idor-user-a@example.com",
    );

    const userB = await registerAndLogin(
      "transaction-idor-user-b@example.com",
    );

    const userBAccount = await createAccount(
      userB.accessToken,
      "User B Bank",
    );

    const userBCategory = await createCategory(
      userB.accessToken,
      "User B Food",
    );

    const userBTransaction = await createTransaction(
      userB.accessToken,
      userBAccount.id,
      userBCategory.id,
    );

    return {
      userA,
      userB,
      userBAccountId: userBAccount.id,
      userBCategoryId: userBCategory.id,
      userBTransactionId: userBTransaction.id,
    };
  };

describe("Transaction ownership and IDOR", () => {
  describe("GET /api/transactions/:id", () => {
    it("should return 404 when accessing another user's transaction", async () => {
      const {
        userA,
        userBTransactionId,
      } = await createTransactionContext();

      const response = await request(app)
        .get(`/api/transactions/${userBTransactionId}`)
        .set(
          "Authorization",
          `Bearer ${userA.accessToken}`,
        );

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe(
        "TRANSACTION_NOT_FOUND",
      );
    });
  });

  describe("PATCH /api/transactions/:id", () => {
    it("should return 404 when updating another user's transaction", async () => {
      const {
        userA,
        userBTransactionId,
      } = await createTransactionContext();

      const response = await request(app)
        .patch(`/api/transactions/${userBTransactionId}`)
        .set(
          "Authorization",
          `Bearer ${userA.accessToken}`,
        )
        .send({
          description: "Hacked transaction",
        });

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe(
        "TRANSACTION_NOT_FOUND",
      );
    });
  });

  describe("DELETE /api/transactions/:id", () => {
    it("should return 404 when deleting another user's transaction", async () => {
      const {
        userA,
        userBTransactionId,
      } = await createTransactionContext();

      const response = await request(app)
        .delete(`/api/transactions/${userBTransactionId}`)
        .set(
          "Authorization",
          `Bearer ${userA.accessToken}`,
        );

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe(
        "TRANSACTION_NOT_FOUND",
      );
    });
  });

  describe("POST /api/transactions", () => {
    it("should return 404 when using another user's accountId", async () => {
      const {
        userA,
        userBAccountId,
      } = await createTransactionContext();

      const userAAccount = await createAccount(
        userA.accessToken,
        "User A Bank",
      );

      const userACategory = await createCategory(
        userA.accessToken,
        "User A Food",
      );

      const response = await request(app)
        .post("/api/transactions")
        .set(
          "Authorization",
          `Bearer ${userA.accessToken}`,
        )
        .send({
          type: "EXPENSE",
          amount: 1000,
          description: "Invalid ownership transaction",
          date: "2026-09-20",
          accountId: userBAccountId,
          categoryId: userACategory.id,
        });

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe(
        "ACCOUNT_NOT_FOUND",
      );

      const ownAccountResponse = await request(app)
        .get(`/api/accounts/${userAAccount.id}`)
        .set(
          "Authorization",
          `Bearer ${userA.accessToken}`,
        );

      expect(ownAccountResponse.status).toBe(200);
    });

    it("should return 404 when using another user's categoryId", async () => {
      const {
        userA,
        userBCategoryId,
      } = await createTransactionContext();

      const userAAccount = await createAccount(
        userA.accessToken,
        "User A Bank",
      );

      const response = await request(app)
        .post("/api/transactions")
        .set(
          "Authorization",
          `Bearer ${userA.accessToken}`,
        )
        .send({
          type: "EXPENSE",
          amount: 1000,
          description: "Invalid ownership transaction",
          date: "2026-09-20",
          accountId: userAAccount.id,
          categoryId: userBCategoryId,
        });

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe(
        "CATEGORY_NOT_FOUND",
      );
    });

    it("should return 404 when using another user's accountId and categoryId", async () => {
      const {
        userA,
        userBAccountId,
        userBCategoryId,
      } = await createTransactionContext();

      const response = await request(app)
        .post("/api/transactions")
        .set(
          "Authorization",
          `Bearer ${userA.accessToken}`,
        )
        .send({
          type: "EXPENSE",
          amount: 1000,
          description: "Invalid ownership transaction",
          date: "2026-09-20",
          accountId: userBAccountId,
          categoryId: userBCategoryId,
        });

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe(
        "ACCOUNT_NOT_FOUND",
      );
    });
  });
});