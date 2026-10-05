import { describe, expect, it } from "vitest";
import request from "supertest";

import app from "../../../src/app.js";

describe("Dashboard API", () => {
  it("should return an empty dashboard for a new user", async () => {
    const registerResponse = await request(app)
      .post("/api/auth/register")
      .send({
        email: "dashboard-empty@example.com",
        password: "Password123!",
        firstName: "Dashboard",
        lastName: "User",
      })
      .expect(201);

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: "dashboard-empty@example.com",
        password: "Password123!",
      })
      .expect(200);

    const accessToken = loginResponse.body.accessToken;

    expect(registerResponse.body.user).toBeDefined();

    const response = await request(app)
      .get("/api/dashboard")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body).toEqual({
      totalBalance: 0,
      totalIncome: 0,
      totalExpenses: 0,
      netCashFlow: 0,
      expenseByCategory: [],
      incomeByCategory: [],
      recentTransactions: [],
    });
  });

  it("should return the correct dashboard summary", async () => {
    const email = "dashboard-summary@example.com";

    await request(app)
      .post("/api/auth/register")
      .send({
        email,
        password: "Password123!",
        firstName: "Dashboard",
        lastName: "User",
      })
      .expect(201);

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email,
        password: "Password123!",
      })
      .expect(200);

    const accessToken = loginResponse.body.accessToken;

    const accountResponse = await request(app)
      .post("/api/accounts")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Main Account",
        type: "CASH",
        initialBalance: 1000,
      })
      .expect(201);

    const accountId = accountResponse.body.id;

    const incomeCategoryResponse = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Salary",
        type: "INCOME",
      })
      .expect(201);

    const incomeCategoryId = incomeCategoryResponse.body.id;

    const expenseCategoryResponse = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Food",
        type: "EXPENSE",
      })
      .expect(201);

    const expenseCategoryId = expenseCategoryResponse.body.id;

    await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        type: "INCOME",
        amount: 500,
        description: "Monthly salary",
        date: "2026-10-01",
        accountId,
        categoryId: incomeCategoryId,
      })
      .expect(201);

    await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        type: "EXPENSE",
        amount: 200,
        description: "Food expenses",
        date: "2026-10-02",
        accountId,
        categoryId: expenseCategoryId,
      })
      .expect(201);

    const response = await request(app)
      .get("/api/dashboard")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.totalBalance).toBe(1300);
    expect(response.body.totalIncome).toBe(500);
    expect(response.body.totalExpenses).toBe(200);
    expect(response.body.netCashFlow).toBe(300);

    expect(response.body.expenseByCategory).toEqual([
      {
        categoryId: expenseCategoryId,
        categoryName: "Food",
        total: "200",
      },
    ]);

    expect(response.body.incomeByCategory).toEqual([
      {
        categoryId: incomeCategoryId,
        categoryName: "Salary",
        total: "500",
      },
    ]);

    expect(response.body.recentTransactions).toHaveLength(2);
  });

  it("should return recent transactions in the dashboard", async () => {
    const email = "dashboard-recent@example.com";

    await request(app)
      .post("/api/auth/register")
      .send({
        email,
        password: "Password123!",
        firstName: "Dashboard",
        lastName: "User",
      })
      .expect(201);

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email,
        password: "Password123!",
      })
      .expect(200);

    const accessToken = loginResponse.body.accessToken;

    const accountResponse = await request(app)
      .post("/api/accounts")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Main Account",
        type: "CASH",
        initialBalance: 1000,
      })
      .expect(201);

    const accountId = accountResponse.body.id;

    const categoryResponse = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Food",
        type: "EXPENSE",
      })
      .expect(201);

    const categoryId = categoryResponse.body.id;

    for (let i = 0; i < 7; i++) {
      await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          type: "EXPENSE",
          amount: 10,
          description: `Expense ${i + 1}`,
          date: `2026-10-${String(i + 1).padStart(2, "0")}`,
          accountId,
          categoryId,
        })
        .expect(201);
    }

    const response = await request(app)
      .get("/api/dashboard")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.recentTransactions).toHaveLength(5);

    const dates = response.body.recentTransactions.map(
      (transaction: { date: string }) => transaction.date,
    );

    expect(dates).toEqual([
      expect.stringContaining("2026-10-07"),
      expect.stringContaining("2026-10-06"),
      expect.stringContaining("2026-10-05"),
      expect.stringContaining("2026-10-04"),
      expect.stringContaining("2026-10-03"),
    ]);
  });
  
});

