import type { NextFunction, Request, Response } from "express";

import { errorCodes } from "../constants/error-codes.js";
import { AppError } from "../utils/app-error.js";
import { verifyAccessToken } from "../utils/jwt.js";
import { parseAccessTokenPayload } from "../utils/jwt.js";

export const authMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const authorization = req.headers.authorization;

  if (!authorization) {
    return next(
      new AppError(
        401,
        errorCodes.INVALID_ACCESS_TOKEN,
        "Invalid access token",
      ),
    );
  }

  const parts = authorization.trim().split(/\s+/);

  if (
    parts.length !== 2 ||
    parts[0] !== "Bearer" ||
    !parts[1]
  ) {
    return next(
      new AppError(
        401,
        errorCodes.INVALID_ACCESS_TOKEN,
        "Invalid access token",
      ),
    );
  }

  const token = parts[1];

  try {
    const result = await verifyAccessToken(token);
    const payload = parseAccessTokenPayload(result.payload);

    req.user = {
      id: payload.sub,
    };

    return next();
  } catch {
    return next(
      new AppError(
        401,
        errorCodes.INVALID_ACCESS_TOKEN,
        "Invalid access token",
      ),
    );
  }
};