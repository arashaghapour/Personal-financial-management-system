import { z } from "zod";

export const bodyTestSchema = z.object({
  name: z.string().min(1),
});

export const queryTestSchema = z.object({
  page: z.string().regex(/^\d+$/),
});

export const paramsTestSchema = z.object({
  id: z.string().regex(/^\d+$/),
});

