import { z } from "zod";

import {
  TRANSACTION_TYPE_FILTERS,
  TRANSACTION_TYPES,
} from "../types";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const isCalendarDate = (value: string): boolean => {
  if (!DATE_PATTERN.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
};

export const transactionTypeSchema = z.enum(TRANSACTION_TYPES);

/**
 * Shared create/edit form schema. The backend requires a positive amount,
 * a real YYYY-MM-DD date, a positive integer account ID, and a UUID category.
 * Description is optional and limited to 500 characters.
 */
export const transactionFormSchema = z.object({
  type: transactionTypeSchema,
  amount: z
    .number({ error: "Amount is required" })
    .finite("Enter a valid amount")
    .positive("Amount must be greater than 0"),
  description: z
    .string()
    .trim()
    .max(500, "Description must be 500 characters or fewer")
    .optional(),
  date: z
    .string({ error: "Date is required" })
    .min(1, "Date is required")
    .regex(DATE_PATTERN, "Enter a valid date")
    .refine(isCalendarDate, "Enter a valid date"),
  accountId: z
    .number({ error: "Select an account" })
    .int("Select an account")
    .positive("Select an account"),
  categoryId: z
    .string({ error: "Select a category" })
    .min(1, "Select a category")
    .uuid("Select a category"),
});

export type TransactionFormValues = z.infer<typeof transactionFormSchema>;

const optionalDate = z
  .string()
  .refine(
    (value) => value === "" || isCalendarDate(value),
    "Enter a valid date.",
  );

const optionalPositiveAmount = z.string().refine((value) => {
  if (value === "") {
    return true;
  }

  const amount = Number(value);

  return Number.isFinite(amount) && amount > 0;
}, "Enter a valid amount.");

/**
 * Raw filter controls. Values stay as strings while the user edits them and
 * are converted to the backend's query parameter types before fetching.
 */
export const transactionFilterDraftSchema = z
  .object({
    type: z.enum(TRANSACTION_TYPE_FILTERS),
    accountId: z.string(),
    categoryId: z.string(),
    startDate: optionalDate,
    endDate: optionalDate,
    minAmount: optionalPositiveAmount,
    maxAmount: optionalPositiveAmount,
  })
  .superRefine((filters, context) => {
    if (
      filters.startDate !== "" &&
      filters.endDate !== "" &&
      filters.startDate > filters.endDate
    ) {
      context.addIssue({
        code: "custom",
        path: ["startDate"],
        message: "Start date must be on or before the end date.",
      });
    }

    if (
      filters.minAmount !== "" &&
      filters.maxAmount !== "" &&
      Number(filters.minAmount) > Number(filters.maxAmount)
    ) {
      context.addIssue({
        code: "custom",
        path: ["minAmount"],
        message:
          "Minimum amount must be less than or equal to the maximum amount.",
      });
    }
  });

export type TransactionFilterDraft = z.infer<
  typeof transactionFilterDraftSchema
>;

export const emptyTransactionFilterDraft: TransactionFilterDraft = {
  type: "ALL",
  accountId: "",
  categoryId: "",
  startDate: "",
  endDate: "",
  minAmount: "",
  maxAmount: "",
};
