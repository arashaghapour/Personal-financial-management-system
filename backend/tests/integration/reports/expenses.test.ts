import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../../../src/app.js";

describe("Reports API - Expenses", () => {
  it("should return total expenses grouped by category", async () => {
    const user = {
      email: "reports-expenses@example.com",
      password: "Password123!",
      firstName: "Reports",
      lastName: "Expenses",
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
        initialBalance: 1000,
      })
      .expect(201);

    const foodCategoryResponse = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Food",
        type: "EXPENSE",
      })
      .expect(201);

    const transportCategoryResponse = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Transport",
        type: "EXPENSE",
      })
      .expect(201);

    await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${token}`)
      .send({
        type: "EXPENSE",
        amount: 500,
        description: "Food 1",
        date: "2026-10-01",
        accountId: accountResponse.body.id,
        categoryId: foodCategoryResponse.body.id,
      })
      .expect(201);

    await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${token}`)
      .send({
        type: "EXPENSE",
        amount: 300,
        description: "Food 2",
        date: "2026-10-02",
        accountId: accountResponse.body.id,
        categoryId: foodCategoryResponse.body.id,
      })
      .expect(201);

    await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${token}`)
      .send({
        type: "EXPENSE",
        amount: 200,
        description: "Transport",
        date: "2026-10-03",
        accountId: accountResponse.body.id,
        categoryId: transportCategoryResponse.body.id,
      })
      .expect(201);

    const response = await request(app)
      .get("/api/reports/expenses")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(response.body.totalExpenses).toBe("1000");

    expect(response.body.categories).toEqual([
      {
        categoryId: foodCategoryResponse.body.id,
        categoryName: "Food",
        amount: "800",
        transactionCount: 2,
      },
      {
        categoryId: transportCategoryResponse.body.id,
        categoryName: "Transport",
        amount: "200",
        transactionCount: 1,
      },
    ]);
  });
});