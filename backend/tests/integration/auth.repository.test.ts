import { describe, expect, it } from "vitest";

import { prisma } from "../../src/lib/prisma.js";
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

  it("should create a refresh token", async () => {
    const user = await authRepository.create({
      email: "refresh-create@example.com",
      passwordHash: "hashed-password",
      firstName: "Refresh",
      lastName: "Create",
    });

    const expiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000,
    );

    const result = await authRepository.createRefreshToken({
      userId: user.id,
      tokenHash: "refresh-token-hash",
      expiresAt,
    });

    expect(result.id).toBeTypeOf("number");
    expect(result.userId).toBe(user.id);
    expect(result.tokenHash).toBe("refresh-token-hash");
    expect(result.expiresAt).toEqual(expiresAt);
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.revokedAt).toBeNull();
  });

  it("should find a refresh token by token hash", async () => {
    const user = await authRepository.create({
      email: "refresh-find@example.com",
      passwordHash: "hashed-password",
      firstName: "Refresh",
      lastName: "Find",
    });

    const refreshToken =
      await authRepository.createRefreshToken({
        userId: user.id,
        tokenHash: "find-refresh-token-hash",
        expiresAt: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ),
      });

    const result =
      await authRepository.findRefreshToken(
        refreshToken.tokenHash,
      );

    expect(result).not.toBeNull();
    expect(result?.id).toBe(refreshToken.id);
    expect(result?.userId).toBe(user.id);
    expect(result?.tokenHash).toBe(refreshToken.tokenHash);
  });

  it("should return null when the refresh token does not exist", async () => {
    const result =
      await authRepository.findRefreshToken(
        "not-found-refresh-token-hash",
      );

    expect(result).toBeNull();
  });

  it("should revoke a refresh token", async () => {
    const user = await authRepository.create({
      email: "refresh-revoke@example.com",
      passwordHash: "hashed-password",
      firstName: "Refresh",
      lastName: "Revoke",
    });

    const refreshToken =
      await authRepository.createRefreshToken({
        userId: user.id,
        tokenHash: "revoke-refresh-token-hash",
        expiresAt: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ),
      });

    const result =
      await authRepository.revokeRefreshToken(
        refreshToken.id,
      );

    expect(result.id).toBe(refreshToken.id);
    expect(result.revokedAt).toBeInstanceOf(Date);
  });

  it("should preserve the relation between refresh token and user", async () => {
    const user = await authRepository.create({
      email: "refresh-relation@example.com",
      passwordHash: "hashed-password",
      firstName: "Refresh",
      lastName: "Relation",
    });

    const refreshToken =
      await authRepository.createRefreshToken({
        userId: user.id,
        tokenHash: "relation-refresh-token-hash",
        expiresAt: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ),
      });

    const result = await prisma.refreshToken.findUnique({
      where: {
        id: refreshToken.id,
      },
      include: {
        user: true,
      },
    });

    expect(result?.user.id).toBe(user.id);
    expect(result?.user.email).toBe(user.email);
  });

  it("should store the refresh token expiration", async () => {
    const user = await authRepository.create({
      email: "refresh-expiration@example.com",
      passwordHash: "hashed-password",
      firstName: "Refresh",
      lastName: "Expiration",
    });

    const expiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000,
    );

    const result =
      await authRepository.createRefreshToken({
        userId: user.id,
        tokenHash: "expiration-refresh-token-hash",
        expiresAt,
      });

    expect(result.expiresAt).toEqual(expiresAt);
    expect(result.expiresAt.getTime()).toBeGreaterThan(
      Date.now(),
    );
  });

  it("should create a refresh token with a non-revoked state", async () => {
    const user = await authRepository.create({
      email: "refresh-active@example.com",
      passwordHash: "hashed-password",
      firstName: "Refresh",
      lastName: "Active",
    });

    const result =
      await authRepository.createRefreshToken({
        userId: user.id,
        tokenHash: "active-refresh-token-hash",
        expiresAt: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ),
      });

    expect(result.revokedAt).toBeNull();
  });

  it("should set revokedAt when revoking a refresh token", async () => {
    const user = await authRepository.create({
      email: "refresh-revoked@example.com",
      passwordHash: "hashed-password",
      firstName: "Refresh",
      lastName: "Revoked",
    });

    const refreshToken =
      await authRepository.createRefreshToken({
        userId: user.id,
        tokenHash: "revoked-refresh-token-hash",
        expiresAt: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ),
      });

    await authRepository.revokeRefreshToken(
      refreshToken.id,
    );

    const result = await prisma.refreshToken.findUnique({
      where: {
        id: refreshToken.id,
      },
    });

    expect(result?.revokedAt).toBeInstanceOf(Date);
  });


  it("should rollback refresh token rotation when creating the new token fails", async () => {
    const user = await authRepository.create({
      email: "rotation-rollback@example.com",
      passwordHash: "hashed-password",
      firstName: "Rotation",
      lastName: "Rollback",
    });
  
    const oldToken = await authRepository.createRefreshToken({
      userId: user.id,
      tokenHash: "old-token-hash",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
  
    await expect(
      authRepository.rotateRefreshToken({
        oldTokenId: oldToken.id,
        userId: user.id,
        tokenHash: "old-token-hash",
        expiresAt: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ),
      }),
    ).rejects.toThrow();
  
    const oldTokenAfterFailure =
      await prisma.refreshToken.findUnique({
        where: {
          id: oldToken.id,
        },
      });
  
    expect(oldTokenAfterFailure).not.toBeNull();
    expect(oldTokenAfterFailure?.revokedAt).toBeNull();
  });
});