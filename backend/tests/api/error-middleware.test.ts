import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { errorCodes } from "../../src/constants/error-codes.js";
import { errorMiddleware } from "../../src/middleware/error.middleware.js";
import { AppError } from "../../src/utils/app-error.js";

describe("error middleware", () => {
  it("returns an AppError using the standard error response", async () => {
    const app = express();

    app.get("/test", () => {
      throw new AppError(
        404,
        errorCodes.NOT_FOUND,
        "Resource not found",
      );
    });

    app.use(errorMiddleware);

    const response = await request(app).get("/test");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: {
        code: "NOT_FOUND",
        message: "Resource not found",
      },
    });
  });

  it("returns details when an AppError contains details", async () => {
    const app = express();

    app.get("/test", () => {
      throw new AppError(
        400,
        errorCodes.VALIDATION_ERROR,
        "Request validation failed",
        {
          field: "email",
          reason: "invalid email",
        },
      );
    });

    app.use(errorMiddleware);

    const response = await request(app).get("/test");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        details: {
          field: "email",
          reason: "invalid email",
        },
      },
    });
  });

  it("sanitizes unknown errors", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const app = express();

    app.get("/test", () => {
      throw new Error("database password: secret");
    });

    app.use(errorMiddleware);

    const response = await request(app).get("/test");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: {
        code: errorCodes.INTERNAL_SERVER_ERROR,
        message: "Internal server error",
      },
    });

    expect(JSON.stringify(response.body)).not.toContain("database password");
    expect(JSON.stringify(response.body)).not.toContain("secret");

    expect(consoleError).toHaveBeenCalled();

    consoleError.mockRestore();
  });




    it("returns a not found error for an unknown route", async () => {
    const app = express();

    app.get("/test", (_req, res) => {
        res.status(200).json({ status: "ok" });
    });

    app.use((_req, _res, next) => {
        next(
        new AppError(
            404,
            errorCodes.NOT_FOUND,
            "Resource not found",
        ),
        );
    });

    app.use(errorMiddleware);

    const response = await request(app).get("/does-not-exist");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
        error: {
        code: "NOT_FOUND",
        message: "Resource not found",
        },
    });
    });

});
