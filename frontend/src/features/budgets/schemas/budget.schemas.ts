import { z } from "zod";

const amountField = z
  .number({ error: "Budget amount is required" })
  .finite("Enter a valid amount")
  .positive("Amount must be greater than 0");

const yearField = z
  .number({ error: "Enter a valid year" })
  .int("Enter a valid year")
  .min(1, "Enter a valid year");

const monthField = z
  .number({ error: "Select a valid month" })
  .int("Select a valid month")
  .min(1, "Select a valid month")
  .max(12, "Select a valid month");

/**
 * Create form schema mirrors POST /api/budgets. The backend rejects unknown
 * fields, and `userId` is always derived from the authenticated session.
 */
export const createBudgetSchema = z
  .object({
    categoryId: z
      .string({ error: "Select a category" })
      .min(1, "Select a category")
      .uuid("Select a category"),
    amount: amountField,
    year: yearField,
    month: monthField,
  })
  .strict();

export type CreateBudgetFormValues = z.infer<typeof createBudgetSchema>;

/**
 * PATCH /api/budgets/:id only supports changing the amount. Category and
 * period are immutable, so they are excluded from the form and request body.
 */
export const updateBudgetSchema = z
  .object({
    amount: amountField,
  })
  .strict();

export type UpdateBudgetFormValues = z.infer<typeof updateBudgetSchema>;
