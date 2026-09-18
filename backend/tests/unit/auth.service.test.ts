import { beforeEach, describe, expect, it, vi } from "vitest";

import { errorCodes } from "../../src/constants/error-codes.js";

import * as authRepositoryModule from "../../src/modules/auth/auth.repository.js";

import * as passwordHasher from "../../src/modules/auth/password-hasher.js";

import * as refreshTokenUtils from "../../src/modules/auth/refresh-token.utils.js";

import { register, login } from "../../src/modules/auth/auth.service.js";

import type {
  LoginRequest,
  RegisterRequest,
  User,
} from "../../src/modules/auth/auth.types.js";

const findByEmail = vi.spyOn(
  authRepositoryModule.authRepository,
  "findByEmail",
);

const create = vi.spyOn(
  authRepositoryModule.authRepository,
  "create",
);

const createRefreshToken = vi.spyOn(
  authRepositoryModule.authRepository,
  "createRefreshToken",
);

const hashPassword = vi.spyOn(passwordHasher, "hashPassword");

const verifyPassword = vi.spyOn(passwordHasher, "verifyPassword");

const hashRefreshToken = vi.spyOn(
  refreshTokenUtils,
  "hashRefreshToken",
);

const registerData: RegisterRequest = {
  email: "  User@Example.COM  ",
  password: "password123",
  firstName: "Arash",
  lastName: "Aghapour",
};

const loginData: LoginRequest = {
  email: "  User@Example.COM  ",
  password: "password123",
};

