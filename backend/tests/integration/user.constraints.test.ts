import { describe, expect, it } from "vitest";
import { prisma } from "../../src/lib/prisma.js";

describe("User database constraints", () => {
  it("should persist a valid user", async () => {
    const user = await prisma.user.create({
      data: {
        email: "valid@example.com",
        passwordHash: "hashed-password",
        firstName: "Valid",
        lastName: "User",
      },
    });

    expect(user.id).toBeTypeOf("number");
    expect(user.email).toBe("valid@example.com");
  });

  it("should reject missing required fields", async () => {
    await expect(
      prisma.user.create({
        data: {
          email: "missing@example.com",
        } as never,
      }),
    ).rejects.toThrow();
  });

  it("should reject duplicate email", async () => {
    await prisma.user.create({
      data: {
        email: "duplicate@example.com",
        passwordHash: "hashed-password",
        firstName: "First",
        lastName: "User",
      },
    });

    await expect(
      prisma.user.create({
        data: {
          email: "duplicate@example.com",
          passwordHash: "another-hash",
          firstName: "Second",
          lastName: "User",
        },
      }),
    ).rejects.toThrow();
  });
});