import { SignJWT } from "jose";

import { env } from "../config/env.js";

const secret = new TextEncoder().encode(env.jwtAccessSecret);

export const generateAccessToken = async (userId: number) => {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId.toString())
    .setIssuedAt()
    .setExpirationTime(env.accessTokenExpiresIn)
    .sign(secret);
};