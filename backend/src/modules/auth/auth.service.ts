import { errorCodes } from "../../constants/error-codes.js";

import { AppError } from "../../utils/app-error.js";

import * as authRepositoryModule from "./auth.repository.js";

import { normalizeEmail } from "./auth.utils.js";

import { toPublicUser } from "./auth.mapper.js";

import * as passwordHasher from "./password-hasher.js";

import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../utils/jwt.js";

import { hashRefreshToken } from "./refresh-token.utils.js";

import type {
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  RefreshRequest,
  RefreshResponse,
} from "./auth.types.js";

export const register = async (
  data: RegisterRequest,
): Promise<RegisterResponse> => {
  const email = normalizeEmail(data.email);

  const existingUser =
    await authRepositoryModule.authRepository.findByEmail(email);

  if (existingUser) {
    throw new AppError(
      409,
      errorCodes.EMAIL_ALREADY_EXISTS,
      "Email already exists",
    );
  }

  const passwordHash = await passwordHasher.hashPassword(data.password);

  const user = await authRepositoryModule.authRepository.create({
    email,
    passwordHash,
    firstName: data.firstName,
    lastName: data.lastName,
  });

  return {
    user: toPublicUser(user),
  };
};

export const login = async (
  data: LoginRequest,
): Promise<LoginResponse> => {
  const email = normalizeEmail(data.email);

  const user =
    await authRepositoryModule.authRepository.findByEmail(email);

  if (!user) {
    throw new AppError(
      401,
      errorCodes.INVALID_CREDENTIALS,
      "Invalid email or password",
    );
  }

  const passwordValid = await passwordHasher.verifyPassword(
    data.password,
    user.passwordHash,
  );

  if (!passwordValid) {
    throw new AppError(
      401,
      errorCodes.INVALID_CREDENTIALS,
      "Invalid email or password",
    );
  }

  const accessToken = await generateAccessToken(user.id);

  const refreshToken = await generateRefreshToken(user.id);

  const tokenHash = hashRefreshToken(refreshToken);

  const expiresAt = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000,
  );

  await authRepositoryModule.authRepository.createRefreshToken({
    userId: user.id,
    tokenHash,
    expiresAt,
  });

  return {
    user: toPublicUser(user),
    accessToken,
    refreshToken,
  };
};

export const refresh = async (
  data: RefreshRequest,
): Promise<RefreshResponse> => {
  let payload;

  try {
    const result = await verifyRefreshToken(data.refreshToken);
    payload = result.payload;
  } catch {
    throw new AppError(
      401,
      errorCodes.INVALID_REFRESH_TOKEN,
      "Invalid refresh token",
    );
  }

  if (!payload.sub) {
    throw new AppError(
      401,
      errorCodes.INVALID_REFRESH_TOKEN,
      "Invalid refresh token",
    );
  }

  const userId = Number(payload.sub);

  if (!Number.isInteger(userId)) {
    throw new AppError(
      401,
      errorCodes.INVALID_REFRESH_TOKEN,
      "Invalid refresh token",
    );
  }

  const tokenHash = hashRefreshToken(data.refreshToken);

  const storedToken =
    await authRepositoryModule.authRepository.findRefreshToken(
      tokenHash,
    );

  if (!storedToken) {
    throw new AppError(
      401,
      errorCodes.INVALID_REFRESH_TOKEN,
      "Invalid refresh token",
    );
  }

  if (storedToken.revokedAt !== null) {
    throw new AppError(
      401,
      errorCodes.INVALID_REFRESH_TOKEN,
      "Invalid refresh token",
    );
  }

  if (storedToken.expiresAt <= new Date()) {
    throw new AppError(
      401,
      errorCodes.INVALID_REFRESH_TOKEN,
      "Invalid refresh token",
    );
  }

  if (storedToken.userId !== userId) {
    throw new AppError(
      401,
      errorCodes.INVALID_REFRESH_TOKEN,
      "Invalid refresh token",
    );
  }

  const user =
    await authRepositoryModule.authRepository.findById(userId);

  if (!user) {
    throw new AppError(
      401,
      errorCodes.INVALID_REFRESH_TOKEN,
      "Invalid refresh token",
    );
  }

  const accessToken = await generateAccessToken(user.id);

  const refreshToken = await generateRefreshToken(user.id);

  const newTokenHash = hashRefreshToken(refreshToken);

  const newPayload = await verifyRefreshToken(refreshToken);

  if (!newPayload.payload.exp) {
    throw new AppError(
      500,
      errorCodes.INTERNAL_SERVER_ERROR,
      "Internal server error",
    );
  }

  const newExpiresAt = new Date(
    newPayload.payload.exp * 1000,
  );
  console.log({
    sameHash: tokenHash === newTokenHash,
    oldTokenHashLength: tokenHash.length,
    newTokenHashLength: newTokenHash.length,
  });

  await authRepositoryModule.authRepository.rotateRefreshToken({
    oldTokenId: storedToken.id,
    userId: user.id,
    tokenHash: newTokenHash,
    expiresAt: newExpiresAt,
  });

  return {
    accessToken,
    refreshToken,
  };
};