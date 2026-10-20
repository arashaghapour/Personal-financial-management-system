import { describe, expect, it } from "vitest";

import request from "supertest";

import app from "../../../src/app.js";

const credentials = {
  email: "me@example.com",
  password: "password123",
  firstName: "Arash",
  lastName: "Aghapour",
};

const registerAndLogin = async () => {
  await request(app).post("/api/auth/register").send(credentials);

  const loginResponse = await request(app)
    .post("/api/auth/login")
    .send({
      email: credentials.email,
      password: credentials.password,
    });

  return loginResponse.body as {
    accessToken: string;
    refreshToken: string;
    user: {
      id: number;
      email: string;
      firstName: string;
      lastName: string;
    };
  };
};

describe("GET /api/auth/me", () => {
  it("should return the current user for a valid access token", async () => {
    const { accessToken, user } = await registerAndLogin();

    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        id: user.id,
        email: credentials.email,
        firstName: credentials.firstName,
        lastName: credentials.lastName,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      }),
    );
  });

  it("should not expose the password or password hash", async () => {
    const { accessToken } = await registerAndLogin();

    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body).not.toHaveProperty("password");
    expect(response.body).not.toHaveProperty("passwordHash");
  });

  it("should return 401 without an access token", async () => {
    const response = await request(app).get("/api/auth/me");

    expect(response.status).toBe(401);

    expect(response.body).toEqual({
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required",
      },
    });
  });

  it("should return 401 for an invalid access token", async () => {
    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer invalid-token");

    expect(response.status).toBe(401);

    expect(response.body).toEqual({
      error: {
        code: "INVALID_ACCESS_TOKEN",
        message: "Invalid access token",
      },
    });
  });

  it("should return the same user as the login response", async () => {
    const { accessToken, user } = await registerAndLogin();

    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(user.id);
    expect(response.body.email).toBe(user.email);
  });
});
