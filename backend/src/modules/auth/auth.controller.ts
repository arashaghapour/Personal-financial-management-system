import type { Request, Response } from "express";

import {
  login,
  refresh,
  register,
} from "./auth.service.js";

import type {
  LoginRequest,
  RefreshRequest,
  RegisterRequest,
} from "./auth.types.js";

export const registerController = async (
  req: Request,
  res: Response,
) => {
  const result = await register(req.body as RegisterRequest);

  return res.status(201).json(result);
};

export const loginController = async (
  req: Request,
  res: Response,
) => {
  const result = await login(req.body as LoginRequest);

  return res.status(200).json(result);
};

export const refreshController = async (
  req: Request,
  res: Response,
) => {
  const result = await refresh(req.body as RefreshRequest);

  return res.status(200).json(result);
};