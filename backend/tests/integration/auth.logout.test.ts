import { describe, expect, it } from "vitest";

import request from "supertest";

import app from "../../src/app.js";

import { prisma } from "../../src/lib/prisma.js";

import { hashRefreshToken } from "../../src/modules/auth/refresh-token.utils.js";

describe("POST /api/auth/logout", () => {
  it("should logout successfully", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        email: "logout-success@example.com",
        password: "password123",
        firstName: "Arash",
        lastName: "Aghapour",
      });

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: "logout-success@example.com",
        password: "password123",
      });

    expect(loginResponse.status).toBe(200);

    const accessToken = loginResponse.body.accessToken;
    const refreshToken = loginResponse.body.refreshToken;

    const response = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        refreshToken,
      });

    expect(response.status).toBe(204);
    expect(response.body).toEqual({});
  });

  it("should revoke the refresh token after logout", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        email: "logout-revoke@example.com",
        password: "password123",
        firstName: "Arash",
        lastName: "Aghapour",
      });

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: "logout-revoke@example.com",
        password: "password123",
      });

    const refreshToken = loginResponse.body.refreshToken;
    const accessToken = loginResponse.body.accessToken;

    const response = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        refreshToken,
      });

    expect(response.status).toBe(204);

    const tokenHash = hashRefreshToken(refreshToken);

    const tokenRecord =
      await prisma.refreshToken.findUnique({
        where: {
          tokenHash,
        },
      });

    expect(tokenRecord).not.toBeNull();
    expect(tokenRecord?.revokedAt).not.toBeNull();
  });

  it("should reject logout without an access token", async () => {
    const response = await request(app)
      .post("/api/auth/logout")
      .send({
        refreshToken: "refresh-token",
      });

    expect(response.status).toBe(401);
  });

  it("should reject logout with an empty refresh token", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        email: "logout-empty@example.com",
        password: "password123",
        firstName: "Arash",
        lastName: "Aghapour",
      });

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: "logout-empty@example.com",
        password: "password123",
      });

    const response = await request(app)
      .post("/api/auth/logout")
      .set(
        "Authorization",
        `Bearer ${loginResponse.body.accessToken}`,
      )
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

  it("should not revoke another user's refresh token", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        email: "logout-user-a@example.com",
        password: "password123",
        firstName: "Arash",
        lastName: "Aghapour",
      });

    await request(app)
      .post("/api/auth/register")
      .send({
        email: "logout-user-b@example.com",
        password: "password123",
        firstName: "Other",
        lastName: "User",
      });

    const userAResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: "logout-user-a@example.com",
        password: "password123",
      });

    const userBResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: "logout-user-b@example.com",
        password: "password123",
      });

    const userAAccessToken =
      userAResponse.body.accessToken;

    const userBRefreshToken =
      userBResponse.body.refreshToken;

    const response = await request(app)
      .post("/api/auth/logout")
      .set(
        "Authorization",
        `Bearer ${userAAccessToken}`,
      )
      .send({
        refreshToken: userBRefreshToken,
      });

    expect(response.status).toBe(204);

    const refreshResponse = await request(app)
      .post("/api/auth/refresh")
      .send({
        refreshToken: userBRefreshToken,
      });

    expect(refreshResponse.status).toBe(200);
  });

  it("should return 204 when logging out with an already revoked refresh token", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        email: "logout-revoked@example.com",
        password: "password123",
        firstName: "Arash",
        lastName: "Aghapour",
      });

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: "logout-revoked@example.com",
        password: "password123",
      });

    const accessToken = loginResponse.body.accessToken;
    const refreshToken = loginResponse.body.refreshToken;

    const firstLogoutResponse = await request(app)
      .post("/api/auth/logout")
      .set(
        "Authorization",
        `Bearer ${accessToken}`,
      )
      .send({
        refreshToken,
      });

    expect(firstLogoutResponse.status).toBe(204);

    const secondLogoutResponse = await request(app)
      .post("/api/auth/logout")
      .set(
        "Authorization",
        `Bearer ${accessToken}`,
      )
      .send({
        refreshToken,
      });

    expect(secondLogoutResponse.status).toBe(204);
  });

  it("should reject logout with an invalid access token", async () => {
    const response = await request(app)
      .post("/api/auth/logout")
      .set(
        "Authorization",
        "Bearer invalid-access-token",
      )
      .send({
        refreshToken: "refresh-token",
      });

    expect(response.status).toBe(401);
  });
});