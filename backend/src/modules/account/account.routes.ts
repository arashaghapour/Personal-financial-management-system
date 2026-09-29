import { Router } from "express";

import { authMiddleware } from "../auth/auth.middleware.js";

import { validationMiddleware } from "../../middleware/validation.middleware.js";

import {
  accountIdSchema,
  createAccountSchema,
  updateAccountSchema,
} from "./account.schema.js";

import {
  createAccountController,
  deleteAccountController,
  getAccountController,
  getAccountsController,
  updateAccountController,
} from "./account.controller.js";

export const accountRouter = Router();

accountRouter.get("/", authMiddleware, getAccountsController);

accountRouter.post(
  "/",
  authMiddleware,
  validationMiddleware(createAccountSchema, "body"),
  createAccountController,
);

accountRouter.get(
  "/:id",
  authMiddleware,
  validationMiddleware(accountIdSchema, "params"),
  getAccountController,
);

accountRouter.patch(
  "/:id",
  authMiddleware,
  validationMiddleware(accountIdSchema, "params"),
  validationMiddleware(updateAccountSchema, "body"),
  updateAccountController,
);

accountRouter.delete(
  "/:id",
  authMiddleware,
  validationMiddleware(accountIdSchema, "params"),
  deleteAccountController,
);
