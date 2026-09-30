import { describe, expect, it } from "vitest";
import request from "supertest";

import app from "../../../src/app.js";
import { prisma } from "../../../src/lib/prisma.js";

describe("Category user ID injection", () => {
  it("should not allow userId in create request body", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        email: "injection-a@example.com",
        password: "Password123!",
        firstName: "User",
        lastName: "A",
      });

    await request(app)
      .post("/api/auth/register")
      .send({
        email: "injection-b@example.com",
        password: "Password123!",
        firstName: "User",
        lastName: "B",
      });

    const loginAResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: "injection-a@example.com",
        password: "Password123!",
      });

    expect(loginAResponse.status).toBe(200);

    const loginBResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: "injection-b@example.com",
        password: "Password123!",
      });

    expect(loginBResponse.status).toBe(200);

    const tokenA = loginAResponse.body.accessToken;

    const response = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        name: "Food",
        type: "EXPENSE",
        userId: "user-b",
      });

    expect(response.status).toBe(400);

    expect(response.body.error.code).toBe("VALIDATION_ERROR");

    const categories = await prisma.category.findMany({
      where: {
        name: "Food",
      },
    });

    expect(categories).toHaveLength(0);
  });

  it("should not allow userId query parameter to control category ownership", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        email: "query-injection-a@example.com",
        password: "Password123!",
        firstName: "User",
        lastName: "A",
      });

    await request(app)
      .post("/api/auth/register")
      .send({
        email: "query-injection-b@example.com",
        password: "Password123!",
        firstName: "User",
        lastName: "B",
      });

    const loginAResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: "query-injection-a@example.com",
        password: "Password123!",
      });

    expect(loginAResponse.status).toBe(200);

    const loginBResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: "query-injection-b@example.com",
        password: "Password123!",
      });

    expect(loginBResponse.status).toBe(200);

    const tokenA = loginAResponse.body.accessToken;
    const tokenB = loginBResponse.body.accessToken;

    const categoryBResponse = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${tokenB}`)
      .send({
        name: "Food",
        type: "EXPENSE",
      });

    expect(categoryBResponse.status).toBe(201);

    const response = await request(app)
      .get("/api/categories")
      .query({
        userId: "user-b",
      })
      .set("Authorization", `Bearer ${tokenA}`);

    expect(response.status).toBe(400);

    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });
});