describe("Dashboard API - Date Filters", () => {
  it("should filter dashboard transactions by startDate", async () => {
    const email = "dashboard-start-date@example.com";

    await request(app)
      .post("/api/auth/register")
      .send({
        email,
        password: "Password123!",
        firstName: "Dashboard",
        lastName: "User",
      })
      .expect(201);

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email,
        password: "Password123!",
      })
      .expect(200);

    const accessToken = loginResponse.body.accessToken;

    const accountResponse = await request(app)
      .post("/api/accounts")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Main Account",
        type: "CASH",
        initialBalance: 5000,
      })
      .expect(201);

    const accountId = accountResponse.body.id;

    const incomeCategoryResponse = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Salary",
        type: "INCOME",
      })
      .expect(201);

    const incomeCategoryId = incomeCategoryResponse.body.id;

    const expenseCategoryResponse = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Food",
        type: "EXPENSE",
      })
      .expect(201);

    const expenseCategoryId = expenseCategoryResponse.body.id;

    await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        type: "INCOME",
        amount: 1000,
        description: "Old income",
        date: "2026-09-01",
        accountId,
        categoryId: incomeCategoryId,
      })
      .expect(201);

    await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        type: "INCOME",
        amount: 2000,
        description: "New income",
        date: "2026-10-01",
        accountId,
        categoryId: incomeCategoryId,
      })
      .expect(201);

    await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        type: "EXPENSE",
        amount: 300,
        description: "Old expense",
        date: "2026-09-05",
        accountId,
        categoryId: expenseCategoryId,
      })
      .expect(201);

    await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        type: "EXPENSE",
        amount: 500,
        description: "New expense",
        date: "2026-10-02",
        accountId,
        categoryId: expenseCategoryId,
      })
      .expect(201);

    const response = await request(app)
      .get("/api/dashboard")
      .query({
        startDate: "2026-10-01",
      })
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.totalIncome).toBe(2000);
    expect(response.body.totalExpenses).toBe(500);
    expect(response.body.netCashFlow).toBe(1500);

    expect(response.body.incomeByCategory).toEqual([
      {
        categoryId: incomeCategoryId,
        categoryName: "Salary",
        total: "2000",
      },
    ]);

    expect(response.body.expenseByCategory).toEqual([
      {
        categoryId: expenseCategoryId,
        categoryName: "Food",
        total: "500",
      },
    ]);

    expect(response.body.recentTransactions).toHaveLength(2);
  });

  it("should filter dashboard transactions by endDate", async () => {
    const email = "dashboard-end-date@example.com";

    await request(app)
      .post("/api/auth/register")
      .send({
        email,
        password: "Password123!",
        firstName: "Dashboard",
        lastName: "User",
      })
      .expect(201);

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email,
        password: "Password123!",
      })
      .expect(200);

    const accessToken = loginResponse.body.accessToken;

    const accountResponse = await request(app)
      .post("/api/accounts")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Main Account",
        type: "CASH",
        initialBalance: 5000,
      })
      .expect(201);

    const accountId = accountResponse.body.id;

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
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        type: "EXPENSE",
        amount: 200,
        description: "Included expense",
        date: "2026-09-30",
        accountId,
        categoryId,
      })
      .expect(201);

    await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        type: "EXPENSE",
        amount: 500,
        description: "Excluded expense",
        date: "2026-10-01",
        accountId,
        categoryId,
      })
      .expect(201);

    const response = await request(app)
      .get("/api/dashboard")
      .query({
        endDate: "2026-09-30",
      })
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.totalExpenses).toBe(200);
    expect(response.body.netCashFlow).toBe(-200);

    expect(response.body.expenseByCategory).toEqual([
      {
        categoryId,
        categoryName: "Food",
        total: "200",
      },
    ]);

    expect(response.body.recentTransactions).toHaveLength(1);
    expect(response.body.recentTransactions[0].description).toBe(
      "Included expense",
    );
  });

  it("should filter dashboard transactions between startDate and endDate", async () => {
    const email = "dashboard-date-range@example.com";

    await request(app)
      .post("/api/auth/register")
      .send({
        email,
        password: "Password123!",
        firstName: "Dashboard",
        lastName: "User",
      })
      .expect(201);

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email,
        password: "Password123!",
      })
      .expect(200);

    const accessToken = loginResponse.body.accessToken;

    const accountResponse = await request(app)
      .post("/api/accounts")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Main Account",
        type: "CASH",
        initialBalance: 5000,
      })
      .expect(201);

    const accountId = accountResponse.body.id;

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
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        type: "EXPENSE",
        amount: 100,
        description: "Before range",
        date: "2026-09-30",
        accountId,
        categoryId,
      })
      .expect(201);

    await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        type: "EXPENSE",
        amount: 300,
        description: "Inside range",
        date: "2026-10-05",
        accountId,
        categoryId,
      })
      .expect(201);

    await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        type: "EXPENSE",
        amount: 200,
        description: "After range",
        date: "2026-10-10",
        accountId,
        categoryId,
      })
      .expect(201);

    const response = await request(app)
      .get("/api/dashboard")
      .query({
        startDate: "2026-10-01",
        endDate: "2026-10-09",
      })
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.totalExpenses).toBe(300);
    expect(response.body.netCashFlow).toBe(-300);

    expect(response.body.expenseByCategory).toEqual([
      {
        categoryId,
        categoryName: "Food",
        total: "300",
      },
    ]);

    expect(response.body.recentTransactions).toHaveLength(1);
    expect(response.body.recentTransactions[0].description).toBe(
      "Inside range",
    );
  });

  it("should include transactions on the startDate and endDate boundaries", async () => {
    const email = "dashboard-date-boundary@example.com";

    await request(app)
      .post("/api/auth/register")
      .send({
        email,
        password: "Password123!",
        firstName: "Dashboard",
        lastName: "User",
      })
      .expect(201);

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email,
        password: "Password123!",
      })
      .expect(200);

    const accessToken = loginResponse.body.accessToken;

    const accountResponse = await request(app)
      .post("/api/accounts")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Main Account",
        type: "CASH",
        initialBalance: 5000,
      })
      .expect(201);

    const accountId = accountResponse.body.id;

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
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        type: "EXPENSE",
        amount: 100,
        description: "Start boundary",
        date: "2026-10-01",
        accountId,
        categoryId,
      })
      .expect(201);

    await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        type: "EXPENSE",
        amount: 200,
        description: "End boundary",
        date: "2026-10-10",
        accountId,
        categoryId,
      })
      .expect(201);

    const response = await request(app)
      .get("/api/dashboard")
      .query({
        startDate: "2026-10-01",
        endDate: "2026-10-10",
      })
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.totalExpenses).toBe(300);
    expect(response.body.recentTransactions).toHaveLength(2);
  });

  it("should return 400 for an invalid date format", async () => {
    const email = "dashboard-invalid-date@example.com";

    await request(app)
      .post("/api/auth/register")
      .send({
        email,
        password: "Password123!",
        firstName: "Dashboard",
        lastName: "User",
      })
      .expect(201);

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email,
        password: "Password123!",
      })
      .expect(200);

    const accessToken = loginResponse.body.accessToken;

    await request(app)
      .get("/api/dashboard")
      .query({
        startDate: "2026/10/01",
      })
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(400);
  });

  it("should return 400 when startDate is after endDate", async () => {
    const email = "dashboard-invalid-range@example.com";

    await request(app)
      .post("/api/auth/register")
      .send({
        email,
        password: "Password123!",
        firstName: "Dashboard",
        lastName: "User",
      })
      .expect(201);

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email,
        password: "Password123!",
      })
      .expect(200);

    const accessToken = loginResponse.body.accessToken;

    await request(app)
      .get("/api/dashboard")
      .query({
        startDate: "2026-10-10",
        endDate: "2026-10-01",
      })
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(400);
  });
});


