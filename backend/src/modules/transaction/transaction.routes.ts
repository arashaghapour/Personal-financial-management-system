import { Router } from "express";

import {
  createTransactionController,
  deleteTransactionController,
  getTransactionController,
  getTransactionsController,
  updateTransactionController,
} from "./transaction.controller.js";

import {
  createTransactionSchema,
  listTransactionQuerySchema,
  transactionIdSchema,
  updateTransactionSchema,
} from "./transaction.schema.js";

import { authMiddleware } from "../auth/auth.middleware.js";
import { validationMiddleware } from "../../middleware/validation.middleware.js";

const router = Router();

router.use(authMiddleware);

router.get(
  "/",
  validationMiddleware(listTransactionQuerySchema, "query"),
  getTransactionsController,
);

router.post(
  "/",
  validationMiddleware(createTransactionSchema, "body"),
  createTransactionController,
);

router.get(
  "/:id",
  validationMiddleware(transactionIdSchema, "params"),
  getTransactionController,
);

router.patch(
  "/:id",
  validationMiddleware(transactionIdSchema, "params"),
  validationMiddleware(updateTransactionSchema, "body"),
  updateTransactionController,
);

router.delete(
  "/:id",
  validationMiddleware(transactionIdSchema, "params"),
  deleteTransactionController,
);

export default router;