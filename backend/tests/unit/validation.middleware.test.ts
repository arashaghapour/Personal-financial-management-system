import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../../src/app.js";

describe("validation middleware", () => {

  it("returns a sanitized response for an unknown error", async () => {
    const response = await request(app).get(
      "/api/validation-test/unknown-error",
    );

    expect(response.status).toBe(500);

    expect(response.body).toEqual({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error",
      },
    });

    expect(JSON.stringify(response.body)).not.toContain(
      "database password",
    );

    expect(JSON.stringify(response.body)).not.toContain("secret");
  });

  it("returns a standard 404 response for an unknown route", async () => {
    const response = await request(app).get("/api/does-not-exist");

    expect(response.status).toBe(404);

    expect(response.body).toEqual({
      error: {
        code: "NOT_FOUND",
        message: "Resource not found",
      },
    });
  });

  it("returns an AppError with the correct status and error code", async () => {
    const response = await request(app).get(
      "/api/validation-test/app-error",
    );

    expect(response.status).toBe(409);

    expect(response.body).toEqual({
      error: {
        code: "CONFLICT",
        message: "Resource already exists",
      },
    });
  });

  it("accepts a valid body", async () => {
    const response = await request(app)
      .post("/api/validation-test/body")
      .send({ name: "arash" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "ok",
    });
  });


  it("rejects an invalid body", async () => {
    const response = await request(app)
      .post("/api/validation-test/body")
      .send({ name: 123 });

    expect(response.status).toBe(400);

    expect(response.body).toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        details: expect.any(Array),
      },
    });
  });


  it("accepts valid query parameters", async () => {
    const response = await request(app)
      .get("/api/validation-test/query")
      .query({ page: "1" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "ok",
    });
  });

  it("rejects invalid query parameters", async () => {
    const response = await request(app)
      .get("/api/validation-test/query")
      .query({ page: "abc" });

    expect(response.status).toBe(400);

    expect(response.body).toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        details: expect.any(Array),
      },
    });
  });

  it("accepts valid route parameters", async () => {
    const response = await request(app)
      .get("/api/validation-test/params/123");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "ok",
    });
  });

  it("rejects invalid route parameters", async () => {
    const response = await request(app)
      .get("/api/validation-test/params/abc");

    expect(response.status).toBe(400);

    expect(response.body).toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        details: expect.any(Array),
      },
    });
  });

  
});
