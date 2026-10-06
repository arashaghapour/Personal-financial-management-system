import { describe, expect, it } from "vitest";
import request from "supertest";

import app from "../../../src/app.js";

describe("Reports API - Ownership", () => {
  it("should return only the authenticated user's summary data", async () => {
    const userA = {
      email: "reports-summary-user-a@example.com",
      password: "Password123!",
      firstName: "User",
      lastName: "A",
    };

    const userB = {
      email: "reports-summary-user-b@example.com",
      password: "Password123!",
      firstName: "User",
      lastName: "B",
    };

    await request(app)
      .post("/api/auth/register")
      .send(userA)
      .expect(201);

    await request(app)
      .post("/api/auth/register")
      .send(userB)
      .expect(201);

    const loginA = await request(app)
      .post("/api/auth/login")
      .send({
        email: userA.email,
        password: userA.password,
      })
      .expect(200);

    const loginB = await request(app)
      .post("/api/auth/login")
      .send({
        email: userB.email,
        password: userB.password,
      })
      .expect(200);

    const tokenA = loginA.body.accessToken;
    const tokenB = loginB.body.accessToken;

    const accountA = await request(app)
      .post("/api/accounts")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        name: "User A Account",
        type: "CASH",
        initialBalance: 1000,
      })
      .expect(201);

    const incomeCategoryA = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        name: "Salary A",
        type: "INCOME",
      })
      .expect(201);

    const expenseCategoryA = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        name: "Food A",
        type: "EXPENSE",
      })
      .expect(201);

    await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        type: "INCOME",
        amount: 1000,
        description: "User A income",
        date: "2026-10-01",
        accountId: accountA.body.id,
        categoryId: incomeCategoryA.body.id,
      })
      .expect(201);

    await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        type: "EXPENSE",
        amount: 300,
        description: "User A expense",
        date: "2026-10-02",
        accountId: accountA.body.id,
        categoryId: expenseCategoryA.body.id,
      })
      .expect(201);

    const accountB = await request(app)
      .post("/api/accounts")
      .set("Authorization", `Bearer ${tokenB}`)
      .send({
        name: "User B Account",
        type: "CASH",
        initialBalance: 10000,
      })
      .expect(201);

    const incomeCategoryB = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${tokenB}`)
      .send({
        name: "Salary B",
        type: "INCOME",
      })
      .expect(201);

    const expenseCategoryB = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${tokenB}`)
      .send({
        name: "Food B",
        type: "EXPENSE",
      })
      .expect(201);

    await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${tokenB}`)
      .send({
        type: "INCOME",
        amount: 10000,
        description: "User B income",
        date: "2026-10-01",
        accountId: accountB.body.id,
        categoryId: incomeCategoryB.body.id,
      })
      .expect(201);

    await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${tokenB}`)
      .send({
        type: "EXPENSE",
        amount: 7000,
        description: "User B expense",
        date: "2026-10-02",
        accountId: accountB.body.id,
        categoryId: expenseCategoryB.body.id,
      })
      .expect(201);

    const response = await request(app)
      .get("/api/reports/summary")
      .set("Authorization", `Bearer ${tokenA}`)
      .expect(200);

    expect(response.body).toEqual({
      totalIncome: "1000",
      totalExpenses: "300",
      netCashFlow: "700",
      transactionCount: 2,
      incomeTransactionCount: 1,
      expenseTransactionCount: 1,
    });
  });

  it("should return only the authenticated user's expense data", async () => {
    const userA = {
      email: "reports-expenses-user-a@example.com",
      password: "Password123!",
      firstName: "User",
      lastName: "A",
    };

    const userB = {
      email: "reports-expenses-user-b@example.com",
      password: "Password123!",
      firstName: "User",
      lastName: "B",
    };

    await request(app)
      .post("/api/auth/register")
      .send(userA)
      .expect(201);

    await request(app)
      .post("/api/auth/register")
      .send(userB)
      .expect(201);

    const loginA = await request(app)
      .post("/api/auth/login")
      .send({
        email: userA.email,
        password: userA.password,
      })
      .expect(200);

    const loginB = await request(app)
      .post("/api/auth/login")
      .send({
        email: userB.email,
        password: userB.password,
      })
      .expect(200);

    const tokenA = loginA.body.accessToken;
    const tokenB = loginB.body.accessToken;

    const accountA = await request(app)
      .post("/api/accounts")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        name: "User A Account",
        type: "CASH",
        initialBalance: 1000,
      })
      .expect(201);

    const categoryA = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        name: "Food A",
        type: "EXPENSE",
      })
      .expect(201);

    await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        type: "EXPENSE",
        amount: 300,
        description: "User A expense",
        date: "2026-10-02",
        accountId: accountA.body.id,
        categoryId: categoryA.body.id,
      })
      .expect(201);

    const accountB = await request(app)
      .post("/api/accounts")
      .set("Authorization", `Bearer ${tokenB}`)
      .send({
        name: "User B Account",
        type: "CASH",
        initialBalance: 10000,
      })
      .expect(201);

    const categoryB = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${tokenB}`)
      .send({
        name: "Food B",
        type: "EXPENSE",
      })
      .expect(201);

    await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${tokenB}`)
      .send({
        type: "EXPENSE",
        amount: 7000,
        description: "User B expense",
        date: "2026-10-02",
        accountId: accountB.body.id,
        categoryId: categoryB.body.id,
      })
      .expect(201);

    const response = await request(app)
      .get("/api/reports/expenses")
      .set("Authorization", `Bearer ${tokenA}`)
      .expect(200);

    expect(response.body.totalExpenses).toBe("300");

    expect(response.body.categories).toEqual([
      {
        categoryId: categoryA.body.id,
        categoryName: "Food A",
        amount: "300",
        transactionCount: 1,
      },
    ]);
  });

  it("should return only the authenticated user's cash flow data", async () => {
    const userA = {
      email: "reports-cash-flow-user-a@example.com",
      password: "Password123!",
      firstName: "User",
      lastName: "A",
    };

    const userB = {
      email: "reports-cash-flow-user-b@example.com",
      password: "Password123!",
      firstName: "User",
      lastName: "B",
    };

    await request(app)
      .post("/api/auth/register")
      .send(userA)
      .expect(201);

    await request(app)
      .post("/api/auth/register")
      .send(userB)
      .expect(201);

    const loginA = await request(app)
      .post("/api/auth/login")
      .send({
        email: userA.email,
        password: userA.password,
      })
      .expect(200);

    const loginB = await request(app)
      .post("/api/auth/login")
      .send({
        email: userB.email,
        password: userB.password,
      })
      .expect(200);

    const tokenA = loginA.body.accessToken;
    const tokenB = loginB.body.accessToken;

    const accountA = await request(app)
      .post("/api/accounts")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        name: "User A Account",
        type: "CASH",
        initialBalance: 1000,
      })
      .expect(201);

    const incomeCategoryA = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        name: "Salary A",
        type: "INCOME",
      })
      .expect(201);

    const expenseCategoryA = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        name: "Food A",
        type: "EXPENSE",
      })
      .expect(201);

    await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        type: "INCOME",
        amount: 1000,
        description: "User A income",
        date: "2026-10-01",
        accountId: accountA.body.id,
        categoryId: incomeCategoryA.body.id,
      })
      .expect(201);

    await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        type: "EXPENSE",
        amount: 300,
        description: "User A expense",
        date: "2026-10-02",
        accountId: accountA.body.id,
        categoryId: expenseCategoryA.body.id,
      })
      .expect(201);

    const accountB = await request(app)
      .post("/api/accounts")
      .set("Authorization", `Bearer ${tokenB}`)
      .send({
        name: "User B Account",
        type: "CASH",
        initialBalance: 10000,
      })
      .expect(201);

    const incomeCategoryB = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${tokenB}`)
      .send({
        name: "Salary B",
        type: "INCOME",
      })
      .expect(201);

    const expenseCategoryB = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${tokenB}`)
      .send({
        name: "Food B",
        type: "EXPENSE",
      })
      .expect(201);

    await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${tokenB}`)
      .send({
        type: "INCOME",
        amount: 10000,
        description: "User B income",
        date: "2026-10-01",
        accountId: accountB.body.id,
        categoryId: incomeCategoryB.body.id,
      })
      .expect(201);

    await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${tokenB}`)
      .send({
        type: "EXPENSE",
        amount: 7000,
        description: "User B expense",
        date: "2026-10-02",
        accountId: accountB.body.id,
        categoryId: expenseCategoryB.body.id,
      })
      .expect(201);

    const response = await request(app)
      .get("/api/reports/cash-flow")
      .set("Authorization", `Bearer ${tokenA}`)
      .expect(200);

    expect(response.body.data).toEqual([
      {
        date: "2026-10-01",
        income: "1000",
        expenses: "0",
        netCashFlow: "1000",
      },
      {
        date: "2026-10-02",
        income: "0",
        expenses: "300",
        netCashFlow: "-300",
      },
    ]);
  });
});