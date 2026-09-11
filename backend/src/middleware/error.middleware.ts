import type { Request, Response, NextFunction } from "express";

export const errorMiddleware = (
  err: Error,
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.error(err);

  void next;

  res.status(500).json({
    message: "Internal server error",
  });
};