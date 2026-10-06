import { Router } from "express";

import { authMiddleware } from "../auth/auth.middleware.js";
import { validationMiddleware } from "../../middleware/validation.middleware.js";
import { dashboardQuerySchema } from "./dashboard.validation.js";
import { dashboardController } from "./dashboard.controller.js";

export const dashboardRouter = Router();

dashboardRouter.get(
  "/",
  authMiddleware,
  validationMiddleware(dashboardQuerySchema, "query"),
  dashboardController,
);