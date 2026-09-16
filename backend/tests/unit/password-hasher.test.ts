import { describe, expect, it } from "vitest";
import {
  hashPassword,
  verifyPassword,
} from "../../src/modules/auth/password-hasher.js";

describe("Password Hasher", () => {
  it("should hash a password", async () => {
    const password = "12345678";

    const passwordHash = await hashPassword(password);

    expect(passwordHash).not.toBe(password);
    expect(passwordHash).toContain("$argon2id$");
  });

  it("should generate different hashes for the same password", async () => {
    const password = "12345678";

    const firstHash = await hashPassword(password);
    const secondHash = await hashPassword(password);

    expect(firstHash).not.toBe(secondHash);
  });

  it("should verify a correct password", async () => {
    const password = "12345678";
    const passwordHash = await hashPassword(password);

    const result = await verifyPassword(password, passwordHash);

    expect(result).toBe(true);
  });

  it("should reject an incorrect password", async () => {
    const passwordHash = await hashPassword("12345678");

    const result = await verifyPassword(
      "wrong-password",
      passwordHash,
    );

    expect(result).toBe(false);
  });
});