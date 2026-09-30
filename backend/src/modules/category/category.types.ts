import type { z } from "zod";

import {
  createCategorySchema,
  updateCategorySchema,
} from "./category.schema.js";

import type { CategoryType } from "../../generated/prisma/client.js";

export type CreateCategoryRequest = z.infer<
  typeof createCategorySchema
>;

export type UpdateCategoryRequest = z.infer<
  typeof updateCategorySchema
>;

export type CategoryListQuery = {
  type?: CategoryType;
};