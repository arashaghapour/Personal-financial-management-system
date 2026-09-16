import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

import { errorCodes } from "../constants/error-codes.js";
import { AppError } from "../utils/app-error.js";

type validationSource = "body" | "query" | "params";

export const validationMiddleware = (
  schema: ZodType,
  source: validationSource,
) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      return next(
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