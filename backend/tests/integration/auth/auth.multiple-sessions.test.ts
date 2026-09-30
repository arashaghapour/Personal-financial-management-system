import { describe, expect, it } from "vitest";
import request from "supertest";

import app from "../../../src/app.js";
import { prisma } from "../../../src/lib/prisma.js";
import { hashRefreshToken } from "../../../src/modules/auth/refresh-token.utils.js";

describe("Multiple refresh token sessions", () => {
  it("should revoke only the logged-out session", async () => {
    await request(app).post("/api/auth/register").send({
      email: "multi@example.com",
      password: "Password123!",
      firstName: "Multi",
      lastName: "Session",
    });

    const loginA = await request(app).post("/api/auth/login").send({
      email: "multi@example.com",
      password: "Password123!",
    });

    const loginB = await request(app).post("/api/auth/login").send({
      email: "multi@example.com",
      password: "Password123!",
    });

    expect(loginA.status).toBe(200);
    expect(loginB.status).toBe(200);

    const accessTokenA = loginA.body.accessToken;
    const refreshTokenA = loginA.body.refreshToken;
    const refreshTokenB = loginB.body.refreshToken;

    expect(refreshTokenA).not.toBe(refreshTokenB);

    const logoutResponse = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${accessTokenA}`)
      .send({
        refreshToken: refreshTokenA,
      });

    expect(logoutResponse.status).toBe(204);

    const tokenA = await prisma.refreshToken.findUnique({
      where: {
        tokenHash: hashRefreshToken(refreshTokenA),
      },
    });

    const tokenB = await prisma.refreshToken.findUnique({
      where: {
        tokenHash: hashRefreshToken(refreshTokenB),
      },
    });

    expect(tokenA).not.toBeNull();
    expect(tokenB).not.toBeNull();

    expect(tokenA?.revokedAt).not.toBeNull();
    expect(tokenB?.revokedAt).toBeNull();

    const refreshA = await request(app).post("/api/auth/refresh").send({
      refreshToken: refreshTokenA,
    });

    expect(refreshA.status).toBe(401);

    const refreshB = await request(app).post("/api/auth/refresh").send({
      refreshToken: refreshTokenB,
    });

    expect(refreshB.status).toBe(200);
  });
});
