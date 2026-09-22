import {
  jwtVerify,
  SignJWT,
} from "jose";
import crypto from "node:crypto";

import { env } from "../config/env.js";
import type { AccessTokenPayload } from "../modules/auth/auth.types.js";

const accessSecret = new TextEncoder().encode(
  env.jwtAccessSecret,
);

const refreshSecret = new TextEncoder().encode(
  env.jwtRefreshSecret,
);

export const generateAccessToken = async (userId: number) => {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId.toString())
    .setJti(crypto.randomUUID())
    .setIssuedAt()
    .setExpirationTime(env.accessTokenExpiresIn)
    .sign(accessSecret);
};

export const generateRefreshToken = async (userId: number) => {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId.toString())
    .setJti(crypto.randomUUID())
    .setIssuedAt()
    .setExpirationTime(env.refreshTokenExpiresIn)
    .sign(refreshSecret);
};

export const verifyAccessToken = async (token: string) => {
  return jwtVerify(token, accessSecret);
};

export const verifyRefreshToken = async (token: string) => {
  return jwtVerify(token, refreshSecret);
};

export const parseAccessTokenPayload = (
  payload: Record<string, unknown>,
): AccessTokenPayload => {
  if (
    typeof payload.sub !== "string" ||
    payload.sub.trim() === ""
  ) {
    throw new Error("Invalid access token subject");
  }

  if (typeof payload.iat !== "number") {
    throw new Error("Invalid access token issued-at time");
  }

  if (typeof payload.exp !== "number") {
    throw new Error("Invalid access token expiration time");
  }

  return {
    sub: payload.sub,
    iat: payload.iat,
    exp: payload.exp,
  };
};