describe("Dashboard API - Recent Transactions", () => {
  it("should return at most 5 recent transactions", async () => {
    const email = "dashboard-recent-limit@example.com";

    await request(app)
      .post("/api/auth/register")
      .send({
        email,
        password: "Password123!",
        firstName: "Dashboard",
        lastName: "User",
      })
      .expect(201);

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email,
        password: "Password123!",
      })
      .expect(200);

    const accessToken = loginResponse.body.accessToken;

    const accountResponse = await request(app)
      .post("/api/accounts")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Main Account",
        type: "CASH",
        initialBalance: 10000,
      })
      .expect(201);

    const accountId = accountResponse.body.id;

    const categoryResponse = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Food",
        type: "EXPENSE",
      })
      .expect(201);

    const categoryId = categoryResponse.body.id;

    for (let i = 1; i <= 7; i++) {
      await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          type: "EXPENSE",
          amount: 10,
          description: `Expense ${i}`,
          date: `2026-10-${String(i).padStart(2, "0")}`,
          accountId,
          categoryId,
        })
        .expect(201);
    }

    const response = await request(app)
      .get("/api/dashboard")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.recentTransactions).toHaveLength(5);
  });

  it("should order recent transactions by date descending", async () => {
    const email = "dashboard-recent-date@example.com";

    await request(app)
      .post("/api/auth/register")
      .send({
        email,
        password: "Password123!",
        firstName: "Dashboard",
        lastName: "User",
      })
      .expect(201);

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email,
        password: "Password123!",
      })
      .expect(200);

    const accessToken = loginResponse.body.accessToken;

    const accountResponse = await request(app)
      .post("/api/accounts")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Main Account",
        type: "CASH",
        initialBalance: 10000,
      })
      .expect(201);

    const accountId = accountResponse.body.id;

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
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        type: "EXPENSE",
        amount: 100,
        description: "Older transaction",
        date: "2026-10-01",
        accountId,
        categoryId,
      })
      .expect(201);

    await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        type: "EXPENSE",
        amount: 200,
        description: "Newer transaction",
        date: "2026-10-05",
        accountId,
        categoryId,
      })
      .expect(201);

    await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        type: "EXPENSE",
        amount: 300,
        description: "Newest transaction",
        date: "2026-10-10",
        accountId,
        categoryId,
      })
      .expect(201);

    const response = await request(app)
      .get("/api/dashboard")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    const transactions = response.body.recentTransactions;

    expect(transactions).toHaveLength(3);

    expect(transactions.map(
      (transaction: { description: string }) => transaction.description,
    )).toEqual([
      "Newest transaction",
      "Newer transaction",
      "Older transaction",
    ]);
  });

  it("should order transactions with the same date by createdAt descending", async () => {
    const email = "dashboard-recent-created-at@example.com";

    await request(app)
      .post("/api/auth/register")
      .send({
        email,
        password: "Password123!",
        firstName: "Dashboard",
        lastName: "User",
      })
      .expect(201);

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email,
        password: "Password123!",
      })
      .expect(200);

    const accessToken = loginResponse.body.accessToken;

    const accountResponse = await request(app)
      .post("/api/accounts")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Main Account",
        type: "CASH",
        initialBalance: 10000,
      })
      .expect(201);

    const accountId = accountResponse.body.id;

    const categoryResponse = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Food",
        type: "EXPENSE",
      })
      .expect(201);

    const categoryId = categoryResponse.body.id;

    const firstResponse = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        type: "EXPENSE",
        amount: 100,
        description: "First transaction",
        date: "2026-10-10",
        accountId,
        categoryId,
      })
      .expect(201);

    const secondResponse = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        type: "EXPENSE",
        amount: 200,
        description: "Second transaction",
        date: "2026-10-10",
        accountId,
        categoryId,
      })
      .expect(201);

    expect(
      new Date(secondResponse.body.createdAt).getTime(),
    ).toBeGreaterThan(
      new Date(firstResponse.body.createdAt).getTime(),
    );

    const response = await request(app)
      .get("/api/dashboard")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.recentTransactions).toHaveLength(2);

    expect(
      response.body.recentTransactions.map(
        (transaction: { description: string }) => transaction.description,
      ),
    ).toEqual([
      "Second transaction",
      "First transaction",
    ]);
  });

  it("should apply date filters to recent transactions", async () => {
    const email = "dashboard-recent-filter@example.com";

    await request(app)
      .post("/api/auth/register")
      .send({
        email,
        password: "Password123!",
        firstName: "Dashboard",
        lastName: "User",
      })
      .expect(201);

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email,
        password: "Password123!",
      })
      .expect(200);

    const accessToken = loginResponse.body.accessToken;

    const accountResponse = await request(app)
      .post("/api/accounts")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Main Account",
        type: "CASH",
        initialBalance: 10000,
      })
      .expect(201);

    const accountId = accountResponse.body.id;

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
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        type: "EXPENSE",
        amount: 100,
        description: "Before filter",
        date: "2026-09-20",
        accountId,
        categoryId,
      })
      .expect(201);

    await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        type: "EXPENSE",
        amount: 200,
        description: "Inside filter",
        date: "2026-10-05",
        accountId,
        categoryId,
      })
      .expect(201);

    await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        type: "EXPENSE",
        amount: 300,
        description: "After filter",
        date: "2026-10-20",
        accountId,
        categoryId,
      })
      .expect(201);

    const response = await request(app)
      .get("/api/dashboard")
      .query({
        startDate: "2026-10-01",
        endDate: "2026-10-10",
      })
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.recentTransactions).toHaveLength(1);

    expect(response.body.recentTransactions[0].description).toBe(
      "Inside filter",
    );
  });
});

