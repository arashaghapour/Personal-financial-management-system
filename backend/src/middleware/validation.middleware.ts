import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/app-error.js";
import { errorCodes } from "../constants/error-codes.js";
import type { ZodType } from "zod";


type validationSource = "body" | "query" | "params";

export const validationMiddleware = (
  schema: ZodType,
  source: validationSource,
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
        next(
    new AppError(
      400,
      errorCodes.VALIDATION_ERROR,
      "Request validation failed",
      result.error.issues,
    ),
  );
    }

    next();
  };
};