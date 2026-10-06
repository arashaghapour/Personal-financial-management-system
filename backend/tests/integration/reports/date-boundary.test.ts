import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../../../src/app.js";

describe("Reports API - Date Boundaries", () => {
  it("should include transactions on both startDate and endDate", async () => {
    const user = {
      email: "reports-date-boundary@example.com",
      password: "Password123!",
      firstName: "Reports",
      lastName: "Date Boundary",
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
        initialBalance: 100,
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

    // Outside the range - before startDate
    await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${token}`)
      .send({
        type: "INCOME",
        amount: 100,
        description: "Before range",
        date: "2026-09-30",
        accountId: accountResponse.body.id,
        categoryId: incomeCategoryResponse.body.id,
      })
      .expect(201);

    // Start boundary
    await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${token}`)
      .send({
        type: "INCOME",
        amount: 500,
        description: "Start boundary",
        date: "2026-10-01",
        accountId: accountResponse.body.id,
        categoryId: incomeCategoryResponse.body.id,
      })
      .expect(201);

    // End boundary
    await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${token}`)
      .send({
        type: "EXPENSE",
        amount: 100,
        description: "End boundary",
        date: "2026-10-31",
        accountId: accountResponse.body.id,
        categoryId: expenseCategoryResponse.body.id,
      })
      .expect(201);

    // Outside the range - after endDate
    await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${token}`)
      .send({
        type: "INCOME",
        amount: 200,
        description: "After range",
        date: "2026-11-01",
        accountId: accountResponse.body.id,
        categoryId: incomeCategoryResponse.body.id,
      })
      .expect(201);

    const response = await request(app)
      .get("/api/reports/summary")
      .query({
        startDate: "2026-10-01",
        endDate: "2026-10-31",
      })
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(response.body).toEqual({
      totalIncome: "500",
      totalExpenses: "100",
      netCashFlow: "400",
      transactionCount: 2,
      incomeTransactionCount: 1,
      expenseTransactionCount: 1,
    });
  });
});