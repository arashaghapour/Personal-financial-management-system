import { describe, expect, it } from "vitest";
import request from "supertest";

import app from "../../src/app.js";
import { prisma } from "../../src/lib/prisma.js";

const registerAndLogin = async (
  email: string,
): Promise<string> => {
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

  return loginResponse.body.accessToken;
};

const createExpenseTransaction = async (
  accessToken: string,
): Promise<{
  accountId: number;
  categoryId: string;
}> => {
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

  const transactionResponse = await request(app)
    .post("/api/transactions")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      type: "EXPENSE",
      accountId: accountResponse.body.id,
      categoryId: categoryResponse.body.id,
      amount: 100,
      date: "2026-09-20",
    });

  expect(transactionResponse.status).toBe(201);

  return {
    accountId: accountResponse.body.id,
    categoryId: categoryResponse.body.id,
  };
};

describe("Deletion conflicts", () => {
  it("should reject deleting an account that has transactions", async () => {
    const accessToken = await registerAndLogin(
      "delete-account-conflict@example.com",
    );

    const { accountId } = await createExpenseTransaction(
      accessToken,
    );

    const response = await request(app)
      .delete(`/api/accounts/${accountId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      error: {
        code: "CONFLICT",
        message: "Resource is still in use",
      },
    });

    const account = await prisma.account.findUnique({
      where: {
        id: accountId,
      },
    });

    expect(account).not.toBeNull();
  });

  it("should reject deleting a category that has transactions", async () => {
    const accessToken = await registerAndLogin(
      "delete-category-conflict@example.com",
    );

    const { categoryId } = await createExpenseTransaction(
      accessToken,
    );

    const response = await request(app)
      .delete(`/api/categories/${categoryId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      error: {
        code: "CONFLICT",
        message: "Resource is still in use",
      },
    });

    const category = await prisma.category.findUnique({
      where: {
        id: categoryId,
      },
    });

    expect(category).not.toBeNull();
  });
});
