import { Router } from "express";

import { authMiddleware } from "../auth/auth.middleware.js";
import { validationMiddleware } from "../../middleware/validation.middleware.js";

import {
  getCashFlowReportController,
  getExpensesReportController,
  getSummaryController,
} from "./reports.controller.js";

import {
  cashFlowQuerySchema,
  expensesQuerySchema,
  summaryQuerySchema,
} from "../reports/reports.validation.js";

const reportRouter = Router();

reportRouter.get(
  "/summary",
  authMiddleware,
  validationMiddleware(summaryQuerySchema, "query"),
  getSummaryController,
);

reportRouter.get(
  "/expenses",
  authMiddleware,
  validationMiddleware(expensesQuerySchema, "query"),
  getExpensesReportController,
);

reportRouter.get(
  "/cash-flow",
  authMiddleware,
  validationMiddleware(cashFlowQuerySchema, "query"),
  getCashFlowReportController,
);

export default reportRouter;