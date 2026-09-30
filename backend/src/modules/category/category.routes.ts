import { Router } from "express";

import { authMiddleware } from "../auth/auth.middleware.js";

import { validationMiddleware } from "../../middleware/validation.middleware.js";

import {
  createCategorySchema,
  updateCategorySchema,
  categoryIdSchema,
  listCategoryQuerySchema,
} from "./category.schema.js";

import {
  createCategoryController,
  getCategoriesController,
  getCategoryController,
  updateCategoryController,
  deleteCategoryController,
} from "./category.controller.js";

export const categoryRouter = Router();

categoryRouter.post(
  "/",
  authMiddleware,
  validationMiddleware(
    createCategorySchema,
    "body",
  ),
  createCategoryController,
);

categoryRouter.get(
  "/",
  authMiddleware,
  validationMiddleware(
    listCategoryQuerySchema,
    "query",
  ),
  getCategoriesController,
);

categoryRouter.get(
  "/:id",
  authMiddleware,
  validationMiddleware(
    categoryIdSchema,
    "params",
  ),
  getCategoryController,
);

categoryRouter.patch(
  "/:id",
  authMiddleware,
  validationMiddleware(
    categoryIdSchema,
    "params",
  ),
  validationMiddleware(
    updateCategorySchema,
    "body",
  ),
  updateCategoryController,
);

categoryRouter.delete(
  "/:id",
  authMiddleware,
  validationMiddleware(
    categoryIdSchema,
    "params",
  ),
  deleteCategoryController,
);