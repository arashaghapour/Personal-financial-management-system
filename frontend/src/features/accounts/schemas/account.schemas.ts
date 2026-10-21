import { z } from "zod";

import { ACCOUNT_TYPES } from "../types";

export const accountTypeSchema = z.enum(ACCOUNT_TYPES);

/**
 * Shared account form schema. Create uses `initialBalance`; edit hides the
 * field and never sends it. The backend enforces the same name rules.
 */
export const accountFormSchema = z.object({
  name: z
    .string({ error: "Account name is required" })
    .trim()
    .min(1, "Account name is required")
    .max(100, "Account name must be 100 characters or fewer"),
  type: accountTypeSchema,
  initialBalance: z
    .number({ error: "Enter a valid initial balance" })
    .min(0, "Initial balance cannot be negative"),
});

export type AccountFormValues = z.infer<typeof accountFormSchema>;

export type AccountFormSubmitValues = {
  name: string;
  type: AccountFormValues["type"];
  initialBalance?: number;
};
