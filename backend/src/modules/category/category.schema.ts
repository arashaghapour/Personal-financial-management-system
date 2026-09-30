import { z } from "zod";

export const categoryIdSchema = z.object({
  id: z.string().uuid(),
});

export const createCategorySchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    type: z.enum(["INCOME", "EXPENSE"]),
  })
  .strict();

export const updateCategorySchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    type: z
      .enum(["INCOME", "EXPENSE"])
      .optional(),
  })
  .strict()
  .refine(
    (data) =>
      data.name !== undefined ||
      data.type !== undefined,
    {
      message: "At least one field must be provided",
    },
  );

export const listCategoryQuerySchema = z
  .object({
    type: z
      .enum(["INCOME", "EXPENSE"])
      .optional(),
  })
  .strict();

export type CreateCategoryInput = z.infer<
  typeof createCategorySchema
>;

export type UpdateCategoryInput = z.infer<
  typeof updateCategorySchema
>;

export type ListCategoryQuery = z.infer<
  typeof listCategoryQuerySchema
>;