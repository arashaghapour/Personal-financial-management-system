import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import {
  bodyTestSchema,
  paramsTestSchema,
  queryTestSchema,
} from "../../src/schemas/validation-test.schema.js";
import { validationMiddleware } from "../../src/middleware/validation.middleware.js";

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
