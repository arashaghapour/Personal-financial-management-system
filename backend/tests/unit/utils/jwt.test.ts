import { describe, expect, it } from "vitest";
import { jwtVerify } from "jose";

import { env } from "../../../src/config/env.js";
import { generateAccessToken } from "../../../src/utils/jwt.js";

describe("jwt", () => {
  it("should generate a valid access token", async () => {
    const token = await generateAccessToken(1);

    const secret = new TextEncoder().encode(env.jwtAccessSecret);

    const { payload } = await jwtVerify(token, secret);

    expect(payload).toBeDefined();
  });

  it("should set the correct subject", async () => {
    const token = await generateAccessToken(123);

    const secret = new TextEncoder().encode(env.jwtAccessSecret);

    const { payload } = await jwtVerify(token, secret);

    expect(payload.sub).toBe("123");
  });

  it("should set issued at and expiration time", async () => {
    const token = await generateAccessToken(1);

    const secret = new TextEncoder().encode(env.jwtAccessSecret);

    const { payload } = await jwtVerify(token, secret);

    expect(payload.iat).toBeTypeOf("number");
    expect(payload.exp).toBeTypeOf("number");
    expect(payload.exp).toBeGreaterThan(payload.iat!);
  });

  it("should not include password or passwordHash", async () => {
    const token = await generateAccessToken(1);

    const secret = new TextEncoder().encode(env.jwtAccessSecret);

    const { payload } = await jwtVerify(token, secret);

    expect(payload).not.toHaveProperty("password");
    expect(payload).not.toHaveProperty("passwordHash");
  });
});