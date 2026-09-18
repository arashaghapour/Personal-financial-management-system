import { Router } from "express";

import {
  loginController,
  refreshController,
  registerController,
} from "./auth.controller.js";

import {
  loginSchema,
  refreshSchema,
  registerSchema,
} from "./auth.schemas.js";

import { validationMiddleware } from "../../middleware/validation.middleware.js";

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

export default authRouter;