import { z } from "zod";

export const transactionIdSchema = z.object({
  id: z.string().uuid(),
});

export const createTransactionSchema = z
  .object({
    type: z.enum(["INCOME", "EXPENSE"]),

    accountId: z
      .number()
      .int()
      .positive(),

    categoryId: z.string().uuid(),

    amount: z
      .number()
      .positive(),

    description: z
      .string()
      .trim()
      .max(500)
      .optional(),

    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, {
        message: "Date must be in YYYY-MM-DD format",
      }),
  })
  .strict();

export type CreateTransactionInput = z.infer<
  typeof createTransactionSchema
>;

export const updateTransactionSchema = z
  .object({
    amount: z
      .number()
      .positive()
      .optional(),

    description: z
      .string()
      .trim()
      .max(500)
      .nullable()
      .optional(),

    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, {
        message: "Date must be in YYYY-MM-DD format",
      })
      .optional(),

    accountId: z
      .number()
      .int()
      .positive()
      .optional(),

    categoryId: z
      .string()
      .uuid()
      .optional(),
  })
  .strict()
  .refine(
    (data) =>
      data.amount !== undefined ||
      data.description !== undefined ||
      data.date !== undefined ||
      data.accountId !== undefined ||
      data.categoryId !== undefined,
    {
      message: "At least one field must be provided",
    },
  );

export type UpdateTransactionInput = z.infer<
  typeof updateTransactionSchema
>;

export const listTransactionQuerySchema = z
  .object({
    type: z
      .enum(["INCOME", "EXPENSE"])
      .optional(),

    accountId: z
      .coerce
      .number()
      .int()
      .positive()
      .optional(),

    categoryId: z
      .string()
      .uuid()
      .optional(),

    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, {
        message: "Start date must be in YYYY-MM-DD format",
      })
      .optional(),

    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, {
        message: "End date must be in YYYY-MM-DD format",
      })
      .optional(),

    minAmount: z
      .coerce
      .number()
      .positive()
      .optional(),

    maxAmount: z
      .coerce
      .number()
      .positive()
      .optional(),

    page: z
      .coerce
      .number()
      .int()
      .positive()
      .default(1),

    limit: z
      .coerce
      .number()
      .int()
      .positive()
      .max(100)
      .default(20),

    sort: z
      .enum([
        "date_asc",
        "date_desc",
        "amount_asc",
        "amount_desc",
        "createdAt_asc",
        "createdAt_desc",
      ])
      .default("date_desc"),
  })
  .strict()
  .refine(
    (data) =>
      data.minAmount === undefined ||
      data.maxAmount === undefined ||
      data.minAmount <= data.maxAmount,
    {
      message:
        "minAmount must be less than or equal to maxAmount",
      path: ["minAmount"],
    },
  )
  .refine(
    (data) =>
      data.startDate === undefined ||
      data.endDate === undefined ||
      data.startDate <= data.endDate,
    {
      message:
        "startDate must be less than or equal to endDate",
      path: ["startDate"],
    },
  );

export type ListTransactionQuery = z.infer<
  typeof listTransactionQuerySchema
>;