describe("Dashboard API - Authentication", () => {
  it("should return 401 when no access token is provided", async () => {
    await request(app)
      .get("/api/dashboard")
      .expect(401);
  });

  it("should return 401 when an invalid access token is provided", async () => {
    await request(app)
      .get("/api/dashboard")
      .set("Authorization", "Bearer invalid-access-token")
      .expect(401);
  });

  it("should return 401 when an expired access token is provided", async () => {
    const email = "dashboard-expired-token@example.com";

    await request(app)
      .post("/api/auth/register")
      .send({
        email,
        password: "Password123!",
        firstName: "Dashboard",
        lastName: "User",
      })
      .expect(201);

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email,
        password: "Password123!",
      })
      .expect(200);

    const accessToken = loginResponse.body.accessToken;

    expect(accessToken).toBeDefined();

    // Make the token invalid by modifying its payload/signature.
    const expiredToken = `${accessToken.slice(0, -1)}x`;

    await request(app)
      .get("/api/dashboard")
      .set("Authorization", `Bearer ${expiredToken}`)
      .expect(401);
  });

  it("should return 200 when a valid access token is provided", async () => {
    const email = "dashboard-valid-token@example.com";

    await request(app)
      .post("/api/auth/register")
      .send({
        email,
        password: "Password123!",
        firstName: "Dashboard",
        lastName: "User",
      })
      .expect(201);

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email,
        password: "Password123!",
      })
      .expect(200);

    const accessToken = loginResponse.body.accessToken;

    const response = await request(app)
      .get("/api/dashboard")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body).toEqual({
      totalBalance: 0,
      totalIncome: 0,
      totalExpenses: 0,
      netCashFlow: 0,
      expenseByCategory: [],
      incomeByCategory: [],
      recentTransactions: [],
    });
  });
});

