import { describe, expect, it } from "vitest";

import request from "supertest";

import app from "../../../src/app.js";

describe("Budget API", () => {
  it("should create a budget", async () => {
    const email = "budget-api@example.com";
    const password = "Password123!";

    await request(app)
      .post("/api/auth/register")
      .send({
        email,
        password,
        firstName: "Budget",
        lastName: "Test",
      })
      .expect(201);

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email,
        password,
      })
      .expect(200);

    const accessToken = loginResponse.body.accessToken;

    const categoryResponse = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Food",
        type: "EXPENSE",
      })
      .expect(201);

    const categoryId = categoryResponse.body.id;

    const response = await request(app)
      .post("/api/budgets")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        categoryId,
        amount: 1000,
        year: 2026,
        month: 9,
      })
      .expect(201);

    expect(response.body).toMatchObject({
      categoryId,
      amount: "1000",
      year: 2026,
      month: 9,
    });

    expect(response.body.id).toEqual(expect.any(String));
    expect(response.body.startDate).toBeDefined();
  });

  it("should return user's budgets", async () => {
    const email = "budget-list@example.com";
    const password = "Password123!";

    await request(app)
      .post("/api/auth/register")
      .send({
        email,
        password,
        firstName: "Budget",
        lastName: "Test",
      })
      .expect(201);

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email,
        password,
      })
      .expect(200);

    const accessToken = loginResponse.body.accessToken;

    const categoryResponse = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Food",
        type: "EXPENSE",
      })
      .expect(201);

    const categoryId = categoryResponse.body.id;

    await request(app)
      .post("/api/budgets")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        categoryId,
        amount: 1000,
        year: 2026,
        month: 9,
      })
      .expect(201);

    await request(app)
      .post("/api/budgets")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        categoryId,
        amount: 1500,
        year: 2026,
        month: 10,
      })
      .expect(201);

    const response = await request(app)
      .get("/api/budgets")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body).toHaveLength(2);

    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          categoryId,
          amount: "1000",
          year: 2026,
          month: 9,
        }),
        expect.objectContaining({
          categoryId,
          amount: "1500",
          year: 2026,
          month: 10,
        }),
      ]),
    );
  });

  it("should return a budget by id", async () => {
    const email = "budget-get@example.com";
    const password = "Password123!";

    await request(app)
      .post("/api/auth/register")
      .send({
        email,
        password,
        firstName: "Budget",
        lastName: "Test",
      })
      .expect(201);

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email,
        password,
      })
      .expect(200);

    const accessToken = loginResponse.body.accessToken;

    const categoryResponse = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Food",
        type: "EXPENSE",
      })
      .expect(201);

    const categoryId = categoryResponse.body.id;

    const createResponse = await request(app)
      .post("/api/budgets")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        categoryId,
        amount: 1000,
        year: 2026,
        month: 9,
      })
      .expect(201);

    const budgetId = createResponse.body.id;

    const response = await request(app)
      .get(`/api/budgets/${budgetId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body).toMatchObject({
      id: budgetId,
      categoryId,
      amount: "1000",
      year: 2026,
      month: 9,
    });
  });

  it("should update a budget by id", async () => {
    const email = "budget-update@example.com";
    const password = "Password123!";

    await request(app)
      .post("/api/auth/register")
      .send({
        email,
        password,
        firstName: "Budget",
        lastName: "Test",
      })
      .expect(201);

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email,
        password,
      })
      .expect(200);

    const accessToken = loginResponse.body.accessToken;

    const categoryResponse = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Food",
        type: "EXPENSE",
      })
      .expect(201);

    const categoryId = categoryResponse.body.id;

    const createResponse = await request(app)
      .post("/api/budgets")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        categoryId,
        amount: 1000,
        year: 2026,
        month: 9,
      })
      .expect(201);

    const budgetId = createResponse.body.id;

    const response = await request(app)
      .patch(`/api/budgets/${budgetId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        amount: 1500,
      })
      .expect(200);

    expect(response.body).toMatchObject({
      id: budgetId,
      categoryId,
      amount: "1500",
      year: 2026,
      month: 9,
    });
  });

  it("should delete a budget by id", async () => {
    const email = "budget-delete@example.com";
    const password = "Password123!";

    await request(app)
      .post("/api/auth/register")
      .send({
        email,
        password,
        firstName: "Budget",
        lastName: "Test",
      })
      .expect(201);

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email,
        password,
      })
      .expect(200);

    const accessToken = loginResponse.body.accessToken;

    const categoryResponse = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Food",
        type: "EXPENSE",
      })
      .expect(201);

    const categoryId = categoryResponse.body.id;

    const createResponse = await request(app)
      .post("/api/budgets")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        categoryId,
        amount: 1000,
        year: 2026,
        month: 9,
      })
      .expect(201);

    const budgetId = createResponse.body.id;

    await request(app)
      .delete(`/api/budgets/${budgetId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(204);

    await request(app)
      .get(`/api/budgets/${budgetId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(404);
  });

  it("should return budget progress", async () => {
    const email = "budget-progress@example.com";
    const password = "Password123!";

    await request(app)
      .post("/api/auth/register")
      .send({
        email,
        password,
        firstName: "Budget",
        lastName: "Progress",
      })
      .expect(201);

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email,
        password,
      })
      .expect(200);

    const accessToken = loginResponse.body.accessToken;

    const categoryResponse = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Food",
        type: "EXPENSE",
      })
      .expect(201);

    const categoryId = categoryResponse.body.id;

    const budgetResponse = await request(app)
      .post("/api/budgets")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        categoryId,
        amount: 1000,
        year: 2026,
        month: 9,
      })
      .expect(201);

    const budgetId = budgetResponse.body.id;

    const accountResponse = await request(app)
      .post("/api/accounts")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Test Account",
        type: "CASH",
        initialBalance: 2000,
      })
      .expect(201);

    const accountId = accountResponse.body.id;

    await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        type: "EXPENSE",
        amount: 650,
        description: "Food expenses",
        date: "2026-09-15",
        accountId,
        categoryId,
      })
      .expect(201);

    const response = await request(app)
      .get(`/api/budgets/${budgetId}/progress`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body).toEqual({
      budgetId,
      budgetAmount: 1000,
      spentAmount: 650,
      remainingAmount: 350,
      percentageUsed: 65,
      status: "UNDER_BUDGET",
    });
  });

  it("should reject unauthenticated budget creation", async () => {
    const response = await request(app)
      .post("/api/budgets")
      .send({
        categoryId: "00000000-0000-0000-0000-000000000000",
        amount: 1000,
        year: 2026,
        month: 9,
      })
      .expect(401);

    expect(response.body.error.code).toBe("UNAUTHORIZED");
  });

  it("should reject budget creation with a non-existing category", async () => {
    const email = "budget-invalid-category@example.com";
    const password = "Password123!";

    await request(app)
      .post("/api/auth/register")
      .send({
        email,
        password,
        firstName: "Budget",
        lastName: "Test",
      })
      .expect(201);

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({ email, password })
      .expect(200);

    const accessToken = loginResponse.body.accessToken;

    const response = await request(app)
      .post("/api/budgets")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        categoryId: "00000000-0000-0000-0000-000000000000",
        amount: 1000,
        year: 2026,
        month: 9,
      })
      .expect(400);

    expect(response.body.error.code).toBe("INVALID_BUDGET_CATEGORY");
  });

  it("should reject another user's category", async () => {
    const userA = {
      email: "budget-owner-a@example.com",
      password: "Password123!",
    };

    const userB = {
      email: "budget-owner-b@example.com",
      password: "Password123!",
    };

    await request(app)
      .post("/api/auth/register")
      .send({
        ...userA,
        firstName: "Owner",
        lastName: "A",
      })
      .expect(201);

    const loginA = await request(app)
      .post("/api/auth/login")
      .send(userA)
      .expect(200);

    const tokenA = loginA.body.accessToken;

    const categoryResponse = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        name: "Food",
        type: "EXPENSE",
      })
      .expect(201);

    const categoryId = categoryResponse.body.id;

    await request(app)
      .post("/api/auth/register")
      .send({
        ...userB,
        firstName: "Owner",
        lastName: "B",
      })
      .expect(201);

    const loginB = await request(app)
      .post("/api/auth/login")
      .send(userB)
      .expect(200);

    const tokenB = loginB.body.accessToken;

    const response = await request(app)
      .post("/api/budgets")
      .set("Authorization", `Bearer ${tokenB}`)
      .send({
        categoryId,
        amount: 1000,
        year: 2026,
        month: 9,
      })
      .expect(400);

    expect(response.body.error.code).toBe("INVALID_BUDGET_CATEGORY");
  });

  it("should reject an income category", async () => {
    const email = "budget-income-category@example.com";
    const password = "Password123!";

    await request(app)
      .post("/api/auth/register")
      .send({
        email,
        password,
        firstName: "Budget",
        lastName: "Test",
      })
      .expect(201);

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({ email, password })
      .expect(200);

    const accessToken = loginResponse.body.accessToken;

    const categoryResponse = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Salary",
        type: "INCOME",
      })
      .expect(201);

    const response = await request(app)
      .post("/api/budgets")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        categoryId: categoryResponse.body.id,
        amount: 1000,
        year: 2026,
        month: 9,
      })
      .expect(400);

    expect(response.body.error.code).toBe("INVALID_BUDGET_CATEGORY");
  });

  it("should reject a duplicate budget", async () => {
    const email = "budget-duplicate@example.com";
    const password = "Password123!";

    await request(app)
      .post("/api/auth/register")
      .send({
        email,
        password,
        firstName: "Budget",
        lastName: "Test",
      })
      .expect(201);

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({ email, password })
      .expect(200);

    const accessToken = loginResponse.body.accessToken;

    const categoryResponse = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Food",
        type: "EXPENSE",
      })
      .expect(201);

    const categoryId = categoryResponse.body.id;

    await request(app)
      .post("/api/budgets")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        categoryId,
        amount: 1000,
        year: 2026,
        month: 9,
      })
      .expect(201);

    const response = await request(app)
      .post("/api/budgets")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        categoryId,
        amount: 1500,
        year: 2026,
        month: 9,
      })
      .expect(409);

    expect(response.body.error.code).toBe("DUPLICATE_BUDGET");
  });

  it("should reject an invalid budget amount", async () => {
    const email = "budget-invalid-amount@example.com";
    const password = "Password123!";

    await request(app)
      .post("/api/auth/register")
      .send({
        email,
        password,
        firstName: "Budget",
        lastName: "Test",
      })
      .expect(201);

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({ email, password })
      .expect(200);

    const accessToken = loginResponse.body.accessToken;

    const categoryResponse = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Food",
        type: "EXPENSE",
      })
      .expect(201);

    const response = await request(app)
      .post("/api/budgets")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        categoryId: categoryResponse.body.id,
        amount: 0,
        year: 2026,
        month: 9,
      })
      .expect(400);

    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("should reject unauthenticated budget list request", async () => {
    const response = await request(app).get("/api/budgets").expect(401);

    expect(response.body.error.code).toBe("UNAUTHORIZED");
  });

  it("should return only budgets belonging to the authenticated user", async () => {
    const userA = {
      email: "budget-read-owner-a@example.com",
      password: "Password123!",
    };

    const userB = {
      email: "budget-read-owner-b@example.com",
      password: "Password123!",
    };

    await request(app)
      .post("/api/auth/register")
      .send({
        ...userA,
        firstName: "Owner",
        lastName: "A",
      })
      .expect(201);

    const loginA = await request(app)
      .post("/api/auth/login")
      .send(userA)
      .expect(200);

    const tokenA = loginA.body.accessToken;

    const categoryAResponse = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        name: "Food",
        type: "EXPENSE",
      })
      .expect(201);

    await request(app)
      .post("/api/budgets")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        categoryId: categoryAResponse.body.id,
        amount: 1000,
        year: 2026,
        month: 10,
      })
      .expect(201);

    await request(app)
      .post("/api/auth/register")
      .send({
        ...userB,
        firstName: "Owner",
        lastName: "B",
      })
      .expect(201);

    const loginB = await request(app)
      .post("/api/auth/login")
      .send(userB)
      .expect(200);

    const tokenB = loginB.body.accessToken;

    const categoryBResponse = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${tokenB}`)
      .send({
        name: "Transport",
        type: "EXPENSE",
      })
      .expect(201);

    await request(app)
      .post("/api/budgets")
      .set("Authorization", `Bearer ${tokenB}`)
      .send({
        categoryId: categoryBResponse.body.id,
        amount: 2000,
        year: 2026,
        month: 10,
      })
      .expect(201);

    const response = await request(app)
      .get("/api/budgets")
      .set("Authorization", `Bearer ${tokenA}`)
      .expect(200);

    expect(response.body).toHaveLength(1);

    expect(response.body[0]).toMatchObject({
      categoryId: categoryAResponse.body.id,
      amount: "1000",
      year: 2026,
      month: 10,
    });

    expect(response.body[0].categoryId).not.toBe(categoryBResponse.body.id);
  });

  it("should filter budgets by year", async () => {
    const user = {
      email: "budget-filter-year@example.com",
      password: "Password123!",
    };

    await request(app)
      .post("/api/auth/register")
      .send({
        ...user,
        firstName: "Budget",
        lastName: "Filter",
      })
      .expect(201);

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send(user)
      .expect(200);

    const accessToken = loginResponse.body.accessToken;

    const categoryResponse = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Food",
        type: "EXPENSE",
      })
      .expect(201);

    const categoryId = categoryResponse.body.id;

    await request(app)
      .post("/api/budgets")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        categoryId,
        amount: 1000,
        year: 2026,
        month: 9,
      })
      .expect(201);

    await request(app)
      .post("/api/budgets")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        categoryId,
        amount: 1500,
        year: 2025,
        month: 9,
      })
      .expect(201);

    const response = await request(app)
      .get("/api/budgets")
      .query({
        year: 2026,
      })
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body).toHaveLength(1);

    expect(response.body[0]).toMatchObject({
      categoryId,
      amount: "1000",
      year: 2026,
      month: 9,
    });
  });

  it("should filter budgets by month", async () => {
    const user = {
      email: "budget-filter-month@example.com",
      password: "Password123!",
    };

    await request(app)
      .post("/api/auth/register")
      .send({
        ...user,
        firstName: "Budget",
        lastName: "Filter",
      })
      .expect(201);

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send(user)
      .expect(200);

    const accessToken = loginResponse.body.accessToken;

    const categoryResponse = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Food",
        type: "EXPENSE",
      })
      .expect(201);

    const categoryId = categoryResponse.body.id;

    await request(app)
      .post("/api/budgets")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        categoryId,
        amount: 1000,
        year: 2026,
        month: 9,
      })
      .expect(201);

    await request(app)
      .post("/api/budgets")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        categoryId,
        amount: 1500,
        year: 2026,
        month: 10,
      })
      .expect(201);

    const response = await request(app)
      .get("/api/budgets")
      .query({
        month: 9,
      })
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body).toHaveLength(1);

    expect(response.body[0]).toMatchObject({
      categoryId,
      amount: "1000",
      year: 2026,
      month: 9,
    });
  });

  it("should filter budgets by categoryId", async () => {
    const user = {
      email: "budget-filter-category@example.com",
      password: "Password123!",
    };

    await request(app)
      .post("/api/auth/register")
      .send({
        ...user,
        firstName: "Budget",
        lastName: "Filter",
      })
      .expect(201);

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send(user)
      .expect(200);

    const accessToken = loginResponse.body.accessToken;

    const foodCategoryResponse = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Food",
        type: "EXPENSE",
      })
      .expect(201);

    const transportCategoryResponse = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Transport",
        type: "EXPENSE",
      })
      .expect(201);

    const foodCategoryId = foodCategoryResponse.body.id;
    const transportCategoryId = transportCategoryResponse.body.id;

    await request(app)
      .post("/api/budgets")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        categoryId: foodCategoryId,
        amount: 1000,
        year: 2026,
        month: 9,
      })
      .expect(201);

    await request(app)
      .post("/api/budgets")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        categoryId: transportCategoryId,
        amount: 1500,
        year: 2026,
        month: 9,
      })
      .expect(201);

    const response = await request(app)
      .get("/api/budgets")
      .query({
        categoryId: foodCategoryId,
      })
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body).toHaveLength(1);

    expect(response.body[0]).toMatchObject({
      categoryId: foodCategoryId,
      amount: "1000",
      year: 2026,
      month: 9,
    });

    expect(response.body[0].categoryId).not.toBe(transportCategoryId);
  });

  it("should filter budgets by year, month, and categoryId", async () => {
    const email = "budget-filter-combined@example.com";
    const password = "Password123!";

    await request(app)
      .post("/api/auth/register")
      .send({
        email,
        password,
        firstName: "Budget",
        lastName: "Filter",
      })
      .expect(201);

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email,
        password,
      })
      .expect(200);

    const accessToken = loginResponse.body.accessToken;

    const foodCategoryResponse = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Food",
        type: "EXPENSE",
      })
      .expect(201);

    const transportCategoryResponse = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Transport",
        type: "EXPENSE",
      })
      .expect(201);

    const foodCategoryId = foodCategoryResponse.body.id;
    const transportCategoryId = transportCategoryResponse.body.id;

    await request(app)
      .post("/api/budgets")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        categoryId: foodCategoryId,
        amount: 1000,
        year: 2026,
        month: 9,
      })
      .expect(201);

    await request(app)
      .post("/api/budgets")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        categoryId: foodCategoryId,
        amount: 1500,
        year: 2026,
        month: 10,
      })
      .expect(201);

    await request(app)
      .post("/api/budgets")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        categoryId: transportCategoryId,
        amount: 2000,
        year: 2026,
        month: 9,
      })
      .expect(201);

    const response = await request(app)
      .get("/api/budgets")
      .query({
        year: 2026,
        month: 9,
        categoryId: foodCategoryId,
      })
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body).toHaveLength(1);

    expect(response.body[0]).toMatchObject({
      categoryId: foodCategoryId,
      amount: "1000",
      year: 2026,
      month: 9,
    });
  });

  it("should return 404 when requesting another user's budget", async () => {
    const userA = {
      email: "budget-read-id-owner-a@example.com",
      password: "Password123!",
    };

    const userB = {
      email: "budget-read-id-owner-b@example.com",
      password: "Password123!",
    };

    await request(app)
      .post("/api/auth/register")
      .send({
        ...userA,
        firstName: "Owner",
        lastName: "A",
      })
      .expect(201);

    const loginA = await request(app)
      .post("/api/auth/login")
      .send(userA)
      .expect(200);

    const tokenA = loginA.body.accessToken;

    const categoryResponse = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        name: "Food",
        type: "EXPENSE",
      })
      .expect(201);

    const budgetResponse = await request(app)
      .post("/api/budgets")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        categoryId: categoryResponse.body.id,
        amount: 1000,
        year: 2026,
        month: 9,
      })
      .expect(201);

    await request(app)
      .post("/api/auth/register")
      .send({
        ...userB,
        firstName: "Owner",
        lastName: "B",
      })
      .expect(201);

    const loginB = await request(app)
      .post("/api/auth/login")
      .send(userB)
      .expect(200);

    const tokenB = loginB.body.accessToken;

    const response = await request(app)
      .get(`/api/budgets/${budgetResponse.body.id}`)
      .set("Authorization", `Bearer ${tokenB}`)
      .expect(404);

    expect(response.body.error.code).toBe("NOT_FOUND");
  });

  it("should reject getting a budget with an invalid id", async () => {
    const email = "budget-read-invalid-id@example.com";
    const password = "Password123!";

    await request(app)
      .post("/api/auth/register")
      .send({
        email,
        password,
        firstName: "Budget",
        lastName: "Test",
      })
      .expect(201);

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email,
        password,
      })
      .expect(200);

    const accessToken = loginResponse.body.accessToken;

    const response = await request(app)
      .get("/api/budgets/invalid-id")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(400);

    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("should return 404 when updating another user's budget", async () => {
    const userA = {
      email: "budget-update-owner-a@example.com",
      password: "Password123!",
    };

    const userB = {
      email: "budget-update-owner-b@example.com",
      password: "Password123!",
    };

    await request(app)
      .post("/api/auth/register")
      .send({
        ...userA,
        firstName: "Owner",
        lastName: "A",
      })
      .expect(201);

    const loginA = await request(app)
      .post("/api/auth/login")
      .send(userA)
      .expect(200);

    const tokenA = loginA.body.accessToken;

    const categoryResponse = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        name: "Food",
        type: "EXPENSE",
      })
      .expect(201);

    const budgetResponse = await request(app)
      .post("/api/budgets")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        categoryId: categoryResponse.body.id,
        amount: 1000,
        year: 2026,
        month: 9,
      })
      .expect(201);

    await request(app)
      .post("/api/auth/register")
      .send({
        ...userB,
        firstName: "Owner",
        lastName: "B",
      })
      .expect(201);

    const loginB = await request(app)
      .post("/api/auth/login")
      .send(userB)
      .expect(200);

    const tokenB = loginB.body.accessToken;

    const response = await request(app)
      .patch(`/api/budgets/${budgetResponse.body.id}`)
      .set("Authorization", `Bearer ${tokenB}`)
      .send({
        amount: 2000,
      })
      .expect(404);

    expect(response.body.error.code).toBe("NOT_FOUND");
  });

  it("should return 404 when deleting another user's budget", async () => {
    const userA = {
      email: "budget-delete-owner-a@example.com",
      password: "Password123!",
    };

    const userB = {
      email: "budget-delete-owner-b@example.com",
      password: "Password123!",
    };

    await request(app)
      .post("/api/auth/register")
      .send({
        ...userA,
        firstName: "Owner",
        lastName: "A",
      })
      .expect(201);

    const loginA = await request(app)
      .post("/api/auth/login")
      .send(userA)
      .expect(200);

    const tokenA = loginA.body.accessToken;

    const categoryResponse = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        name: "Food",
        type: "EXPENSE",
      })
      .expect(201);

    const budgetResponse = await request(app)
      .post("/api/budgets")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        categoryId: categoryResponse.body.id,
        amount: 1000,
        year: 2026,
        month: 9,
      })
      .expect(201);

    await request(app)
      .post("/api/auth/register")
      .send({
        ...userB,
        firstName: "Owner",
        lastName: "B",
      })
      .expect(201);

    const loginB = await request(app)
      .post("/api/auth/login")
      .send(userB)
      .expect(200);

    const tokenB = loginB.body.accessToken;

    const response = await request(app)
      .delete(`/api/budgets/${budgetResponse.body.id}`)
      .set("Authorization", `Bearer ${tokenB}`)
      .expect(404);

    expect(response.body.error.code).toBe("NOT_FOUND");
  });

  it("should reject updating a budget with an invalid amount", async () => {
    const email = "budget-update-invalid-amount@example.com";
    const password = "Password123!";

    await request(app)
      .post("/api/auth/register")
      .send({
        email,
        password,
        firstName: "Budget",
        lastName: "Test",
      })
      .expect(201);

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email,
        password,
      })
      .expect(200);

    const accessToken = loginResponse.body.accessToken;

    const categoryResponse = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Food",
        type: "EXPENSE",
      })
      .expect(201);

    const budgetResponse = await request(app)
      .post("/api/budgets")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        categoryId: categoryResponse.body.id,
        amount: 1000,
        year: 2026,
        month: 9,
      })
      .expect(201);

    const response = await request(app)
      .patch(`/api/budgets/${budgetResponse.body.id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        amount: 0,
      })
      .expect(400);

    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("should reject updating a budget with unsupported fields", async () => {
    const email = "budget-update-extra-field@example.com";
    const password = "Password123!";

    await request(app)
      .post("/api/auth/register")
      .send({
        email,
        password,
        firstName: "Budget",
        lastName: "Test",
      })
      .expect(201);

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email,
        password,
      })
      .expect(200);

    const accessToken = loginResponse.body.accessToken;

    const categoryResponse = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Food",
        type: "EXPENSE",
      })
      .expect(201);

    const budgetResponse = await request(app)
      .post("/api/budgets")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        categoryId: categoryResponse.body.id,
        amount: 1000,
        year: 2026,
        month: 9,
      })
      .expect(201);

    const response = await request(app)
      .patch(`/api/budgets/${budgetResponse.body.id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        amount: 1500,
        year: 2027,
      })
      .expect(400);

    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("should return 404 when updating a non-existing budget", async () => {
    const email = "budget-update-not-found@example.com";
    const password = "Password123!";

    await request(app)
      .post("/api/auth/register")
      .send({
        email,
        password,
        firstName: "Budget",
        lastName: "Test",
      })
      .expect(201);

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email,
        password,
      })
      .expect(200);

    const accessToken = loginResponse.body.accessToken;

    const response = await request(app)
      .patch("/api/budgets/00000000-0000-0000-0000-000000000000")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        amount: 1500,
      })
      .expect(404);

    expect(response.body.error.code).toBe("NOT_FOUND");
  });

it("should return 404 when deleting a non-existing budget", async () => {
  const email = "budget-delete-not-found@example.com";
  const password = "Password123!";

  await request(app)
    .post("/api/auth/register")
    .send({
      email,
      password,
      firstName: "Budget",
      lastName: "Test",
    })
    .expect(201);

  const loginResponse = await request(app)
    .post("/api/auth/login")
    .send({
      email,
      password,
    })
    .expect(200);

  const accessToken = loginResponse.body.accessToken;

  const response = await request(app)
    .delete(
      "/api/budgets/00000000-0000-0000-0000-000000000000",
    )
    .set("Authorization", `Bearer ${accessToken}`)
    .expect(404);

  expect(response.body.error.code).toBe("NOT_FOUND");
});

it("should return 0% progress when there are no expenses", async () => {
  const email = "budget-progress-0@example.com";
  const password = "Password123!";

  await request(app)
    .post("/api/auth/register")
    .send({
      email,
      password,
      firstName: "Budget",
      lastName: "Progress",
    })
    .expect(201);

  const loginResponse = await request(app)
    .post("/api/auth/login")
    .send({
      email,
      password,
    })
    .expect(200);

  const accessToken = loginResponse.body.accessToken;

  const categoryResponse = await request(app)
    .post("/api/categories")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      name: "Food",
      type: "EXPENSE",
    })
    .expect(201);

  const budgetResponse = await request(app)
    .post("/api/budgets")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      categoryId: categoryResponse.body.id,
      amount: 1000,
      year: 2026,
      month: 9,
    })
    .expect(201);

  const response = await request(app)
    .get(`/api/budgets/${budgetResponse.body.id}/progress`)
    .set("Authorization", `Bearer ${accessToken}`)
    .expect(200);

  expect(response.body).toEqual({
    budgetId: budgetResponse.body.id,
    budgetAmount: 1000,
    spentAmount: 0,
    remainingAmount: 1000,
    percentageUsed: 0,
    status: "UNDER_BUDGET",
  });
});

it("should return 50% progress", async () => {
  const email = "budget-progress-50@example.com";
  const password = "Password123!";

  await request(app)
    .post("/api/auth/register")
    .send({
      email,
      password,
      firstName: "Budget",
      lastName: "Progress",
    })
    .expect(201);

  const loginResponse = await request(app)
    .post("/api/auth/login")
    .send({
      email,
      password,
    })
    .expect(200);

  const accessToken = loginResponse.body.accessToken;

  const categoryResponse = await request(app)
    .post("/api/categories")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      name: "Food",
      type: "EXPENSE",
    })
    .expect(201);

  const categoryId = categoryResponse.body.id;

  const budgetResponse = await request(app)
    .post("/api/budgets")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      categoryId,
      amount: 1000,
      year: 2026,
      month: 9,
    })
    .expect(201);

  const accountResponse = await request(app)
    .post("/api/accounts")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      name: "Test Account",
      type: "CASH",
      initialBalance: 2000,
    })
    .expect(201);

  await request(app)
    .post("/api/transactions")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      type: "EXPENSE",
      amount: 500,
      date: "2026-09-15",
      accountId: accountResponse.body.id,
      categoryId,
    })
    .expect(201);

  const response = await request(app)
    .get(`/api/budgets/${budgetResponse.body.id}/progress`)
    .set("Authorization", `Bearer ${accessToken}`)
    .expect(200);

  expect(response.body).toEqual({
    budgetId: budgetResponse.body.id,
    budgetAmount: 1000,
    spentAmount: 500,
    remainingAmount: 500,
    percentageUsed: 50,
    status: "UNDER_BUDGET",
  });
});

it("should return NEAR_LIMIT at 90% progress", async () => {
  const email = "budget-progress-90@example.com";
  const password = "Password123!";

  await request(app)
    .post("/api/auth/register")
    .send({
      email,
      password,
      firstName: "Budget",
      lastName: "Progress",
    })
    .expect(201);

  const loginResponse = await request(app)
    .post("/api/auth/login")
    .send({
      email,
      password,
    })
    .expect(200);

  const accessToken = loginResponse.body.accessToken;

  const categoryResponse = await request(app)
    .post("/api/categories")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      name: "Food",
      type: "EXPENSE",
    })
    .expect(201);

  const categoryId = categoryResponse.body.id;

  const budgetResponse = await request(app)
    .post("/api/budgets")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      categoryId,
      amount: 1000,
      year: 2026,
      month: 9,
    })
    .expect(201);

  const accountResponse = await request(app)
    .post("/api/accounts")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      name: "Test Account",
      type: "CASH",
      initialBalance: 2000,
    })
    .expect(201);

  await request(app)
    .post("/api/transactions")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      type: "EXPENSE",
      amount: 900,
      date: "2026-09-15",
      accountId: accountResponse.body.id,
      categoryId,
    })
    .expect(201);

  const response = await request(app)
    .get(`/api/budgets/${budgetResponse.body.id}/progress`)
    .set("Authorization", `Bearer ${accessToken}`)
    .expect(200);

  expect(response.body).toEqual({
    budgetId: budgetResponse.body.id,
    budgetAmount: 1000,
    spentAmount: 900,
    remainingAmount: 100,
    percentageUsed: 90,
    status: "NEAR_LIMIT",
  });
});

it("should return NEAR_LIMIT at 95% progress", async () => {
  const email = "budget-progress-95@example.com";
  const password = "Password123!";

  await request(app)
    .post("/api/auth/register")
    .send({
      email,
      password,
      firstName: "Budget",
      lastName: "Progress",
    })
    .expect(201);

  const loginResponse = await request(app)
    .post("/api/auth/login")
    .send({
      email,
      password,
    })
    .expect(200);

  const accessToken = loginResponse.body.accessToken;

  const categoryResponse = await request(app)
    .post("/api/categories")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      name: "Food",
      type: "EXPENSE",
    })
    .expect(201);

  const categoryId = categoryResponse.body.id;

  const budgetResponse = await request(app)
    .post("/api/budgets")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      categoryId,
      amount: 1000,
      year: 2026,
      month: 9,
    })
    .expect(201);

  const accountResponse = await request(app)
    .post("/api/accounts")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      name: "Test Account",
      type: "CASH",
      initialBalance: 2000,
    })
    .expect(201);

  await request(app)
    .post("/api/transactions")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      type: "EXPENSE",
      amount: 950,
      date: "2026-09-15",
      accountId: accountResponse.body.id,
      categoryId,
    })
    .expect(201);

  const response = await request(app)
    .get(`/api/budgets/${budgetResponse.body.id}/progress`)
    .set("Authorization", `Bearer ${accessToken}`)
    .expect(200);

  expect(response.body).toEqual({
    budgetId: budgetResponse.body.id,
    budgetAmount: 1000,
    spentAmount: 950,
    remainingAmount: 50,
    percentageUsed: 95,
    status: "NEAR_LIMIT",
  });
});

it("should return NEAR_LIMIT at 100% progress", async () => {
  const email = "budget-progress-100@example.com";
  const password = "Password123!";

  await request(app)
    .post("/api/auth/register")
    .send({
      email,
      password,
      firstName: "Budget",
      lastName: "Progress",
    })
    .expect(201);

  const loginResponse = await request(app)
    .post("/api/auth/login")
    .send({
      email,
      password,
    })
    .expect(200);

  const accessToken = loginResponse.body.accessToken;

  const categoryResponse = await request(app)
    .post("/api/categories")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      name: "Food",
      type: "EXPENSE",
    })
    .expect(201);

  const categoryId = categoryResponse.body.id;

  const budgetResponse = await request(app)
    .post("/api/budgets")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      categoryId,
      amount: 1000,
      year: 2026,
      month: 9,
    })
    .expect(201);

  const accountResponse = await request(app)
    .post("/api/accounts")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      name: "Test Account",
      type: "CASH",
      initialBalance: 2000,
    })
    .expect(201);

  await request(app)
    .post("/api/transactions")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      type: "EXPENSE",
      amount: 1000,
      date: "2026-09-15",
      accountId: accountResponse.body.id,
      categoryId,
    })
    .expect(201);

  const response = await request(app)
    .get(`/api/budgets/${budgetResponse.body.id}/progress`)
    .set("Authorization", `Bearer ${accessToken}`)
    .expect(200);

  expect(response.body).toEqual({
    budgetId: budgetResponse.body.id,
    budgetAmount: 1000,
    spentAmount: 1000,
    remainingAmount: 0,
    percentageUsed: 100,
    status: "NEAR_LIMIT",
  });
});

it("should return OVER_BUDGET when spending exceeds the budget", async () => {
  const email = "budget-progress-over@example.com";
  const password = "Password123!";

  await request(app)
    .post("/api/auth/register")
    .send({
      email,
      password,
      firstName: "Budget",
      lastName: "Progress",
    })
    .expect(201);

  const loginResponse = await request(app)
    .post("/api/auth/login")
    .send({
      email,
      password,
    })
    .expect(200);

  const accessToken = loginResponse.body.accessToken;

  const categoryResponse = await request(app)
    .post("/api/categories")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      name: "Food",
      type: "EXPENSE",
    })
    .expect(201);

  const categoryId = categoryResponse.body.id;

  const budgetResponse = await request(app)
    .post("/api/budgets")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      categoryId,
      amount: 1000,
      year: 2026,
      month: 9,
    })
    .expect(201);

  const accountResponse = await request(app)
    .post("/api/accounts")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      name: "Test Account",
      type: "CASH",
      initialBalance: 3000,
    })
    .expect(201);

  await request(app)
    .post("/api/transactions")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      type: "EXPENSE",
      amount: 1200,
      date: "2026-09-15",
      accountId: accountResponse.body.id,
      categoryId,
    })
    .expect(201);

  const response = await request(app)
    .get(`/api/budgets/${budgetResponse.body.id}/progress`)
    .set("Authorization", `Bearer ${accessToken}`)
    .expect(200);

  expect(response.body).toEqual({
    budgetId: budgetResponse.body.id,
    budgetAmount: 1000,
    spentAmount: 1200,
    remainingAmount: -200,
    percentageUsed: 120,
    status: "OVER_BUDGET",
  });
});

it("should ignore expenses from another category", async () => {
  const email = "budget-progress-other-category@example.com";
  const password = "Password123!";

  await request(app)
    .post("/api/auth/register")
    .send({
      email,
      password,
      firstName: "Budget",
      lastName: "Progress",
    })
    .expect(201);

  const loginResponse = await request(app)
    .post("/api/auth/login")
    .send({
      email,
      password,
    })
    .expect(200);

  const accessToken = loginResponse.body.accessToken;

  const foodCategoryResponse = await request(app)
    .post("/api/categories")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      name: "Food",
      type: "EXPENSE",
    })
    .expect(201);

  const transportCategoryResponse = await request(app)
    .post("/api/categories")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      name: "Transport",
      type: "EXPENSE",
    })
    .expect(201);

  const budgetResponse = await request(app)
    .post("/api/budgets")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      categoryId: foodCategoryResponse.body.id,
      amount: 1000,
      year: 2026,
      month: 9,
    })
    .expect(201);

  const accountResponse = await request(app)
    .post("/api/accounts")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      name: "Test Account",
      type: "CASH",
      initialBalance: 2000,
    })
    .expect(201);

  await request(app)
    .post("/api/transactions")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      type: "EXPENSE",
      amount: 700,
      date: "2026-09-15",
      accountId: accountResponse.body.id,
      categoryId: transportCategoryResponse.body.id,
    })
    .expect(201);

  const response = await request(app)
    .get(`/api/budgets/${budgetResponse.body.id}/progress`)
    .set("Authorization", `Bearer ${accessToken}`)
    .expect(200);

  expect(response.body.spentAmount).toBe(0);
  expect(response.body.percentageUsed).toBe(0);
  expect(response.body.status).toBe("UNDER_BUDGET");
});

it("should ignore income transactions", async () => {
  const email = "budget-progress-income@example.com";
  const password = "Password123!";

  await request(app)
    .post("/api/auth/register")
    .send({
      email,
      password,
      firstName: "Budget",
      lastName: "Progress",
    })
    .expect(201);

  const loginResponse = await request(app)
    .post("/api/auth/login")
    .send({
      email,
      password,
    })
    .expect(200);

  const accessToken = loginResponse.body.accessToken;

  const expenseCategoryResponse = await request(app)
    .post("/api/categories")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      name: "Food",
      type: "EXPENSE",
    })
    .expect(201);

  const incomeCategoryResponse = await request(app)
    .post("/api/categories")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      name: "Salary",
      type: "INCOME",
    })
    .expect(201);

  const budgetResponse = await request(app)
    .post("/api/budgets")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      categoryId: expenseCategoryResponse.body.id,
      amount: 1000,
      year: 2026,
      month: 9,
    })
    .expect(201);

  const accountResponse = await request(app)
    .post("/api/accounts")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      name: "Test Account",
      type: "CASH",
      initialBalance: 1000,
    })
    .expect(201);

  await request(app)
    .post("/api/transactions")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      type: "INCOME",
      amount: 2000,
      date: "2026-09-15",
      accountId: accountResponse.body.id,
      categoryId: incomeCategoryResponse.body.id,
    })
    .expect(201);

  const response = await request(app)
    .get(`/api/budgets/${budgetResponse.body.id}/progress`)
    .set("Authorization", `Bearer ${accessToken}`)
    .expect(200);

  expect(response.body.spentAmount).toBe(0);
  expect(response.body.percentageUsed).toBe(0);
  expect(response.body.status).toBe("UNDER_BUDGET");
});

it("should ignore expenses before the budget start date", async () => {
  const email = "budget-progress-before-start@example.com";
  const password = "Password123!";

  await request(app)
    .post("/api/auth/register")
    .send({
      email,
      password,
      firstName: "Budget",
      lastName: "Progress",
    })
    .expect(201);

  const loginResponse = await request(app)
    .post("/api/auth/login")
    .send({
      email,
      password,
    })
    .expect(200);

  const accessToken = loginResponse.body.accessToken;

  const categoryResponse = await request(app)
    .post("/api/categories")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      name: "Food",
      type: "EXPENSE",
    })
    .expect(201);

  const budgetResponse = await request(app)
    .post("/api/budgets")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      categoryId: categoryResponse.body.id,
      amount: 1000,
      year: 2026,
      month: 9,
    })
    .expect(201);

  const accountResponse = await request(app)
    .post("/api/accounts")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      name: "Test Account",
      type: "CASH",
      initialBalance: 2000,
    })
    .expect(201);

  await request(app)
    .post("/api/transactions")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      type: "EXPENSE",
      amount: 700,
      date: "2026-08-31",
      accountId: accountResponse.body.id,
      categoryId: categoryResponse.body.id,
    })
    .expect(201);

  const response = await request(app)
    .get(`/api/budgets/${budgetResponse.body.id}/progress`)
    .set("Authorization", `Bearer ${accessToken}`)
    .expect(200);

  expect(response.body.spentAmount).toBe(0);
  expect(response.body.percentageUsed).toBe(0);
  expect(response.body.status).toBe("UNDER_BUDGET");
});

it("should return 404 when requesting another user's budget progress", async () => {
  const userA = {
    email: "budget-progress-owner-a@example.com",
    password: "Password123!",
  };

  const userB = {
    email: "budget-progress-owner-b@example.com",
    password: "Password123!",
  };

  await request(app)
    .post("/api/auth/register")
    .send({
      ...userA,
      firstName: "Owner",
      lastName: "A",
    })
    .expect(201);

  const loginA = await request(app)
    .post("/api/auth/login")
    .send(userA)
    .expect(200);

  const tokenA = loginA.body.accessToken;

  const categoryResponse = await request(app)
    .post("/api/categories")
    .set("Authorization", `Bearer ${tokenA}`)
    .send({
      name: "Food",
      type: "EXPENSE",
    })
    .expect(201);

  const budgetResponse = await request(app)
    .post("/api/budgets")
    .set("Authorization", `Bearer ${tokenA}`)
    .send({
      categoryId: categoryResponse.body.id,
      amount: 1000,
      year: 2026,
      month: 9,
    })
    .expect(201);

  await request(app)
    .post("/api/auth/register")
    .send({
      ...userB,
      firstName: "Owner",
      lastName: "B",
    })
    .expect(201);

  const loginB = await request(app)
    .post("/api/auth/login")
    .send(userB)
    .expect(200);

  const tokenB = loginB.body.accessToken;

  const response = await request(app)
    .get(`/api/budgets/${budgetResponse.body.id}/progress`)
    .set("Authorization", `Bearer ${tokenB}`)
    .expect(404);

  expect(response.body.error.code).toBe("NOT_FOUND");
});

it("should return 404 when requesting progress for a non-existing budget", async () => {
  const email = "budget-progress-not-found@example.com";
  const password = "Password123!";

  await request(app)
    .post("/api/auth/register")
    .send({
      email,
      password,
      firstName: "Budget",
      lastName: "Progress",
    })
    .expect(201);

  const loginResponse = await request(app)
    .post("/api/auth/login")
    .send({
      email,
      password,
    })
    .expect(200);

  const accessToken = loginResponse.body.accessToken;

  const response = await request(app)
    .get(
      "/api/budgets/00000000-0000-0000-0000-000000000000/progress",
    )
    .set("Authorization", `Bearer ${accessToken}`)
    .expect(404);

  expect(response.body.error.code).toBe("NOT_FOUND");
});


  
});
