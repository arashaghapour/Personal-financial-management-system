import { z } from "zod";

export const accountIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const createAccountSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1)
      .max(100),

    type: z.enum([
      "CASH",
      "BANK",
      "CREDIT_CARD",
      "INVESTMENT",
      "OTHER",
    ]),

    initialBalance: z
      .number()
      .min(0)
      .optional(),
  })
  .strict();

export const updateAccountSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1)
      .max(100)
      .optional(),

    type: z
      .enum([
        "CASH",
        "BANK",
        "CREDIT_CARD",
        "INVESTMENT",
        "OTHER",
      ])
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

export type UpdateAccountInput = z.infer<
  typeof updateAccountSchema
>;