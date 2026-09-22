import { describe, expect, it } from "vitest";
import { SignJWT } from "jose";

import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "../../src/utils/jwt.js";
import { parseAccessTokenPayload } from "../../src/utils/jwt.js";

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
    
      const [header, payload, signature] = token.split(".");
    
      const tamperedSignature =
        (signature[0] === "a" ? "b" : "a") +
        signature.slice(1);
    
      const tamperedToken = [
        header,
        payload,
        tamperedSignature,
      ].join(".");
    
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

    it("should reject a token signed with the wrong secret", async () => {
      const wrongSecret = new TextEncoder().encode(
        "wrong-secret",
      );

      const token = await new SignJWT({
        sub: "1",
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("15m")
        .sign(wrongSecret);

      await expect(
        verifyRefreshToken(token),
      ).rejects.toThrow();
    });
  });

  describe("access token", () => {
    it("should create an access token", async () => {
      const token = await generateAccessToken(1);

      expect(token).toBeTypeOf("string");
      expect(token.split(".")).toHaveLength(3);
    });

    it("should verify a valid access token", async () => {
      const token = await generateAccessToken(1);

      await expect(verifyAccessToken(token)).resolves.toBeDefined();
    });

    it("should contain the correct sub", async () => {
      const token = await generateAccessToken(123);

      const result = await verifyAccessToken(token);

      expect(result.payload.sub).toBe("123");
    });

    it("should contain iat", async () => {
      const token = await generateAccessToken(1);

      const result = await verifyAccessToken(token);

      expect(result.payload.iat).toBeTypeOf("number");
    });

    it("should contain exp", async () => {
      const token = await generateAccessToken(1);

      const result = await verifyAccessToken(token);

      expect(result.payload.exp).toBeTypeOf("number");
    });

    it("should have exp after iat", async () => {
      const token = await generateAccessToken(1);

      const result = await verifyAccessToken(token);

      expect(result.payload.exp).toBeGreaterThan(
        result.payload.iat!,
      );
    });

    it("should reject a tampered access token", async () => {
      const token = await generateAccessToken(1);

      const tamperedToken =
        token.slice(0, -1) +
        (token.endsWith("a") ? "b" : "a");

      await expect(
        verifyAccessToken(tamperedToken),
      ).rejects.toThrow();
    });

    it("should reject a token without sub", () => {
      expect(() =>
        parseAccessTokenPayload({
          iat: 100,
          exp: 200,
        }),
      ).toThrow("Invalid access token subject");
    });

    it("should reject an invalid sub", () => {
      expect(() =>
        parseAccessTokenPayload({
          sub: "",
        }),
      ).toThrow("Invalid access token subject");
    });

    it("should reject a token signed with the wrong secret", async () => {
      const wrongSecret = new TextEncoder().encode(
        "wrong-secret",
      );

      const token = await new SignJWT({
        sub: "1",
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("15m")
        .sign(wrongSecret);

      await expect(
        verifyAccessToken(token),
      ).rejects.toThrow();
    });
  });
});