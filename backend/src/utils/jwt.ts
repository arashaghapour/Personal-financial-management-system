import {
  jwtVerify,
  SignJWT,
  type JWTPayload,
} from "jose";

import { env } from "../config/env.js";

import crypto from "node:crypto";

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