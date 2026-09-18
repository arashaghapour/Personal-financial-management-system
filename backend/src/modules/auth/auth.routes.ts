import { Router } from "express";

import {
  loginController,
  registerController,
} from "./auth.controller.js";

import {
  loginSchema,
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

export default authRouter;