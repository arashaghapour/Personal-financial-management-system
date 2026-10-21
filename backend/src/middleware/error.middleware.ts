import type { ErrorRequestHandler } from "express";
import { Prisma } from "../generated/prisma/client.js";
import { errorCodes } from "../constants/error-codes.js";
import { AppError } from "../utils/app-error.js";

export const errorMiddleware: ErrorRequestHandler = (
  error,
  _req,
  res,
  next,
) => {
  void next;

  
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        ...(error.details !== undefined && {
          details: error.details,
        }),
      },
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return res.status(409).json({
        error: {
          code: errorCodes.CONFLICT,
          message: "Resource already exists",
        },
      });
    }

    if (error.code === "P2003") {
      return res.status(409).json({
        error: {
          code: errorCodes.CONFLICT,
          message: "Resource is still in use",
        },
      });
    }
  }

  console.error(error);

  return res.status(500).json({
    error: {
      code: errorCodes.INTERNAL_SERVER_ERROR,
      message: "Internal server error",
    },
  });
};