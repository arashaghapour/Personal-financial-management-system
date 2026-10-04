import { Router } from "express";

import {
  createBudgetController,
  getBudgetsController,
  getBudgetController,
  updateBudgetController,
  deleteBudgetController,
  getBudgetProgressController,
} from "./budget.controller.js";

import {
  budgetIdSchema,
  createBudgetSchema,
  listBudgetQuerySchema,
  updateBudgetSchema,
} from "./budget.validation.js";

import { authMiddleware } from "../auth/auth.middleware.js";
import { validationMiddleware } from "../../middleware/validation.middleware.js";

const router = Router();

router.use(authMiddleware);

router.get(
  "/",
  validationMiddleware(listBudgetQuerySchema, "query"),
  getBudgetsController,
);

router.post(
  "/",
  validationMiddleware(createBudgetSchema, "body"),
  createBudgetController,
);

router.get(
  "/:id/progress",
  validationMiddleware(budgetIdSchema, "params"),
  getBudgetProgressController,
);

router.get(
  "/:id",
  validationMiddleware(budgetIdSchema, "params"),
  getBudgetController,
);

router.patch(
  "/:id",
  validationMiddleware(budgetIdSchema, "params"),
  validationMiddleware(updateBudgetSchema, "body"),
  updateBudgetController,
);

router.delete(
  "/:id",
  validationMiddleware(budgetIdSchema, "params"),
  deleteBudgetController,
);

export default router;
