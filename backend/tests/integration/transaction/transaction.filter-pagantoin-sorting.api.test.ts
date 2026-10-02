import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";

import app from "../../../src/app.js";



let accessToken: string;

const createCategory = async (
  name: string,
  type: "INCOME" | "EXPENSE",
) => {
  const response = await request(app)
    .post("/api/categories")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      name,
      type,
    });

  expect(response.status).toBe(201);

  return response.body;
};

const createAccount = async (
  name: string,
  initialBalance = 10000,
) => {
  const response = await request(app)
    .post("/api/accounts")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      name,
      type: "BANK",
      initialBalance,
    });

  expect(response.status).toBe(201);

  return response.body;
};

const createTransaction = async ({
  type,
  amount,
  date,
  accountId,
  categoryId,
  description,
}: {
  type: "INCOME" | "EXPENSE";
  amount: number;
  date: string;
  accountId: number;
  categoryId: string;
  description?: string;
}) => {
  const response = await request(app)
    .post("/api/transactions")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      type,
      amount,
      date,
      accountId,
      categoryId,
      description,
    });

  expect(response.status).toBe(201);

  return response.body;
};

beforeEach(async () => {
  const registerResponse = await request(app)
    .post("/api/auth/register")
    .send({
      email: "transaction-filter-validation@example.com",
      password: "Password123!",
      firstName: "Test",
      lastName: "User",
    });

  expect(registerResponse.status).toBe(201);

  const loginResponse = await request(app)
    .post("/api/auth/login")
    .send({
      email: "transaction-filter-validation@example.com",
      password: "Password123!",
    });

  expect(loginResponse.status).toBe(200);

  accessToken = loginResponse.body.accessToken;
});

