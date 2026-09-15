import { describe, expect, it } from "vitest";
import { errorCodes } from "../../src/constants/error-codes.js";
import { AppError } from "../../src/utils/app-error.js";

describe("AppError", () => {
  it("creates an application error", () => {
    const error = new AppError(
      404,
      errorCodes.NOT_FOUND,
      "Resource not found",
    );

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe(errorCodes.NOT_FOUND);
    expect(error.message).toBe("Resource not found");
    expect(error.details).toBeUndefined();
  });

  it("supports error details", () => {
    const details = {
      field: "email",
      reason: "invalid email",
    };

    const error = new AppError(
      400,
      errorCodes.VALIDATION_ERROR,
      "Request validation failed",
      details,
    );

    expect(error.statusCode).toBe(400);
    expect(error.code).toBe(errorCodes.VALIDATION_ERROR);
    expect(error.message).toBe("Request validation failed");
    expect(error.details).toEqual(details);
  });
});
