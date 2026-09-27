import { Router } from "express";

import {
  loginController,
  refreshController,
  registerController,
  logoutController,
} from "./auth.controller.js";

import {
  loginSchema,
  refreshSchema,
  registerSchema,
  logoutSchema,
} from "./auth.schemas.js";

import { validationMiddleware } from "../../middleware/validation.middleware.js";

import { authMiddleware } from "./auth.middleware.js";

const authRouter = Router();

authRouter.post(
  "/register",
  validationMiddleware(registerSchema, "body"),
  registerController,
);

authRouter.post(
  "/login",
  validationMiddleware(loginSchema, "body"),
  loginController,
);

authRouter.post(
  "/refresh",
  validationMiddleware(refreshSchema, "body"),
  refreshController,
);

authRouter.post(
  "/logout",
  authMiddleware,
  validationMiddleware(logoutSchema, "body"),
  logoutController,
);

export default authRouter;