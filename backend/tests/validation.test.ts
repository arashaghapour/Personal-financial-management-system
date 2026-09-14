import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import {
  bodyTestSchema,
  paramsTestSchema,
  queryTestSchema,
} from "../src/schemas/validation-test.schema.js";
import { validationMiddleware } from "../src/middleware/validation.middleware.js";
import app from "../src/app.js";

describe("validation middleware", () => {
  it("accepts a valid body", async () => {
    const app = express();

    app.use(express.json());

    app.post(
      "/test",
      validationMiddleware(bodyTestSchema, "body"),
      (_req, res) => {
        res.status(200).json({ status: "ok" });
      },
    );

    const response = await request(app)
      .post("/test")
      .send({ name: "arash" });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
  });

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

  it("rejects an invalid body", async () => {
    let controllerCalled = false;

    const app = express();

    app.use(express.json());

    app.post(
      "/test",
      validationMiddleware(bodyTestSchema, "body"),
      (_req, res) => {
        controllerCalled = true;
        res.status(200).json({ status: "ok" });
      },
    );

    const response = await request(app)
      .post("/test")
      .send({ name: 123 });

    expect(response.status).toBe(400);
    expect(controllerCalled).toBe(false);
  });

  it("accepts valid query parameters", async () => {
    const app = express();

    app.get(
      "/test",
      validationMiddleware(queryTestSchema, "query"),
      (_req, res) => {
        res.status(200).json({ status: "ok" });
      },
    );

    const response = await request(app)
      .get("/test")
      .query({ page: "1" });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
  });

  it("rejects invalid query parameters", async () => {
    let controllerCalled = false;

    const app = express();

    app.get(
      "/test",
      validationMiddleware(queryTestSchema, "query"),
      (_req, res) => {
        controllerCalled = true;
        res.status(200).json({ status: "ok" });
      },
    );

    const response = await request(app)
      .get("/test")
      .query({ page: "abc" });

    expect(response.status).toBe(400);
    expect(controllerCalled).toBe(false);
  });

  it("accepts valid route parameters", async () => {
    const app = express();

    app.get(
      "/test/:id",
      validationMiddleware(paramsTestSchema, "params"),
      (_req, res) => {
        res.status(200).json({ status: "ok" });
      },
    );

    const response = await request(app).get("/test/123");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
  });
  
  it("rejects invalid route parameters", async () => {
    let controllerCalled = false;

    const app = express();

    app.get(
      "/test/:id",
      validationMiddleware(paramsTestSchema, "params"),
      (_req, res) => {
        controllerCalled = true;
        res.status(200).json({ status: "ok" });
      },
    );

    const response = await request(app).get("/test/abc");

    expect(response.status).toBe(400);
    expect(controllerCalled).toBe(false);
  });
  
});
