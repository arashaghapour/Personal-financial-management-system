import { describe, expect, it } from "vitest";
import request from "supertest";
import { jwtVerify } from "jose";

import app from "../../src/app.js";
import { env } from "../../src/config/env.js";
import { prisma } from "../../src/lib/prisma.js";
import { hashRefreshToken } from "../../src/modules/auth/refresh-token.utils.js";

const secret = new TextEncoder().encode(env.jwtAccessSecret);

describe("POST /api/auth/login", () => {
  it("should login successfully with valid credentials", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        email: "login@example.com",
        password: "password123",
        firstName: "Arash",
        lastName: "Aghapour",
      });

    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "login@example.com",
        password: "password123",
      });

    expect(response.status).toBe(200);

    expect(response.body).toHaveProperty("accessToken");
    expect(response.body.accessToken).toBeTypeOf("string");

    expect(response.body).toHaveProperty("user");

    expect(response.body.user).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        email: "login@example.com",
        firstName: "Arash",
        lastName: "Aghapour",
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      }),
    );

    expect(response.body.user).not.toHaveProperty("password");
    expect(response.body.user).not.toHaveProperty("passwordHash");
  });

  it("should return 401 when email does not exist", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "not-found@example.com",
        password: "password123",
      });

    expect(response.status).toBe(401);

    expect(response.body).toEqual({
      error: {
        code: "INVALID_CREDENTIALS",
        message: "Invalid email or password",
      },
    });
  });

  it("should return 401 when password is incorrect", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        email: "wrong-password@example.com",
        password: "password123",
        firstName: "Arash",
        lastName: "Aghapour",
      });

    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "wrong-password@example.com",
        password: "wrong-password",
      });

    expect(response.status).toBe(401);

    expect(response.body).toEqual({
      error: {
        code: "INVALID_CREDENTIALS",
        message: "Invalid email or password",
      },
    });
  });

  it("should return the same error structure for unknown email and incorrect password", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        email: "existing@example.com",
        password: "password123",
        firstName: "Arash",
        lastName: "Aghapour",
      });

    const unknownEmailResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: "unknown@example.com",
        password: "password123",
      });

    const wrongPasswordResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: "existing@example.com",
        password: "wrong-password",
      });

    expect(unknownEmailResponse.status).toBe(401);
    expect(wrongPasswordResponse.status).toBe(401);

    expect(unknownEmailResponse.body).toEqual(
      wrongPasswordResponse.body,
    );
  });

  it("should not reveal whether the user exists", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        email: "existing-user@example.com",
        password: "password123",
        firstName: "Arash",
        lastName: "Aghapour",
      });

    const unknownEmailResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: "unknown-user@example.com",
        password: "password123",
      });

    const wrongPasswordResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: "existing-user@example.com",
        password: "wrong-password",
      });

    expect(unknownEmailResponse.status).toBe(
      wrongPasswordResponse.status,
    );

    expect(unknownEmailResponse.body.error.code).toBe(
      wrongPasswordResponse.body.error.code,
    );

    expect(unknownEmailResponse.body.error.message).toBe(
      wrongPasswordResponse.body.error.message,
    );
  });

  it("should return 400 when email is missing", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        password: "password123",
      });

    expect(response.status).toBe(400);
  });

  it("should return 400 when email is invalid", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "invalid-email",
        password: "password123",
      });

    expect(response.status).toBe(400);
  });

  it("should return 400 when password is missing", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "user@example.com",
      });

    expect(response.status).toBe(400);
  });

  it("should login successfully with different email casing", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        email: "user@example.com",
        password: "password123",
        firstName: "Arash",
        lastName: "Aghapour",
      });

    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "USER@EXAMPLE.COM",
        password: "password123",
      });

    expect(response.status).toBe(200);

    expect(response.body).toHaveProperty("accessToken");
    expect(response.body.user.email).toBe("user@example.com");
  });

  it("should return a valid JWT access token", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        email: "jwt@example.com",
        password: "password123",
        firstName: "Arash",
        lastName: "Aghapour",
      });

    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "jwt@example.com",
        password: "password123",
      });

    expect(response.status).toBe(200);

    const token = response.body.accessToken;

    const { payload } = await jwtVerify(token, secret);

    expect(payload).toBeDefined();
  });

  it("should have a valid JWT signature", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        email: "signature@example.com",
        password: "password123",
        firstName: "Arash",
        lastName: "Aghapour",
      });

    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "signature@example.com",
        password: "password123",
      });

    const token = response.body.accessToken;

    await expect(jwtVerify(token, secret)).resolves.toBeDefined();
  });

  it("should set sub to the user id", async () => {
    const registerResponse = await request(app)
      .post("/api/auth/register")
      .send({
        email: "subject@example.com",
        password: "password123",
        firstName: "Arash",
        lastName: "Aghapour",
      });

    const userId = registerResponse.body.user.id;

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: "subject@example.com",
        password: "password123",
      });

    const token = loginResponse.body.accessToken;

    const { payload } = await jwtVerify(token, secret);

    expect(payload.sub).toBe(userId.toString());
  });

  it("should contain an expiration time", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        email: "expiration@example.com",
        password: "password123",
        firstName: "Arash",
        lastName: "Aghapour",
      });

    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "expiration@example.com",
        password: "password123",
      });

    const token = response.body.accessToken;

    const { payload } = await jwtVerify(token, secret);

    expect(payload.exp).toBeTypeOf("number");
    expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it("should not contain sensitive information in the JWT payload", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        email: "sensitive@example.com",
        password: "password123",
        firstName: "Arash",
        lastName: "Aghapour",
      });

    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "sensitive@example.com",
        password: "password123",
      });

    const token = response.body.accessToken;

    const { payload } = await jwtVerify(token, secret);

    expect(payload).not.toHaveProperty("password");
    expect(payload).not.toHaveProperty("passwordHash");
  });

    it("should return a refresh token", async () => {
      await request(app)
        .post("/api/auth/register")
        .send({
          email: "refresh-response@example.com",
          password: "password123",
          firstName: "Arash",
          lastName: "Aghapour",
        });
  
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "refresh-response@example.com",
          password: "password123",
        });
  
      expect(response.status).toBe(200);
      expect(response.body.refreshToken).toBeTypeOf("string");
    });
  
    it("should create a refresh token record in the database", async () => {
      const registerResponse = await request(app)
        .post("/api/auth/register")
        .send({
          email: "refresh-database@example.com",
          password: "password123",
          firstName: "Arash",
          lastName: "Aghapour",
        });
  
      const userId = registerResponse.body.user.id;
  
      const loginResponse = await request(app)
        .post("/api/auth/login")
        .send({
          email: "refresh-database@example.com",
          password: "password123",
        });
  
      expect(loginResponse.status).toBe(200);
  
      const refreshToken = loginResponse.body.refreshToken;
  
      const tokenHash = hashRefreshToken(refreshToken);
  
      const refreshTokenRecord =
        await prisma.refreshToken.findUnique({
          where: {
            tokenHash,
          },
        });
  
      expect(refreshTokenRecord).not.toBeNull();
      expect(refreshTokenRecord?.userId).toBe(userId);
      expect(refreshTokenRecord?.tokenHash).toBe(tokenHash);
      expect(refreshTokenRecord?.revokedAt).toBeNull();
      expect(refreshTokenRecord?.expiresAt).toBeInstanceOf(Date);
      expect(
        refreshTokenRecord?.expiresAt.getTime(),
      ).toBeGreaterThan(Date.now());
    });
});