import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../../src/app.js";

describe("POST /api/auth/register validation", () => {
  it("should return 400 when email is missing", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        password: "password123",
        firstName: "Arash",
        lastName: "Aghapour",
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("should return 400 when email is invalid", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        email: "invalid-email",
        password: "password123",
        firstName: "Arash",
        lastName: "Aghapour",
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("should return 400 when password is missing", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        email: "user@example.com",
        firstName: "Arash",
        lastName: "Aghapour",
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("should return 400 when password is too short", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        email: "user@example.com",
        password: "1234567",
        firstName: "Arash",
        lastName: "Aghapour",
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });
});