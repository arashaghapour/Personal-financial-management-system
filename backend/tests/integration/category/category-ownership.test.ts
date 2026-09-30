import { describe, expect, it } from "vitest";

import request from "supertest";

import app from "../../../src/app.js";

describe("Category ownership", () => {
  it("should allow each user to see only their own categories", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        email: "category-owner-a@example.com",
        password: "password123",
        firstName: "User",
        lastName: "A",
      });

    await request(app)
      .post("/api/auth/register")
      .send({
        email: "category-owner-b@example.com",
        password: "password123",
        firstName: "User",
        lastName: "B",
      });

    const loginAResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: "category-owner-a@example.com",
        password: "password123",
      });

    expect(loginAResponse.status).toBe(200);

    const tokenA = loginAResponse.body.accessToken;

    const loginBResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: "category-owner-b@example.com",
        password: "password123",
      });

    expect(loginBResponse.status).toBe(200);

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
        name: "Salary",
        type: "INCOME",
      });

    expect(categoryBResponse.status).toBe(201);

    const listAResponse = await request(app)
      .get("/api/categories")
      .set("Authorization", `Bearer ${tokenA}`);

    expect(listAResponse.status).toBe(200);

    expect(listAResponse.body).toHaveLength(1);
    expect(listAResponse.body[0]).toMatchObject({
      name: "Food",
      type: "EXPENSE",
    });

    const listBResponse = await request(app)
      .get("/api/categories")
      .set("Authorization", `Bearer ${tokenB}`);

    expect(listBResponse.status).toBe(200);

    expect(listBResponse.body).toHaveLength(1);
    expect(listBResponse.body[0]).toMatchObject({
      name: "Salary",
      type: "INCOME",
    });
  });

  it("should return 404 when a user tries to get another user's category", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        email: "category-get-a@example.com",
        password: "password123",
        firstName: "User",
        lastName: "A",
      });

    await request(app)
      .post("/api/auth/register")
      .send({
        email: "category-get-b@example.com",
        password: "password123",
        firstName: "User",
        lastName: "B",
      });

    const loginAResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: "category-get-a@example.com",
        password: "password123",
      });

    const loginBResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: "category-get-b@example.com",
        password: "password123",
      });

    const tokenA = loginAResponse.body.accessToken;
    const tokenB = loginBResponse.body.accessToken;

    const categoryResponse = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${tokenB}`)
      .send({
        name: "Food",
        type: "EXPENSE",
      });

    expect(categoryResponse.status).toBe(201);

    const categoryId = categoryResponse.body.id;

    const response = await request(app)
      .get(`/api/categories/${categoryId}`)
      .set("Authorization", `Bearer ${tokenA}`);

    expect(response.status).toBe(404);

    expect(response.body).toEqual({
      error: {
        code: "CATEGORY_NOT_FOUND",
        message: "Category not found",
      },
    });
  });

  it("should return 404 when a user tries to update another user's category", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        email: "category-update-a@example.com",
        password: "password123",
        firstName: "User",
        lastName: "A",
      });

    await request(app)
      .post("/api/auth/register")
      .send({
        email: "category-update-b@example.com",
        password: "password123",
        firstName: "User",
        lastName: "B",
      });

    const loginAResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: "category-update-a@example.com",
        password: "password123",
      });

    const loginBResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: "category-update-b@example.com",
        password: "password123",
      });

    const tokenA = loginAResponse.body.accessToken;
    const tokenB = loginBResponse.body.accessToken;

    const categoryResponse = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${tokenB}`)
      .send({
        name: "Food",
        type: "EXPENSE",
      });

    expect(categoryResponse.status).toBe(201);

    const categoryId = categoryResponse.body.id;

    const response = await request(app)
      .patch(`/api/categories/${categoryId}`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        name: "Transport",
      });

    expect(response.status).toBe(404);

    expect(response.body).toEqual({
      error: {
        code: "CATEGORY_NOT_FOUND",
        message: "Category not found",
      },
    });
  });

  it("should return 404 when a user tries to delete another user's category", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        email: "category-delete-a@example.com",
        password: "password123",
        firstName: "User",
        lastName: "A",
      });

    await request(app)
      .post("/api/auth/register")
      .send({
        email: "category-delete-b@example.com",
        password: "password123",
        firstName: "User",
        lastName: "B",
      });

    const loginAResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: "category-delete-a@example.com",
        password: "password123",
      });

    const loginBResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: "category-delete-b@example.com",
        password: "password123",
      });

    const tokenA = loginAResponse.body.accessToken;
    const tokenB = loginBResponse.body.accessToken;

    const categoryResponse = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${tokenB}`)
      .send({
        name: "Food",
        type: "EXPENSE",
      });

    expect(categoryResponse.status).toBe(201);

    const categoryId = categoryResponse.body.id;

    const response = await request(app)
      .delete(`/api/categories/${categoryId}`)
      .set("Authorization", `Bearer ${tokenA}`);

    expect(response.status).toBe(404);

    expect(response.body).toEqual({
      error: {
        code: "CATEGORY_NOT_FOUND",
        message: "Category not found",
      },
    });

    const ownerGetResponse = await request(app)
      .get(`/api/categories/${categoryId}`)
      .set("Authorization", `Bearer ${tokenB}`);

    expect(ownerGetResponse.status).toBe(200);

    expect(ownerGetResponse.body).toMatchObject({
      name: "Food",
      type: "EXPENSE",
    });
  });
});