import { z } from "zod";

const isValidDateString = (value: string): boolean => {
  const parts = value.split("-");

  if (parts.length !== 3) {
    return false;
  }

  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return false;
  }

  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Date must be in YYYY-MM-DD format",
  })
  .refine(isValidDateString, {
    message: "Invalid date",
  });

const reportDateQueryFields = {
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
};

const validateDateRange = (data: {
  startDate?: string | undefined;
  endDate?: string | undefined;
}) =>
  data.startDate === undefined ||
  data.endDate === undefined ||
  data.startDate <= data.endDate;

export const reportDateQuerySchema = z
  .object(reportDateQueryFields)
  .strict()
  .refine(validateDateRange, {
    message: "startDate must be less than or equal to endDate",
    path: ["startDate"],
  });

export const summaryQuerySchema = reportDateQuerySchema;

export const expensesQuerySchema = z
  .object({
    ...reportDateQueryFields,
    categoryId: z.string().uuid().optional(),
  })
  .strict()
  .refine(validateDateRange, {
    message: "startDate must be less than or equal to endDate",
    path: ["startDate"],
  });

export const cashFlowQuerySchema = reportDateQuerySchema;

export type ReportDateQuery = z.infer<typeof reportDateQuerySchema>;
export type SummaryQuery = z.infer<typeof summaryQuerySchema>;
export type ExpensesQuery = z.infer<typeof expensesQuerySchema>;
export type CashFlowQuery = z.infer<typeof cashFlowQuerySchema>;