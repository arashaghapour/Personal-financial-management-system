import { describe, expect, it } from "vitest";
import { toPublicUser } from "../../src/modules/auth/auth.mapper.js";
import type { User } from "../../src/modules/auth/auth.types.js";

describe("toPublicUser", () => {
  it("should remove passwordHash from user", () => {
    const user: User = {
      id: 1,
      email: "test@example.com",
      passwordHash: "hashed-password",
      firstName: "Test",
      lastName: "User",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = toPublicUser(user);

    expect(result).toEqual({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });

    expect(result).not.toHaveProperty("passwordHash");
  });
});