describe("Transaction filtering, pagination and sorting", () => {
  describe("Filtering", () => {
    it("should filter transactions by type", async () => {
      const account = await createAccount("Main Bank");

      const expenseCategory = await createCategory(
        "Food",
        "EXPENSE",
      );

      const incomeCategory = await createCategory(
        "Salary",
        "INCOME",
      );

      await createTransaction({
        type: "EXPENSE",
        amount: 100,
        date: "2026-09-10",
        accountId: account.id,
        categoryId: expenseCategory.id,
        description: "Food",
      });

      await createTransaction({
        type: "INCOME",
        amount: 3000,
        date: "2026-09-15",
        accountId: account.id,
        categoryId: incomeCategory.id,
        description: "Salary",
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
      expect(response.body.data[0].description).toBe("Food");
    });

    it("should filter transactions by accountId", async () => {
      const accountA = await createAccount("Bank A");
      const accountB = await createAccount("Bank B");

      const category = await createCategory(
        "Food",
        "EXPENSE",
      );

      await createTransaction({
        type: "EXPENSE",
        amount: 100,
        date: "2026-09-10",
        accountId: accountA.id,
        categoryId: category.id,
        description: "Account A transaction",
      });

      await createTransaction({
        type: "EXPENSE",
        amount: 200,
        date: "2026-09-11",
        accountId: accountB.id,
        categoryId: category.id,
        description: "Account B transaction",
      });

      const response = await request(app)
        .get("/api/transactions")
        .query({
          accountId: accountA.id,
        })
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].accountId).toBe(accountA.id);
      expect(response.body.data[0].description).toBe(
        "Account A transaction",
      );
    });

    it("should filter transactions by categoryId", async () => {
      const account = await createAccount("Main Bank");

      const foodCategory = await createCategory(
        "Food",
        "EXPENSE",
      );

      const transportCategory = await createCategory(
        "Transport",
        "EXPENSE",
      );

      await createTransaction({
        type: "EXPENSE",
        amount: 100,
        date: "2026-09-10",
        accountId: account.id,
        categoryId: foodCategory.id,
        description: "Food transaction",
      });

      await createTransaction({
        type: "EXPENSE",
        amount: 200,
        date: "2026-09-11",
        accountId: account.id,
        categoryId: transportCategory.id,
        description: "Transport transaction",
      });

      const response = await request(app)
        .get("/api/transactions")
        .query({
          categoryId: foodCategory.id,
        })
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].categoryId).toBe(
        foodCategory.id,
      );
      expect(response.body.data[0].description).toBe(
        "Food transaction",
      );
    });

    it("should filter transactions by startDate", async () => {
      const account = await createAccount("Main Bank");

      const category = await createCategory(
        "Food",
        "EXPENSE",
      );

      await createTransaction({
        type: "EXPENSE",
        amount: 100,
        date: "2026-09-05",
        accountId: account.id,
        categoryId: category.id,
        description: "Before start date",
      });

      await createTransaction({
        type: "EXPENSE",
        amount: 200,
        date: "2026-09-15",
        accountId: account.id,
        categoryId: category.id,
        description: "After start date",
      });

      const response = await request(app)
        .get("/api/transactions")
        .query({
          startDate: "2026-09-10",
        })
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].description).toBe(
        "After start date",
      );
    });

    it("should filter transactions by endDate", async () => {
      const account = await createAccount("Main Bank");

      const category = await createCategory(
        "Food",
        "EXPENSE",
      );

      await createTransaction({
        type: "EXPENSE",
        amount: 100,
        date: "2026-09-05",
        accountId: account.id,
        categoryId: category.id,
        description: "Before end date",
      });

      await createTransaction({
        type: "EXPENSE",
        amount: 200,
        date: "2026-09-20",
        accountId: account.id,
        categoryId: category.id,
        description: "After end date",
      });

      const response = await request(app)
        .get("/api/transactions")
        .query({
          endDate: "2026-09-10",
        })
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].description).toBe(
        "Before end date",
      );
    });

    it("should filter transactions by minAmount", async () => {
      const account = await createAccount("Main Bank");

      const category = await createCategory(
        "Food",
        "EXPENSE",
      );

      await createTransaction({
        type: "EXPENSE",
        amount: 100,
        date: "2026-09-10",
        accountId: account.id,
        categoryId: category.id,
      });

      await createTransaction({
        type: "EXPENSE",
        amount: 500,
        date: "2026-09-11",
        accountId: account.id,
        categoryId: category.id,
      });

      const response = await request(app)
        .get("/api/transactions")
        .query({
          minAmount: 300,
        })
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].amount).toBe("500");
    });

    it("should filter transactions by maxAmount", async () => {
      const account = await createAccount("Main Bank");

      const category = await createCategory(
        "Food",
        "EXPENSE",
      );

      await createTransaction({
        type: "EXPENSE",
        amount: 100,
        date: "2026-09-10",
        accountId: account.id,
        categoryId: category.id,
      });

      await createTransaction({
        type: "EXPENSE",
        amount: 500,
        date: "2026-09-11",
        accountId: account.id,
        categoryId: category.id,
      });

      const response = await request(app)
        .get("/api/transactions")
        .query({
          maxAmount: 300,
        })
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].amount).toBe("100");
    });

    it("should apply multiple filters together", async () => {
      const accountA = await createAccount("Bank A");
      const accountB = await createAccount("Bank B");

      const foodCategory = await createCategory(
        "Food",
        "EXPENSE",
      );

      await createTransaction({
        type: "EXPENSE",
        amount: 100,
        date: "2026-09-05",
        accountId: accountA.id,
        categoryId: foodCategory.id,
      });

      await createTransaction({
        type: "EXPENSE",
        amount: 500,
        date: "2026-09-15",
        accountId: accountA.id,
        categoryId: foodCategory.id,
      });

      await createTransaction({
        type: "EXPENSE",
        amount: 700,
        date: "2026-09-15",
        accountId: accountB.id,
        categoryId: foodCategory.id,
      });

      const response = await request(app)
        .get("/api/transactions")
        .query({
          accountId: accountA.id,
          categoryId: foodCategory.id,
          startDate: "2026-09-10",
          endDate: "2026-09-20",
          minAmount: 400,
          maxAmount: 600,
        })
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].accountId).toBe(
        accountA.id,
      );
      expect(response.body.data[0].categoryId).toBe(
        foodCategory.id,
      );
      expect(response.body.data[0].amount).toBe("500");
    });
  });

  describe("Pagination", () => {
    it("should return the requested page and limit", async () => {
      const account = await createAccount("Main Bank");

      const category = await createCategory(
        "Food",
        "EXPENSE",
      );

      for (let i = 1; i <= 5; i++) {
        await createTransaction({
          type: "EXPENSE",
          amount: i * 100,
          date: `2026-09-${String(i).padStart(2, "0")}`,
          accountId: account.id,
          categoryId: category.id,
        });
      }

      const response = await request(app)
        .get("/api/transactions")
        .query({
          page: 2,
          limit: 2,
          sort: "date_asc",
        })
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);

      expect(response.body.data).toHaveLength(2);

      expect(response.body.pagination).toEqual({
        page: 2,
        limit: 2,
        total: 5,
        totalPages: 3,
      });

      expect(response.body.data[0].amount).toBe("300");
      expect(response.body.data[1].amount).toBe("400");
    });

    it("should return the correct total", async () => {
      const account = await createAccount("Main Bank");

      const category = await createCategory(
        "Food",
        "EXPENSE",
      );

      for (let i = 1; i <= 4; i++) {
        await createTransaction({
          type: "EXPENSE",
          amount: i * 100,
          date: `2026-09-${String(i).padStart(2, "0")}`,
          accountId: account.id,
          categoryId: category.id,
        });
      }

      const response = await request(app)
        .get("/api/transactions")
        .query({
          page: 1,
          limit: 2,
        })
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);

      expect(response.body.pagination.total).toBe(4);
    });

    it("should calculate totalPages correctly", async () => {
      const account = await createAccount("Main Bank");

      const category = await createCategory(
        "Food",
        "EXPENSE",
      );

      for (let i = 1; i <= 5; i++) {
        await createTransaction({
          type: "EXPENSE",
          amount: i * 100,
          date: `2026-09-${String(i).padStart(2, "0")}`,
          accountId: account.id,
          categoryId: category.id,
        });
      }

      const response = await request(app)
        .get("/api/transactions")
        .query({
          page: 1,
          limit: 2,
        })
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);

      expect(response.body.pagination).toEqual({
        page: 1,
        limit: 2,
        total: 5,
        totalPages: 3,
      });
    });
  });

  describe("Sorting", () => {
    it("should sort transactions by date ascending", async () => {
      const account = await createAccount("Main Bank");

      const category = await createCategory(
        "Food",
        "EXPENSE",
      );

      await createTransaction({
        type: "EXPENSE",
        amount: 300,
        date: "2026-09-03",
        accountId: account.id,
        categoryId: category.id,
      });

      await createTransaction({
        type: "EXPENSE",
        amount: 100,
        date: "2026-09-01",
        accountId: account.id,
        categoryId: category.id,
      });

      await createTransaction({
        type: "EXPENSE",
        amount: 200,
        date: "2026-09-02",
        accountId: account.id,
        categoryId: category.id,
      });

      const response = await request(app)
        .get("/api/transactions")
        .query({
          sort: "date_asc",
        })
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);

      expect(
        response.body.data.map(
          (transaction: { amount: string }) =>
            transaction.amount,
        ),
      ).toEqual(["100", "200", "300"]);
    });

    it("should sort transactions by date descending", async () => {
      const account = await createAccount("Main Bank");

      const category = await createCategory(
        "Food",
        "EXPENSE",
      );

      await createTransaction({
        type: "EXPENSE",
        amount: 300,
        date: "2026-09-03",
        accountId: account.id,
        categoryId: category.id,
      });

      await createTransaction({
        type: "EXPENSE",
        amount: 100,
        date: "2026-09-01",
        accountId: account.id,
        categoryId: category.id,
      });

      await createTransaction({
        type: "EXPENSE",
        amount: 200,
        date: "2026-09-02",
        accountId: account.id,
        categoryId: category.id,
      });

      const response = await request(app)
        .get("/api/transactions")
        .query({
          sort: "date_desc",
        })
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);

      expect(
        response.body.data.map(
          (transaction: { amount: string }) =>
            transaction.amount,
        ),
      ).toEqual(["300", "200", "100"]);
    });

    it("should sort transactions by amount ascending", async () => {
      const account = await createAccount("Main Bank");

      const category = await createCategory(
        "Food",
        "EXPENSE",
      );

      await createTransaction({
        type: "EXPENSE",
        amount: 300,
        date: "2026-09-01",
        accountId: account.id,
        categoryId: category.id,
      });

      await createTransaction({
        type: "EXPENSE",
        amount: 100,
        date: "2026-09-02",
        accountId: account.id,
        categoryId: category.id,
      });

      await createTransaction({
        type: "EXPENSE",
        amount: 200,
        date: "2026-09-03",
        accountId: account.id,
        categoryId: category.id,
      });

      const response = await request(app)
        .get("/api/transactions")
        .query({
          sort: "amount_asc",
        })
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);

      expect(
        response.body.data.map(
          (transaction: { amount: string }) =>
            transaction.amount,
        ),
      ).toEqual(["100", "200", "300"]);
    });

    it("should sort transactions by amount descending", async () => {
      const account = await createAccount("Main Bank");

      const category = await createCategory(
        "Food",
        "EXPENSE",
      );

      await createTransaction({
        type: "EXPENSE",
        amount: 300,
        date: "2026-09-01",
        accountId: account.id,
        categoryId: category.id,
      });

      await createTransaction({
        type: "EXPENSE",
        amount: 100,
        date: "2026-09-02",
        accountId: account.id,
        categoryId: category.id,
      });

      await createTransaction({
        type: "EXPENSE",
        amount: 200,
        date: "2026-09-03",
        accountId: account.id,
        categoryId: category.id,
      });

      const response = await request(app)
        .get("/api/transactions")
        .query({
          sort: "amount_desc",
        })
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);

      expect(
        response.body.data.map(
          (transaction: { amount: string }) =>
            transaction.amount,
        ),
      ).toEqual(["300", "200", "100"]);
    });
  });
});
