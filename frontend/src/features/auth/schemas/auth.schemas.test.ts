import { describe, expect, it } from "vitest";

import { loginSchema, registerSchema } from "./auth.schemas";

const validRegister = {
  firstName: "Arash",
  lastName: "Aghapour",
  email: "user@example.com",
  password: "password123",
  confirmPassword: "password123",
};

describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "password123",
    });

    expect(result.success).toBe(true);
  });

  it("requires an email", () => {
    const result = loginSchema.safeParse({ password: "password123" });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("Email is required");
  });

  it("rejects an invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "password123",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe(
      "Enter a valid email address",
    );
  });

  it("requires a password", () => {
    const result = loginSchema.safeParse({ email: "user@example.com" });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("Password is required");
  });
});

describe("registerSchema", () => {
  it("accepts a valid registration", () => {
    const result = registerSchema.safeParse(validRegister);

    expect(result.success).toBe(true);
  });

  it("requires first and last name", () => {
    const result = registerSchema.safeParse({
      ...validRegister,
      firstName: "",
      lastName: "",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.message)).toEqual([
      "First name is required",
      "Last name is required",
    ]);
  });

  it("rejects an invalid email", () => {
    const result = registerSchema.safeParse({
      ...validRegister,
      email: "invalid",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe(
      "Enter a valid email address",
    );
  });

  it("enforces the backend minimum password length", () => {
    const result = registerSchema.safeParse({
      ...validRegister,
      password: "short",
      confirmPassword: "short",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe(
      "Password must be at least 8 characters",
    );
  });

  it("requires the password confirmation to match", () => {
    const result = registerSchema.safeParse({
      ...validRegister,
      confirmPassword: "different",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["confirmPassword"]);
    expect(result.error?.issues[0].message).toBe("Passwords do not match");
  });

  it("requires the password confirmation to be present", () => {
    const result = registerSchema.safeParse({
      firstName: validRegister.firstName,
      lastName: validRegister.lastName,
      email: validRegister.email,
      password: validRegister.password,
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe(
      "Please confirm your password",
    );
  });
});
