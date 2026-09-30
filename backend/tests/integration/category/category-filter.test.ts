import { describe, expect, it } from "vitest";

import request from "supertest";

import app from "../../../src/app.js";

describe("GET /api/categories?type=", () => {
  it("should return only expense categories when type is EXPENSE", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        email: "category-filter-expense@example.com",
        password: "password123",
        firstName: "Arash",
        lastName: "Aghapour",
      });

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: "category-filter-expense@example.com",
        password: "password123",
      });

    expect(loginResponse.status).toBe(200);

    const accessToken =
      loginResponse.body.accessToken;

    const foodResponse = await request(app)
      .post("/api/categories")
      .set(
        "Authorization",
        `Bearer ${accessToken}`,
      )
      .send({
        name: "Food",
        type: "EXPENSE",
      });

    expect(foodResponse.status).toBe(201);

    const transportResponse = await request(app)
      .post("/api/categories")
      .set(
        "Authorization",
        `Bearer ${accessToken}`,
      )
      .send({
        name: "Transport",
        type: "EXPENSE",
      });

    expect(transportResponse.status).toBe(201);

    const salaryResponse = await request(app)
      .post("/api/categories")
      .set(
        "Authorization",
        `Bearer ${accessToken}`,
      )
      .send({
        name: "Salary",
        type: "INCOME",
      });

    expect(salaryResponse.status).toBe(201);

    const response = await request(app)
      .get("/api/categories")
      .query({
        type: "EXPENSE",
      })
      .set(
        "Authorization",
        `Bearer ${accessToken}`,
      );

    expect(response.status).toBe(200);

    expect(response.body).toHaveLength(2);

    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Food",
          type: "EXPENSE",
        }),
        expect.objectContaining({
          name: "Transport",
          type: "EXPENSE",
        }),
      ]),
    );

    expect(
      response.body.some(
        (category: { name: string }) =>
          category.name === "Salary",
      ),
    ).toBe(false);
  });

  it("should return only income categories when type is INCOME", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        email: "category-filter-income@example.com",
        password: "password123",
        firstName: "Arash",
        lastName: "Aghapour",
      });

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: "category-filter-income@example.com",
        password: "password123",
      });

    expect(loginResponse.status).toBe(200);

    const accessToken =
      loginResponse.body.accessToken;

    const foodResponse = await request(app)
      .post("/api/categories")
      .set(
        "Authorization",
        `Bearer ${accessToken}`,
      )
      .send({
        name: "Food",
        type: "EXPENSE",
      });

    expect(foodResponse.status).toBe(201);

    const transportResponse = await request(app)
      .post("/api/categories")
      .set(
        "Authorization",
        `Bearer ${accessToken}`,
      )
      .send({
        name: "Transport",
        type: "EXPENSE",
      });

    expect(transportResponse.status).toBe(201);

    const salaryResponse = await request(app)
      .post("/api/categories")
      .set(
        "Authorization",
        `Bearer ${accessToken}`,
      )
      .send({
        name: "Salary",
        type: "INCOME",
      });

    expect(salaryResponse.status).toBe(201);

    const response = await request(app)
      .get("/api/categories")
      .query({
        type: "INCOME",
      })
      .set(
        "Authorization",
        `Bearer ${accessToken}`,
      );

    expect(response.status).toBe(200);

    expect(response.body).toHaveLength(1);

    expect(response.body[0]).toMatchObject({
      name: "Salary",
      type: "INCOME",
    });

    expect(
      response.body.some(
        (category: { name: string }) =>
          category.name === "Food",
      ),
    ).toBe(false);

    expect(
      response.body.some(
        (category: { name: string }) =>
          category.name === "Transport",
      ),
    ).toBe(false);
  });
});