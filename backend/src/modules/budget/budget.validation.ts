import { z } from "zod";

export const budgetIdSchema = z.object({
  id: z.string().uuid(),
});

export const createBudgetSchema = z
  .object({
    categoryId: z.string().uuid(),
    amount: z.number().positive(),
    year: z.number().int().positive(),
    month: z.number().int().min(1).max(12),
  })
  .strict();

export const updateBudgetSchema = z
  .object({
    amount: z.number().positive(),
  })
  .strict();

export const listBudgetQuerySchema = z
  .object({
    year: z.coerce.number().int().positive().optional(),
    month: z.coerce.number().int().min(1).max(12).optional(),
    categoryId: z.string().uuid().optional(),
  })
  .strict();

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
export type ListBudgetQuery = z.infer<typeof listBudgetQuerySchema>;