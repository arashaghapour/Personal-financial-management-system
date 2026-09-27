import type { NextFunction, Request, Response } from "express";

import {
  login,
  refresh,
  register,
  logout,
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

export const logoutController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.id;
    const { refreshToken } = req.body;

    await logout(Number(userId), refreshToken);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};