import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../../../src/app.js";

describe("Reports API - Security", () => {
  describe("Authentication", () => {
    it("should reject summary without authentication", async () => {
      await request(app)
        .get("/api/reports/summary")
        .expect(401);
    });

    it("should reject expenses without authentication", async () => {
      await request(app)
        .get("/api/reports/expenses")
        .expect(401);
    });

    it("should reject cash flow without authentication", async () => {
      await request(app)
        .get("/api/reports/cash-flow")
        .expect(401);
    });
  });

  describe("Invalid Token", () => {
    it("should reject summary with an invalid token", async () => {
      await request(app)
        .get("/api/reports/summary")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);
    });

    it("should reject expenses with an invalid token", async () => {
      await request(app)
        .get("/api/reports/expenses")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);
    });

    it("should reject cash flow with an invalid token", async () => {
      await request(app)
        .get("/api/reports/cash-flow")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);
    });
  });

  describe("Tampered Token", () => {
    it("should reject summary with a tampered token", async () => {
      const user = {
        email: "reports-security-tampered-summary@example.com",
        password: "Password123!",
        firstName: "Security",
        lastName: "Test",
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
      const tamperedToken = `${token.slice(0, -1)}x`;

      await request(app)
        .get("/api/reports/summary")
        .set(
          "Authorization",
          `Bearer ${tamperedToken}`,
        )
        .expect(401);
    });

    it("should reject expenses with a tampered token", async () => {
      const user = {
        email: "reports-security-tampered-expenses@example.com",
        password: "Password123!",
        firstName: "Security",
        lastName: "Test",
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
      const tamperedToken = `${token.slice(0, -1)}x`;

      await request(app)
        .get("/api/reports/expenses")
        .set(
          "Authorization",
          `Bearer ${tamperedToken}`,
        )
        .expect(401);
    });

    it("should reject cash flow with a tampered token", async () => {
      const user = {
        email: "reports-security-tampered-cash-flow@example.com",
        password: "Password123!",
        firstName: "Security",
        lastName: "Test",
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
      const tamperedToken = `${token.slice(0, -1)}x`;

      await request(app)
        .get("/api/reports/cash-flow")
        .set(
          "Authorization",
          `Bearer ${tamperedToken}`,
        )
        .expect(401);
    });
  });

  describe("Valid Token", () => {
    it("should allow summary with a valid token", async () => {
      const user = {
        email: "reports-security-valid-summary@example.com",
        password: "Password123!",
        firstName: "Security",
        lastName: "Test",
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

      await request(app)
        .get("/api/reports/summary")
        .set(
          "Authorization",
          `Bearer ${loginResponse.body.accessToken}`,
        )
        .expect(200)
        .expect({
          totalIncome: "0",
          totalExpenses: "0",
          netCashFlow: "0",
          transactionCount: 0,
          incomeTransactionCount: 0,
          expenseTransactionCount: 0,
        });
    });

    it("should allow expenses with a valid token", async () => {
      const user = {
        email: "reports-security-valid-expenses@example.com",
        password: "Password123!",
        firstName: "Security",
        lastName: "Test",
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

      await request(app)
        .get("/api/reports/expenses")
        .set(
          "Authorization",
          `Bearer ${loginResponse.body.accessToken}`,
        )
        .expect(200)
        .expect({
          totalExpenses: "0",
          categories: [],
        });
    });

    it("should allow cash flow with a valid token", async () => {
      const user = {
        email: "reports-security-valid-cash-flow@example.com",
        password: "Password123!",
        firstName: "Security",
        lastName: "Test",
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

      await request(app)
        .get("/api/reports/cash-flow")
        .set(
          "Authorization",
          `Bearer ${loginResponse.body.accessToken}`,
        )
        .expect(200)
        .expect({
          startDate: "",
          endDate: "",
          data: [],
        });
    });
  });

  describe("Query Validation", () => {
    it("should reject userId on summary", async () => {
      const user = {
        email: "reports-security-query-summary@example.com",
        password: "Password123!",
        firstName: "Security",
        lastName: "Test",
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

      await request(app)
        .get("/api/reports/summary")
        .query({ userId: 1 })
        .set(
          "Authorization",
          `Bearer ${loginResponse.body.accessToken}`,
        )
        .expect(400);
    });

    it("should reject userId on expenses", async () => {
      const user = {
        email: "reports-security-query-expenses@example.com",
        password: "Password123!",
        firstName: "Security",
        lastName: "Test",
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

      await request(app)
        .get("/api/reports/expenses")
        .query({ userId: 1 })
        .set(
          "Authorization",
          `Bearer ${loginResponse.body.accessToken}`,
        )
        .expect(400);
    });

    it("should reject userId on cash flow", async () => {
      const user = {
        email: "reports-security-query-cash-flow@example.com",
        password: "Password123!",
        firstName: "Security",
        lastName: "Test",
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

      await request(app)
        .get("/api/reports/cash-flow")
        .query({ userId: 1 })
        .set(
          "Authorization",
          `Bearer ${loginResponse.body.accessToken}`,
        )
        .expect(400);
    });
  });

  describe("Category Ownership", () => {
    it("should reject a foreign category on expenses", async () => {
      const userA = {
        email: "reports-security-category-user-a@example.com",
        password: "Password123!",
        firstName: "User",
        lastName: "A",
      };

      const userB = {
        email: "reports-security-category-user-b@example.com",
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

      const categoryB = await request(app)
        .post("/api/categories")
        .set(
          "Authorization",
          `Bearer ${loginB.body.accessToken}`,
        )
        .send({
          name: "User B Food",
          type: "EXPENSE",
        })
        .expect(201);

      const response = await request(app)
        .get("/api/reports/expenses")
        .query({
          categoryId: categoryB.body.id,
        })
        .set(
          "Authorization",
          `Bearer ${loginA.body.accessToken}`,
        )
        .expect(404);

      expect(response.body).toEqual({
        error: {
          code: "NOT_FOUND",
          message: "Category not found",
        },
      });
    });
  });
});