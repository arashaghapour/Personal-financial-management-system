import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../../../src/app.js";

describe("Reports API - Cash Flow", () => {
  it("should return cash flow grouped by date", async () => {
    const user = {
      email: "reports-cash-flow@example.com",
      password: "Password123!",
      firstName: "Reports",
      lastName: "Cash Flow",
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
        initialBalance: 500,
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
        amount: 1000,
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
        amount: 200,
        description: "Expense 1",
        date: "2026-10-01",
        accountId: accountResponse.body.id,
        categoryId: expenseCategoryResponse.body.id,
      })
      .expect(201);

    await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${token}`)
      .send({
        type: "EXPENSE",
        amount: 300,
        description: "Expense 2",
        date: "2026-10-02",
        accountId: accountResponse.body.id,
        categoryId: expenseCategoryResponse.body.id,
      })
      .expect(201);

    const response = await request(app)
      .get("/api/reports/cash-flow")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(response.body).toEqual({
      startDate: "2026-10-01",
      endDate: "2026-10-02",
      data: [
        {
          date: "2026-10-01",
          income: "1000",
          expenses: "200",
          netCashFlow: "800",
        },
        {
          date: "2026-10-02",
          income: "0",
          expenses: "300",
          netCashFlow: "-300",
        },
      ],
    });
  });
});