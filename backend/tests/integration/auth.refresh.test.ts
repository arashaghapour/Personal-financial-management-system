import { describe, expect, it } from "vitest";
import request from "supertest";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../src/utils/jwt.js";
import app from "../../src/app.js";
import { prisma } from "../../src/lib/prisma.js";
import { hashRefreshToken } from "../../src/modules/auth/refresh-token.utils.js";
import { SignJWT } from "jose";

import { env } from "../../src/config/env.js";

describe("POST /api/auth/refresh", () => {
  it("should refresh tokens successfully", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        email: "refresh-success@example.com",
        password: "password123",
        firstName: "Arash",
        lastName: "Aghapour",
      });

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: "refresh-success@example.com",
        password: "password123",
      });

    expect(loginResponse.status).toBe(200);

    const oldAccessToken = loginResponse.body.accessToken;
    const oldRefreshToken = loginResponse.body.refreshToken;

    const refreshResponse = await request(app)
      .post("/api/auth/refresh")
      .send({
        refreshToken: oldRefreshToken,
      });
    expect(refreshResponse.status).toBe(200);

    expect(refreshResponse.body.accessToken).toBeTypeOf(
      "string",
    );

    expect(refreshResponse.body.refreshToken).toBeTypeOf(
      "string",
    );

    expect(refreshResponse.body.accessToken).not.toBe(
      oldAccessToken,
    );

    expect(refreshResponse.body.refreshToken).not.toBe(
      oldRefreshToken,
    );

    const oldTokenHash = hashRefreshToken(oldRefreshToken);
    const newTokenHash = hashRefreshToken(
      refreshResponse.body.refreshToken,
    );

    const oldTokenRecord =
      await prisma.refreshToken.findUnique({
        where: {
          tokenHash: oldTokenHash,
        },
      });

    const newTokenRecord =
      await prisma.refreshToken.findUnique({
        where: {
          tokenHash: newTokenHash,
        },
      });

    expect(oldTokenRecord).not.toBeNull();
    expect(oldTokenRecord?.revokedAt).not.toBeNull();

    expect(newTokenRecord).not.toBeNull();
    expect(newTokenRecord?.revokedAt).toBeNull();

    expect(newTokenRecord?.userId).toBe(
      oldTokenRecord?.userId,
    );
  });

  it("should revoke the old refresh token", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        email: "refresh-revoked@example.com",
        password: "password123",
        firstName: "Arash",
        lastName: "Aghapour",
      });
  
    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: "refresh-revoked@example.com",
        password: "password123",
      });
  
    const oldRefreshToken = loginResponse.body.refreshToken;
  
    const refreshResponse = await request(app)
      .post("/api/auth/refresh")
      .send({
        refreshToken: oldRefreshToken,
      });
  
    expect(refreshResponse.status).toBe(200);
  
    const secondRefreshResponse = await request(app)
      .post("/api/auth/refresh")
      .send({
        refreshToken: oldRefreshToken,
      });
  
    expect(secondRefreshResponse.status).toBe(401);
  
    expect(secondRefreshResponse.body).toEqual({
      error: {
        code: "INVALID_REFRESH_TOKEN",
        message: "Invalid refresh token",
      },
    });
  });

  it("should reject when refresh token is missing", async () => {
    const response = await request(app)
      .post("/api/auth/refresh")
      .send({});
  
    expect(response.status).toBe(400);
  
    expect(response.body).toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        details: expect.any(Array),
      },
    });
  });
  
  it("should reject an empty refresh token", async () => {
    const response = await request(app)
      .post("/api/auth/refresh")
      .send({
        refreshToken: "",
      });
  
    expect(response.status).toBe(400);
  
    expect(response.body).toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        details: expect.any(Array),
      },
    });
  });
  
  it("should reject an invalid refresh token", async () => {
    const response = await request(app)
      .post("/api/auth/refresh")
      .send({
        refreshToken: "invalid-refresh-token",
      });
  
    expect(response.status).toBe(401);
  
    expect(response.body).toEqual({
      error: {
        code: "INVALID_REFRESH_TOKEN",
        message: "Invalid refresh token",
      },
    });
  });

  it("should reject a tampered refresh token", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        email: "refresh-tampered@example.com",
        password: "password123",
        firstName: "Arash",
        lastName: "Aghapour",
      });
  
    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: "refresh-tampered@example.com",
        password: "password123",
      });
  
    const refreshToken = loginResponse.body.refreshToken;
  
    const tamperedToken =
      refreshToken.slice(0, -1) +
      (refreshToken.endsWith("a") ? "b" : "a");
  
    const response = await request(app)
      .post("/api/auth/refresh")
      .send({
        refreshToken: tamperedToken,
      });
  
    expect(response.status).toBe(401);
  
    expect(response.body).toEqual({
      error: {
        code: "INVALID_REFRESH_TOKEN",
        message: "Invalid refresh token",
      },
    });
  });

  it("should reject an access token", async () => {
    const accessToken = await generateAccessToken(1);
  
    const response = await request(app)
      .post("/api/auth/refresh")
      .send({
        refreshToken: accessToken,
      });
  
    expect(response.status).toBe(401);
  
    expect(response.body).toEqual({
      error: {
        code: "INVALID_REFRESH_TOKEN",
        message: "Invalid refresh token",
      },
    });
  });

  it("should reject a revoked refresh token", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        email: "refresh-revoked-test@example.com",
        password: "password123",
        firstName: "Arash",
        lastName: "Aghapour",
      });
  
    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: "refresh-revoked-test@example.com",
        password: "password123",
      });
  
    const refreshToken = loginResponse.body.refreshToken;
  
    const firstRefreshResponse = await request(app)
      .post("/api/auth/refresh")
      .send({
        refreshToken,
      });
  
    expect(firstRefreshResponse.status).toBe(200);
  
    const secondRefreshResponse = await request(app)
      .post("/api/auth/refresh")
      .send({
        refreshToken,
      });
  
    expect(secondRefreshResponse.status).toBe(401);
  
    expect(secondRefreshResponse.body).toEqual({
      error: {
        code: "INVALID_REFRESH_TOKEN",
        message: "Invalid refresh token",
      },
    });
  });

  it("should reject a valid refresh token without a database record", async () => {
    const refreshToken = await generateRefreshToken(1);
  
    const response = await request(app)
      .post("/api/auth/refresh")
      .send({
        refreshToken,
      });
  
    expect(response.status).toBe(401);
  
    expect(response.body).toEqual({
      error: {
        code: "INVALID_REFRESH_TOKEN",
        message: "Invalid refresh token",
      },
    });
  });


  it("should reject an expired refresh token", async () => {
    const secret = new TextEncoder().encode(
      env.jwtRefreshSecret,
    );
  
    const expiredRefreshToken = await new SignJWT({})
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("1")
      .setIssuedAt()
      .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
      .sign(secret);
  
    const response = await request(app)
      .post("/api/auth/refresh")
      .send({
        refreshToken: expiredRefreshToken,
      });
  
    expect(response.status).toBe(401);
  
    expect(response.body).toEqual({
      error: {
        code: "INVALID_REFRESH_TOKEN",
        message: "Invalid refresh token",
      },
    });
  });

  it("should reject a refresh token with an expired database record", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        email: "refresh-db-expired@example.com",
        password: "password123",
        firstName: "Arash",
        lastName: "Aghapour",
      });
  
    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: "refresh-db-expired@example.com",
        password: "password123",
      });
  
    expect(loginResponse.status).toBe(200);
  
    const refreshToken = loginResponse.body.refreshToken;
  
    const tokenHash = hashRefreshToken(refreshToken);
  
    await prisma.refreshToken.update({
      where: {
        tokenHash,
      },
      data: {
        expiresAt: new Date(Date.now() - 60_000),
      },
    });
  
    const response = await request(app)
      .post("/api/auth/refresh")
      .send({
        refreshToken,
      });
  
    expect(response.status).toBe(401);
  
    expect(response.body).toEqual({
      error: {
        code: "INVALID_REFRESH_TOKEN",
        message: "Invalid refresh token",
      },
    });
  });
});