describe("Dashboard API - Ownership / IDOR", () => {
  it("should return only the authenticated user's dashboard data", async () => {
    const userA = {
      email: "dashboard-user-a@example.com",
      password: "Password123!",
      firstName: "User",
      lastName: "A",
    };

    const userB = {
      email: "dashboard-user-b@example.com",
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
        name: "Salary A",
        type: "INCOME",
      })
      .expect(201);

    await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        type: "INCOME",
        amount: 500,
        description: "User A income",
        date: "2026-10-01",
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
        initialBalance: 3000,
      })
      .expect(201);

    const categoryB = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${tokenB}`)
      .send({
        name: "Salary B",
        type: "INCOME",
      })
      .expect(201);

    await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${tokenB}`)
      .send({
        type: "INCOME",
        amount: 2000,
        description: "User B income",
        date: "2026-10-02",
        accountId: accountB.body.id,
        categoryId: categoryB.body.id,
      })
      .expect(201);

    const dashboardA = await request(app)
      .get("/api/dashboard")
      .set("Authorization", `Bearer ${tokenA}`)
      .expect(200);

    expect(dashboardA.body.totalBalance).toBe(1500);
    expect(dashboardA.body.totalIncome).toBe(500);
    expect(dashboardA.body.totalExpenses).toBe(0);
    expect(dashboardA.body.netCashFlow).toBe(500);

    expect(dashboardA.body.incomeByCategory).toEqual([
      {
        categoryId: categoryA.body.id,
        categoryName: "Salary A",
        total: "500",
      },
    ]);

    expect(
      dashboardA.body.recentTransactions.map(
        (transaction: { description: string }) =>
          transaction.description,
      ),
    ).toEqual(["User A income"]);

    const dashboardB = await request(app)
      .get("/api/dashboard")
      .set("Authorization", `Bearer ${tokenB}`)
      .expect(200);

    expect(dashboardB.body.totalBalance).toBe(5000);
    expect(dashboardB.body.totalIncome).toBe(2000);
    expect(dashboardB.body.totalExpenses).toBe(0);
    expect(dashboardB.body.netCashFlow).toBe(2000);

    expect(dashboardB.body.incomeByCategory).toEqual([
      {
        categoryId: categoryB.body.id,
        categoryName: "Salary B",
        total: "2000",
      },
    ]);

    expect(
      dashboardB.body.recentTransactions.map(
        (transaction: { description: string }) =>
          transaction.description,
      ),
    ).toEqual(["User B income"]);
  });

  it("should not allow userId query parameter to override authenticated ownership", async () => {
    const userA = {
      email: "dashboard-idor-a@example.com",
      password: "Password123!",
      firstName: "User",
      lastName: "A",
    };

    const userB = {
      email: "dashboard-idor-b@example.com",
      password: "Password123!",
      firstName: "User",
      lastName: "B",
    };

    await request(app)
      .post("/api/auth/register")
      .send(userA)
      .expect(201);

    const registerB = await request(app)
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

    const tokenA = loginA.body.accessToken;

    const userBId = registerB.body.user.id;

    await request(app)
      .get("/api/dashboard")
      .query({
        userId: userBId,
      })
      .set("Authorization", `Bearer ${tokenA}`)
      .expect(400);
  });
});