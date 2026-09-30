import { describe, expect, it } from "vitest";
import request from "supertest";

import app from "../../../src/app.js";

describe("Category validation", () => {
  it("should reject create category when name is missing", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        email: "validation-name-missing@example.com",
        password: "Password123!",
        firstName: "Test",
        lastName: "User",
      });

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: "validation-name-missing@example.com",
        password: "Password123!",
      });

    expect(loginResponse.status).toBe(200);

    const response = await request(app)
      .post("/api/categories")
      .set(
        "Authorization",
        `Bearer ${loginResponse.body.accessToken}`,
      )
      .send({
        type: "EXPENSE",
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("should reject create category when name is empty", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        email: "validation-name-empty@example.com",
        password: "Password123!",
        firstName: "Test",
        lastName: "User",
      });

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: "validation-name-empty@example.com",
        password: "Password123!",
      });

    expect(loginResponse.status).toBe(200);

    const response = await request(app)
      .post("/api/categories")
      .set(
        "Authorization",
        `Bearer ${loginResponse.body.accessToken}`,
      )
      .send({
        name: "",
        type: "EXPENSE",
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("should reject create category when name contains only whitespace", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        email: "validation-name-whitespace@example.com",
        password: "Password123!",
        firstName: "Test",
        lastName: "User",
      });

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: "validation-name-whitespace@example.com",
        password: "Password123!",
      });

    expect(loginResponse.status).toBe(200);

    const response = await request(app)
      .post("/api/categories")
      .set(
        "Authorization",
        `Bearer ${loginResponse.body.accessToken}`,
      )
      .send({
        name: "   ",
        type: "EXPENSE",
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("should reject create category when name is longer than 100 characters", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        email: "validation-name-length@example.com",
        password: "Password123!",
        firstName: "Test",
        lastName: "User",
      });

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: "validation-name-length@example.com",
        password: "Password123!",
      });

    expect(loginResponse.status).toBe(200);

    const response = await request(app)
      .post("/api/categories")
      .set(
        "Authorization",
        `Bearer ${loginResponse.body.accessToken}`,
      )
      .send({
        name: "a".repeat(101),
        type: "EXPENSE",
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("should reject create category with an invalid type", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        email: "validation-invalid-type@example.com",
        password: "Password123!",
        firstName: "Test",
        lastName: "User",
      });

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: "validation-invalid-type@example.com",
        password: "Password123!",
      });

    expect(loginResponse.status).toBe(200);

    const response = await request(app)
      .post("/api/categories")
      .set(
        "Authorization",
        `Bearer ${loginResponse.body.accessToken}`,
      )
      .send({
        name: "Food",
        type: "TRANSFER",
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("should reject update category with an empty body", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        email: "validation-empty-update@example.com",
        password: "Password123!",
        firstName: "Test",
        lastName: "User",
      });

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: "validation-empty-update@example.com",
        password: "Password123!",
      });

    expect(loginResponse.status).toBe(200);

    const createResponse = await request(app)
      .post("/api/categories")
      .set(
        "Authorization",
        `Bearer ${loginResponse.body.accessToken}`,
      )
      .send({
        name: "Food",
        type: "EXPENSE",
      });

    expect(createResponse.status).toBe(201);

    const response = await request(app)
      .patch(`/api/categories/${createResponse.body.id}`)
      .set(
        "Authorization",
        `Bearer ${loginResponse.body.accessToken}`,
      )
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("should reject categories with an invalid query type", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        email: "validation-query-type@example.com",
        password: "Password123!",
        firstName: "Test",
        lastName: "User",
      });

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: "validation-query-type@example.com",
        password: "Password123!",
      });

    expect(loginResponse.status).toBe(200);

    const response = await request(app)
      .get("/api/categories")
      .query({
        type: "TRANSFER",
      })
      .set(
        "Authorization",
        `Bearer ${loginResponse.body.accessToken}`,
      );

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });
});