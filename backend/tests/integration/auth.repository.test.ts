import { describe, expect, it } from "vitest";
import { authRepository } from "../../src/modules/auth/auth.repository.js";

describe("Auth Repository", () => {
  it("should find an existing user by email", async () => {
    const user = await authRepository.create({
      email: "test@example.com",
      passwordHash: "hashed-password",
      firstName: "Test",
      lastName: "User",
    });
    const result = await authRepository.findByEmail(user.email);

    expect(result).not.toBeNull();
    expect(result?.id).toBe(user.id);
    expect(result?.email).toBe(user.email);
  });

  it("should return null when the user does not exist by email", async () => {
    const result = await authRepository.findByEmail(
      "not-found@example.com",
    );

    expect(result).toBeNull();
  });

  it("should find an existing user by id", async () => {
    const user = await authRepository.create({
      email: "id-test@example.com",
      passwordHash: "hashed-password",
      firstName: "Test",
      lastName: "User",
    });

    const result = await authRepository.findById(user.id);

    expect(result).not.toBeNull();
    expect(result?.id).toBe(user.id);
    expect(result?.email).toBe(user.email);
  });

  it("should return null when the user does not exist by id", async () => {
    const result = await authRepository.findById(999999);

    expect(result).toBeNull();
  });

  it("should create a user", async () => {
    const result = await authRepository.create({
      email: "create-test@example.com",
      passwordHash: "hashed-password",
      firstName: "Create",
      lastName: "Test",
    });

    expect(result.id).toBeTypeOf("number");
    expect(result.email).toBe("create-test@example.com");
    expect(result.passwordHash).toBe("hashed-password");
    expect(result.firstName).toBe("Create");
    expect(result.lastName).toBe("Test");
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
  });
});