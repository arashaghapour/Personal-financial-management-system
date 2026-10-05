import type { NextFunction, Request, Response } from "express";

import { getDashboard } from "./dashboard.service.js";

export const dashboardController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.id;
    const query = res.locals.query;

    const dashboard = await getDashboard(userId, query);

    res.status(200).json(dashboard);
  } catch (error) {
    next(error);
  }
};