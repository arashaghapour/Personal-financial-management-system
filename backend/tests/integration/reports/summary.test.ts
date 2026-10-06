import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../../../src/app.js";

describe("Reports API - Summary", () => {
  it("should return the correct financial summary", async () => {
    const user = {
      email: "reports-summary@example.com",
      password: "Password123!",
      firstName: "Reports",
      lastName: "Summary",
    };

    await request(app)
      .post("/api/auth/register")
      .send(user)
      .expect(201);

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: user.email,
        password: user.password,
      })
      .expect(200);

    const token = loginResponse.body.accessToken;

    const accountResponse = await request(app)
      .post("/api/accounts")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Main Account",
        type: "CASH",
        initialBalance: 1500,
      })
      .expect(201);

    const incomeCategoryResponse = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Salary",
        type: "INCOME",
      })
      .expect(201);

    const expenseCategoryResponse = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Expenses",
        type: "EXPENSE",
      })
      .expect(201);

    await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${token}`)
      .send({
        type: "INCOME",
        amount: 5000,
        description: "Salary",
        date: "2026-10-01",
        accountId: accountResponse.body.id,
        categoryId: incomeCategoryResponse.body.id,
      })
      .expect(201);

    await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${token}`)
      .send({
        type: "EXPENSE",
        amount: 1000,
        description: "Expense 1",
        date: "2026-10-02",
        accountId: accountResponse.body.id,
        categoryId: expenseCategoryResponse.body.id,
      })
      .expect(201);

    await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${token}`)
      .send({
        type: "EXPENSE",
        amount: 500,
        description: "Expense 2",
        date: "2026-10-03",
        accountId: accountResponse.body.id,
        categoryId: expenseCategoryResponse.body.id,
      })
      .expect(201);

    const response = await request(app)
      .get("/api/reports/summary")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(response.body).toEqual({
      totalIncome: "5000",
      totalExpenses: "1500",
      netCashFlow: "3500",
      transactionCount: 3,
      incomeTransactionCount: 1,
      expenseTransactionCount: 2,
    });
  });
});