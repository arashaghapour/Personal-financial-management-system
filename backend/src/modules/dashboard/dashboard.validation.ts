import { z } from "zod";

export const dashboardQuerySchema = z
  .object({
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
  })
  .strict()
  .refine(
    (data) =>
      data.startDate === undefined ||
      data.endDate === undefined ||
      data.startDate <= data.endDate,
    {
      message: "startDate must be less than or equal to endDate",
      path: ["startDate"],
    },
  );

export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;