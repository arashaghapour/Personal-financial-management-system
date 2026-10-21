import { z } from "zod";

import { CATEGORY_TYPES } from "../types";

export const categoryTypeSchema = z.enum(CATEGORY_TYPES);

/**
 * Shared category form schema. The backend trims names before checking
 * uniqueness and enforces the same 1-100 character length.
 */
export const categoryFormSchema = z.object({
  name: z
    .string({ error: "Category name is required" })
    .trim()
    .min(1, "Category name is required")
    .max(100, "Category name must be 100 characters or fewer"),
  type: categoryTypeSchema,
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