const user: User = {
  id: 1,
  email: "user@example.com",
  passwordHash: "hashed-password",
  firstName: "Arash",
  lastName: "Aghapour",
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("auth.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("register", () => {
    it("should register a user successfully", async () => {
      findByEmail.mockResolvedValue(null);
      hashPassword.mockResolvedValue("hashed-password");
      create.mockResolvedValue(user);

      const result = await register(registerData);

      expect(result.user).toEqual({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
    });

    it("should normalize the email", async () => {
      findByEmail.mockResolvedValue(null);
      hashPassword.mockResolvedValue("hashed-password");
      create.mockResolvedValue(user);

      await register(registerData);

      expect(findByEmail).toHaveBeenCalledWith("user@example.com");
    });

    it("should throw EMAIL_ALREADY_EXISTS for duplicate email", async () => {
      findByEmail.mockResolvedValue(user);

      await expect(register(registerData)).rejects.toMatchObject({
        statusCode: 409,
        code: errorCodes.EMAIL_ALREADY_EXISTS,
      });

      expect(hashPassword).not.toHaveBeenCalled();
      expect(create).not.toHaveBeenCalled();
    });

    it("should hash the password", async () => {
      findByEmail.mockResolvedValue(null);
      hashPassword.mockResolvedValue("hashed-password");
      create.mockResolvedValue(user);

      await register(registerData);

      expect(hashPassword).toHaveBeenCalledWith("password123");
    });

    it("should create the user with the hashed password", async () => {
      findByEmail.mockResolvedValue(null);
      hashPassword.mockResolvedValue("hashed-password");
      create.mockResolvedValue(user);

      await register(registerData);

      expect(create).toHaveBeenCalledWith({
        email: "user@example.com",
        passwordHash: "hashed-password",
        firstName: "Arash",
        lastName: "Aghapour",
      });
    });

    it("should return a public user without passwordHash", async () => {
      findByEmail.mockResolvedValue(null);
      hashPassword.mockResolvedValue("hashed-password");
      create.mockResolvedValue(user);

      const result = await register(registerData);

      expect(result.user).not.toHaveProperty("passwordHash");
    });
  });

  describe("login", () => {
    it("should login successfully and return both tokens", async () => {
      findByEmail.mockResolvedValue(user);
      verifyPassword.mockResolvedValue(true);
      hashRefreshToken.mockReturnValue("hashed-refresh-token");
      createRefreshToken.mockResolvedValue({
        id: 1,
        userId: user.id,
        tokenHash: "hashed-refresh-token",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        revokedAt: null,
      });

      const result = await login(loginData);

      expect(result.user).toEqual({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });

      expect(result.accessToken).toBeTypeOf("string");
      expect(result.refreshToken).toBeTypeOf("string");
    });

    it("should normalize the email", async () => {
      findByEmail.mockResolvedValue(user);
      verifyPassword.mockResolvedValue(true);
      hashRefreshToken.mockReturnValue("hashed-refresh-token");
      createRefreshToken.mockResolvedValue({
        id: 1,
        userId: user.id,
        tokenHash: "hashed-refresh-token",
        expiresAt: new Date(),
        createdAt: new Date(),
        revokedAt: null,
      });

      await login(loginData);

      expect(findByEmail).toHaveBeenCalledWith("user@example.com");
    });

    it("should verify the password", async () => {
      findByEmail.mockResolvedValue(user);
      verifyPassword.mockResolvedValue(true);
      hashRefreshToken.mockReturnValue("hashed-refresh-token");
      createRefreshToken.mockResolvedValue({
        id: 1,
        userId: user.id,
        tokenHash: "hashed-refresh-token",
        expiresAt: new Date(),
        createdAt: new Date(),
        revokedAt: null,
      });

      await login(loginData);

      expect(verifyPassword).toHaveBeenCalledWith(
        "password123",
        "hashed-password",
      );
    });

    it("should hash the refresh token", async () => {
      findByEmail.mockResolvedValue(user);
      verifyPassword.mockResolvedValue(true);
      hashRefreshToken.mockReturnValue("hashed-refresh-token");
      createRefreshToken.mockResolvedValue({
        id: 1,
        userId: user.id,
        tokenHash: "hashed-refresh-token",
        expiresAt: new Date(),
        createdAt: new Date(),
        revokedAt: null,
      });

      await login(loginData);

      expect(hashRefreshToken).toHaveBeenCalledWith(
        expect.any(String),
      );
    });

    it("should store the refresh token record", async () => {
      findByEmail.mockResolvedValue(user);
      verifyPassword.mockResolvedValue(true);
      hashRefreshToken.mockReturnValue("hashed-refresh-token");
      createRefreshToken.mockResolvedValue({
        id: 1,
        userId: user.id,
        tokenHash: "hashed-refresh-token",
        expiresAt: new Date(),
        createdAt: new Date(),
        revokedAt: null,
      });

      await login(loginData);

      expect(createRefreshToken).toHaveBeenCalledWith({
        userId: user.id,
        tokenHash: "hashed-refresh-token",
        expiresAt: expect.any(Date),
      });
    });

    it("should throw INVALID_CREDENTIALS when user does not exist", async () => {
      findByEmail.mockResolvedValue(null);

      await expect(login(loginData)).rejects.toMatchObject({
        statusCode: 401,
        code: errorCodes.INVALID_CREDENTIALS,
        message: "Invalid email or password",
      });

      expect(verifyPassword).not.toHaveBeenCalled();
      expect(createRefreshToken).not.toHaveBeenCalled();
    });

    it("should throw INVALID_CREDENTIALS when password is incorrect", async () => {
      findByEmail.mockResolvedValue(user);
      verifyPassword.mockResolvedValue(false);

      await expect(login(loginData)).rejects.toMatchObject({
        statusCode: 401,
        code: errorCodes.INVALID_CREDENTIALS,
        message: "Invalid email or password",
      });

      expect(createRefreshToken).not.toHaveBeenCalled();
    });

    it("should not return passwordHash", async () => {
      findByEmail.mockResolvedValue(user);
      verifyPassword.mockResolvedValue(true);
      hashRefreshToken.mockReturnValue("hashed-refresh-token");
      createRefreshToken.mockResolvedValue({
        id: 1,
        userId: user.id,
        tokenHash: "hashed-refresh-token",
        expiresAt: new Date(),
        createdAt: new Date(),
        revokedAt: null,
      });

      const result = await login(loginData);

      expect(result.user).not.toHaveProperty("passwordHash");
    });
  });
});
