import dotenv from "dotenv";

dotenv.config();

const port = Number(process.env.PORT) || 3000;

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not defined");
}

const jwtAccessSecret = process.env.JWT_ACCESS_SECRET;

if (!jwtAccessSecret) {
  throw new Error("JWT_ACCESS_SECRET is not defined");
}

const accessTokenExpiresIn = process.env.ACCESS_TOKEN_EXPIRES_IN;

if (!accessTokenExpiresIn) {
  throw new Error("ACCESS_TOKEN_EXPIRES_IN is not defined");
}

const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;

if (!jwtRefreshSecret) {
  throw new Error("JWT_REFRESH_SECRET is not defined");
}

const refreshTokenExpiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN;

if (!refreshTokenExpiresIn) {
  throw new Error("REFRESH_TOKEN_EXPIRES_IN is not defined");
}

export const env = {
  port,
  databaseUrl,
  jwtAccessSecret,
  accessTokenExpiresIn,
  jwtRefreshSecret,
  refreshTokenExpiresIn,
};