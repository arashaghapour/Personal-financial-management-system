import { describe, expect, it } from "vitest";
import request from "supertest";
import { SignJWT } from "jose";

import app from "../../src/app.js";
import { env } from "../../src/config/env.js";
import { generateAccessToken } from "../../src/utils/jwt.js";

const accessSecret = new TextEncoder().encode(
  env.jwtAccessSecret,
);

const protectedEndpoint =
  "/api/auth-test/protected/123";

describe("auth middleware", () => {
  describe("request context", () => {
    it("should extract the user id from the token sub", async () => {
      const token = await generateAccessToken(123);

      const response = await request(app)
        .get("/api/auth-test/protected/999")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.userId).toBe("123");
    });

    it("should not allow request body to override the authenticated user id", async () => {
      const token = await generateAccessToken(123);

      const response = await request(app)
        .get("/api/auth-test/protected/999")
        .set("Authorization", `Bearer ${token}`)
        .send({
          userId: "777",
        });

      expect(response.status).toBe(200);
      expect(response.body.userId).toBe("123");
    });

    it("should not allow query parameters to override the authenticated user id", async () => {
      const token = await generateAccessToken(123);

      const response = await request(app)
        .get("/api/auth-test/protected/999")
        .query({
          userId: "888",
        })
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.userId).toBe("123");
    });

    it("should not allow route parameters to override the authenticated user id", async () => {
      const token = await generateAccessToken(123);

      const response = await request(app)
        .get("/api/auth-test/protected/777")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.userId).toBe("123");
    });
  });

  describe("authentication failure", () => {
    it("should return 401 when authorization header is missing", async () => {
      const response = await request(app).get(
        protectedEndpoint,
      );

      expect(response.status).toBe(401);
    });

    it("should return 401 when authorization scheme is invalid", async () => {
      const token = await generateAccessToken(123);

      const response = await request(app)
        .get(protectedEndpoint)
        .set("Authorization", `Basic ${token}`);

      expect(response.status).toBe(401);
    });

    it("should return 401 when jwt is malformed", async () => {
      const response = await request(app)
        .get(protectedEndpoint)
        .set(
          "Authorization",
          "Bearer invalid.jwt.token",
        );

      expect(response.status).toBe(401);
    });

    it("should return 401 when jwt signature is invalid", async () => {
      const wrongSecret = new TextEncoder().encode(
        "wrong-secret",
      );

      const token = await new SignJWT({
        sub: "123",
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("15m")
        .sign(wrongSecret);

      const response = await request(app)
        .get(protectedEndpoint)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(401);
    });

    it("should return 401 when access token is expired", async () => {
      const token = await new SignJWT({
        sub: "123",
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(
          Math.floor(Date.now() / 1000) - 60,
        )
        .sign(accessSecret);

      const response = await request(app)
        .get(protectedEndpoint)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(401);
    });

    it("should return 401 when access token has no sub", async () => {
      const token = await new SignJWT({})
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("15m")
        .sign(accessSecret);

      const response = await request(app)
        .get(protectedEndpoint)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(401);
    });

    it("should return 401 when access token has an invalid sub", async () => {
      const token = await new SignJWT({
        sub: "",
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("15m")
        .sign(accessSecret);

      const response = await request(app)
        .get(protectedEndpoint)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(401);
    });
  });

  describe("error security", () => {
    it("should not expose raw jwt errors", async () => {
      const response = await request(app)
        .get(protectedEndpoint)
        .set(
          "Authorization",
          "Bearer invalid.jwt.token",
        );

      expect(response.status).toBe(401);

      const responseBody = JSON.stringify(response.body);

      expect(responseBody).not.toContain("JWSInvalid");
      expect(responseBody).not.toContain("JWTExpired");
      expect(responseBody).not.toContain("JWTClaimValidationFailed");
      expect(responseBody).not.toContain("Invalid Compact JWS");
    });

    it("should not expose the token in the error response", async () => {
      const token = "sensitive.fake.jwt.token";

      const response = await request(app)
        .get(protectedEndpoint)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(401);

      const responseBody = JSON.stringify(response.body);

      expect(responseBody).not.toContain(token);
    });

    it("should not expose jwt secrets in the error response", async () => {
      const response = await request(app)
        .get(protectedEndpoint)
        .set(
          "Authorization",
          "Bearer invalid.jwt.token",
        );

      expect(response.status).toBe(401);

      const responseBody = JSON.stringify(response.body);

      expect(responseBody).not.toContain(
        env.jwtAccessSecret,
      );
      expect(responseBody).not.toContain(
        env.jwtRefreshSecret,
      );
    });

    it("should not expose a password hash in the error response", async () => {
      const passwordHash =
        "$argon2id$v=19$m=65536,t=3,p=4$fake-hash";

      const response = await request(app)
        .get(protectedEndpoint)
        .set("Authorization", "Bearer invalid.jwt.token");

      expect(response.status).toBe(401);

      const responseBody = JSON.stringify(response.body);

      expect(responseBody).not.toContain(passwordHash);
      expect(responseBody).not.toContain("passwordHash");
    });

    it("should not expose a stack trace in the error response", async () => {
      const response = await request(app)
        .get(protectedEndpoint)
        .set("Authorization", "Bearer invalid.jwt.token");

      expect(response.status).toBe(401);

      const responseBody = JSON.stringify(response.body);

      expect(responseBody).not.toContain("stack");
      expect(responseBody).not.toContain("Error:");
      expect(responseBody).not.toContain("at ");
      expect(responseBody).not.toContain("node_modules");
    });

    it("should return a safe authentication error response", async () => {
      const response = await request(app)
        .get(protectedEndpoint)
        .set("Authorization", "Bearer invalid.jwt.token");

      expect(response.status).toBe(401);

      expect(response.body).toEqual({
        error: {
          code: "INVALID_ACCESS_TOKEN",
          message: "Invalid access token",
        },
      });
    });
  });
});
