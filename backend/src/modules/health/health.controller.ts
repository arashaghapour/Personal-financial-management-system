import type { Request, Response } from "express";
import { getHealth } from "./health.service.js";

export const healthController = (_req: Request, res: Response) => {
  const health = getHealth();

  res.status(200).json(health);
};