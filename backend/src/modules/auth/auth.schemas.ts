import { z } from "zod";

import { PASSWORD_MIN_LENGTH } from "./auth.constants.js";

export const registerSchema = z
  .object({
    email: z.string().trim().email(),
    password: z.string().min(PASSWORD_MIN_LENGTH),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
  })
  .strict();

export const loginSchema = z
  .object({
    email: z.string().trim().email(),
    password: z.string().min(1),
  })
  .strict();

  export const refreshSchema = z
  .object({
    refreshToken: z.string().min(1),
  })
  .strict();