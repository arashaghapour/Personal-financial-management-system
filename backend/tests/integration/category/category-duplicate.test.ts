import { describe, expect, it } from "vitest";
import request from "supertest";

import app from "../../../src/app.js";

describe("Category duplicates", () => {
  it("should reject categories with the same normalized name and type", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        email: "duplicate@example.com",
        password: "Password123!",
        firstName: "Test",
        lastName: "User",
      });

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: "duplicate@example.com",
        password: "Password123!",
      });

    expect(loginResponse.status).toBe(200);

    const accessToken = loginResponse.body.accessToken;

    const firstResponse = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Food",
        type: "EXPENSE",
      });

    expect(firstResponse.status).toBe(201);

    const secondResponse = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "food",
        type: "EXPENSE",
      });

    expect(secondResponse.status).toBe(409);

    expect(secondResponse.body).toEqual({
      error: {
        code: "CATEGORY_ALREADY_EXISTS",
        message: "Category already exists",
      },
    });
  });

  it("should allow the same name with a different type", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        email: "different-type@example.com",
        password: "Password123!",
        firstName: "Test",
        lastName: "User",
      });

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: "different-type@example.com",
        password: "Password123!",
      });

    expect(loginResponse.status).toBe(200);

    const accessToken = loginResponse.body.accessToken;

    const expenseResponse = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Food",
        type: "EXPENSE",
      });

    expect(expenseResponse.status).toBe(201);

    const incomeResponse = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Food",
        type: "INCOME",
      });

    expect(incomeResponse.status).toBe(201);

    expect(incomeResponse.body).toEqual(
      expect.objectContaining({
        name: "Food",
        type: "INCOME",
      }),
    );
  });

  it("should reject duplicate categories caused by surrounding whitespace", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        email: "whitespace@example.com",
        password: "Password123!",
        firstName: "Test",
        lastName: "User",
      });

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: "whitespace@example.com",
        password: "Password123!",
      });

    expect(loginResponse.status).toBe(200);

    const accessToken = loginResponse.body.accessToken;

    const firstResponse = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Food",
        type: "EXPENSE",
      });

    expect(firstResponse.status).toBe(201);

    const secondResponse = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "  Food  ",
        type: "EXPENSE",
      });

    expect(secondResponse.status).toBe(409);

    expect(secondResponse.body).toEqual({
      error: {
        code: "CATEGORY_ALREADY_EXISTS",
        message: "Category already exists",
      },
    });
  });

  it("should allow the same category for different users", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        email: "user-a@example.com",
        password: "Password123!",
        firstName: "User",
        lastName: "A",
      });

    await request(app)
      .post("/api/auth/register")
      .send({
        email: "user-b@example.com",
        password: "Password123!",
        firstName: "User",
        lastName: "B",
      });

    const loginAResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: "user-a@example.com",
        password: "Password123!",
      });

    expect(loginAResponse.status).toBe(200);

    const loginBResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: "user-b@example.com",
        password: "Password123!",
      });

    expect(loginBResponse.status).toBe(200);

    const tokenA = loginAResponse.body.accessToken;
    const tokenB = loginBResponse.body.accessToken;

    const categoryAResponse = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        name: "Food",
        type: "EXPENSE",
      });

    expect(categoryAResponse.status).toBe(201);

    const categoryBResponse = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${tokenB}`)
      .send({
        name: "Food",
        type: "EXPENSE",
      });

    expect(categoryBResponse.status).toBe(201);

    expect(categoryBResponse.body).toEqual(
      expect.objectContaining({
        name: "Food",
        type: "EXPENSE",
      }),
    );

    expect(categoryAResponse.body.id).not.toBe(
      categoryBResponse.body.id,
    );
  });
});