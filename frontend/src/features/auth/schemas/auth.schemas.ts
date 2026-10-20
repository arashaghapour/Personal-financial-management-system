import { z } from "zod";

/**
 * Backend password policy (backend PASSWORD_MIN_LENGTH = 8). The backend
 * enforces the same minimum with no additional complexity rules.
 */
export const PASSWORD_MIN_LENGTH = 8;

export const loginSchema = z.object({
  email: z
    .string({ error: "Email is required" })
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  password: z
    .string({ error: "Password is required" })
    .min(1, "Password is required"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    firstName: z
      .string({ error: "First name is required" })
      .trim()
      .min(1, "First name is required"),
    lastName: z
      .string({ error: "Last name is required" })
      .trim()
      .min(1, "Last name is required"),
    email: z
      .string({ error: "Email is required" })
      .trim()
      .min(1, "Email is required")
      .email("Enter a valid email address"),
    password: z
      .string({ error: "Password is required" })
      .min(1, "Password is required")
      .min(
        PASSWORD_MIN_LENGTH,
        `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
      ),
    confirmPassword: z
      .string({ error: "Please confirm your password" })
      .min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
