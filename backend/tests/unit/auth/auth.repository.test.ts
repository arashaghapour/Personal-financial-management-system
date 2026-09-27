import { beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../../../src/lib/prisma.js";

import { authRepository } from "../../../src/modules/auth/auth.repository.js";

describe("auth.repository", () => {
  let userId: number;

  beforeEach(async () => {
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();

    const user = await prisma.user.create({
      data: {
        email: "user@example.com",
        passwordHash: "hashed-password",
        firstName: "Arash",
        lastName: "Aghapour",
      },
    });

    userId = user.id;
  });

  describe("createRefreshToken", () => {
    it("should create a refresh token record", async () => {
      const expiresAt = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000,
      );

      const result = await authRepository.createRefreshToken({
        userId,
        tokenHash: "hashed-refresh-token",
        expiresAt,
      });

      expect(result).toMatchObject({
        userId,
        tokenHash: "hashed-refresh-token",
        expiresAt,
        revokedAt: null,
      });
    });
  });

  describe("findRefreshToken", () => {
    it("should find a refresh token by tokenHash", async () => {
      const created = await prisma.refreshToken.create({
        data: {
          userId,
          tokenHash: "hashed-refresh-token",
          expiresAt: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000,
          ),
        },
      });

      const result = await authRepository.findRefreshToken(
        "hashed-refresh-token",
      );

      expect(result).toMatchObject({
        id: created.id,
        userId,
        tokenHash: "hashed-refresh-token",
      });
    });

    it("should return null when refresh token does not exist", async () => {
      const result = await authRepository.findRefreshToken(
        "unknown-refresh-token",
      );

      expect(result).toBeNull();
    });
  });

  describe("findActiveRefreshToken", () => {
    it("should find an active refresh token", async () => {
      await prisma.refreshToken.create({
        data: {
          userId,
          tokenHash: "active-refresh-token",
          expiresAt: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000,
          ),
        },
      });

      const result =
        await authRepository.findActiveRefreshToken(
          "active-refresh-token",
        );

      expect(result).not.toBeNull();
      expect(result?.userId).toBe(userId);
      expect(result?.tokenHash).toBe(
        "active-refresh-token",
      );
      expect(result?.revokedAt).toBeNull();
    });

    it("should return null for a revoked refresh token", async () => {
      await prisma.refreshToken.create({
        data: {
          userId,
          tokenHash: "revoked-refresh-token",
          expiresAt: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000,
          ),
          revokedAt: new Date(),
        },
      });

      const result =
        await authRepository.findActiveRefreshToken(
          "revoked-refresh-token",
        );

      expect(result).toBeNull();
    });

    it("should return null for an expired refresh token", async () => {
      await prisma.refreshToken.create({
        data: {
          userId,
          tokenHash: "expired-refresh-token",
          expiresAt: new Date(Date.now() - 1000),
        },
      });

      const result =
        await authRepository.findActiveRefreshToken(
          "expired-refresh-token",
        );

      expect(result).toBeNull();
    });
  });

  describe("revokeRefreshToken", () => {
    it("should revoke a refresh token", async () => {
      const token = await prisma.refreshToken.create({
        data: {
          userId,
          tokenHash: "refresh-token-to-revoke",
          expiresAt: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000,
          ),
        },
      });

      const result =
        await authRepository.revokeRefreshToken(token.id);

      expect(result.id).toBe(token.id);
      expect(result.revokedAt).not.toBeNull();
    });
  });

  describe("rotateRefreshToken", () => {
    it("should revoke the old token and create a new token", async () => {
      const oldToken = await prisma.refreshToken.create({
        data: {
          userId,
          tokenHash: "old-refresh-token",
          expiresAt: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000,
          ),
        },
      });

      const newExpiresAt = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000,
      );

      const newToken =
        await authRepository.rotateRefreshToken({
          oldTokenId: oldToken.id,
          userId,
          tokenHash: "new-refresh-token",
          expiresAt: newExpiresAt,
        });

      const oldTokenFromDb =
        await prisma.refreshToken.findUnique({
          where: {
            id: oldToken.id,
          },
        });

      expect(oldTokenFromDb?.revokedAt).not.toBeNull();

      expect(newToken).toMatchObject({
        userId,
        tokenHash: "new-refresh-token",
        expiresAt: newExpiresAt,
        revokedAt: null,
      });
    });

    it("should not rotate a token belonging to another user", async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: "other@example.com",
          passwordHash: "hashed-password",
          firstName: "Other",
          lastName: "User",
        },
      });

      const oldToken = await prisma.refreshToken.create({
        data: {
          userId: otherUser.id,
          tokenHash: "other-user-refresh-token",
          expiresAt: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000,
          ),
        },
      });

      await expect(
        authRepository.rotateRefreshToken({
          oldTokenId: oldToken.id,
          userId,
          tokenHash: "new-refresh-token",
          expiresAt: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000,
          ),
        }),
      ).rejects.toThrow("Refresh token not found");

      const tokenFromDb =
        await prisma.refreshToken.findUnique({
          where: {
            id: oldToken.id,
          },
        });

      expect(tokenFromDb?.revokedAt).toBeNull();
    });

    it("should not rotate a revoked token", async () => {
      const oldToken = await prisma.refreshToken.create({
        data: {
          userId,
          tokenHash: "already-revoked-token",
          expiresAt: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000,
          ),
          revokedAt: new Date(),
        },
      });

      await expect(
        authRepository.rotateRefreshToken({
          oldTokenId: oldToken.id,
          userId,
          tokenHash: "new-refresh-token",
          expiresAt: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000,
          ),
        }),
      ).rejects.toThrow("Refresh token not found");

      const tokenFromDb =
        await prisma.refreshToken.findUnique({
          where: {
            id: oldToken.id,
          },
        });

      expect(tokenFromDb?.revokedAt).not.toBeNull();
    });
  });
});