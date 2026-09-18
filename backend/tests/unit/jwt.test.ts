import { describe, expect, it } from "vitest";

import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "../../src/utils/jwt.js";

describe("jwt", () => {
  describe("refresh token", () => {
    it("should create a refresh token", async () => {
      const token = await generateRefreshToken(1);

      expect(token).toBeTypeOf("string");
      expect(token.split(".")).toHaveLength(3);
    });

    it("should verify a valid refresh token", async () => {
      const token = await generateRefreshToken(1);

      await expect(verifyRefreshToken(token)).resolves.toBeDefined();
    });

    it("should contain the correct sub", async () => {
      const token = await generateRefreshToken(123);

      const result = await verifyRefreshToken(token);

      expect(result.payload.sub).toBe("123");
    });

    it("should contain iat", async () => {
      const token = await generateRefreshToken(1);

      const result = await verifyRefreshToken(token);

      expect(result.payload.iat).toBeTypeOf("number");
    });

    it("should contain exp", async () => {
      const token = await generateRefreshToken(1);

      const result = await verifyRefreshToken(token);

      expect(result.payload.exp).toBeTypeOf("number");
    });

    it("should have exp after iat", async () => {
      const token = await generateRefreshToken(1);

      const result = await verifyRefreshToken(token);

      expect(result.payload.exp).toBeGreaterThan(
        result.payload.iat!,
      );
    });

    it("should reject a tampered refresh token", async () => {
      const token = await generateRefreshToken(1);

      const tamperedToken =
        token.slice(0, -1) +
        (token.endsWith("a") ? "b" : "a");

      await expect(
        verifyRefreshToken(tamperedToken),
      ).rejects.toThrow();
    });

    it("should reject a refresh token with the access secret", async () => {
      const refreshToken = await generateRefreshToken(1);

      await expect(
        verifyAccessToken(refreshToken),
      ).rejects.toThrow();
    });

    it("should reject an access token with the refresh secret", async () => {
      const accessToken = await generateAccessToken(1);

      await expect(
        verifyRefreshToken(accessToken),
      ).rejects.toThrow();
    });
  });
});