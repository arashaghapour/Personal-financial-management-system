import type { Request, Response } from "express";
import { register } from "./auth.service.js";

export const registerController = async (
  req: Request,
  res: Response,
) => {
  const result = await register(req.body);

  res.status(201).json(result);
};