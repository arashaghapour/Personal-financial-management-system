import { describe, expect, it } from "vitest";

import { loginSchema } from "../../src/modules/auth/auth.schemas.js";

describe("loginSchema", () => {
  it("should reject missing email", () => {
    const result = loginSchema.safeParse({
      password: "abc",
    });

    expect(result.success).toBe(false);
  });

  it("should reject invalid email", () => {
    const result = loginSchema.safeParse({
      email: "invalid-email",
      password: "abc",
    });

    expect(result.success).toBe(false);
  });

  it("should reject missing password", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
    });

    expect(result.success).toBe(false);
  });

  it("should accept a short password", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "abc",
    });

    expect(result.success).toBe(true);
  });

  it("should normalize the email", () => {
    const result = loginSchema.safeParse({
      email: "  User@Example.COM  ",
      password: "abc",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.email).toBe("User@Example.COM");
    }
  });


});