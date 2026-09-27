import { beforeEach, describe, expect, it, vi } from "vitest";

import { errorCodes } from "../../../src/constants/error-codes.js";

import * as authRepositoryModule from "../../../src/modules/auth/auth.repository.js";

import * as passwordHasher from "../../../src/modules/auth/password-hasher.js";

import * as refreshTokenUtils from "../../../src/modules/auth/refresh-token.utils.js";

import * as jwt from "../../../src/utils/jwt.js";

import {
  register,
  login,
  refresh,
  logout,
} from "../../../src/modules/auth/auth.service.js";

import type {
  LoginRequest,
  RegisterRequest,
  User,
} from "../../../src/modules/auth/auth.types.js";

const findByEmail = vi.spyOn(
  authRepositoryModule.authRepository,
  "findByEmail",
);

const findById = vi.spyOn(
  authRepositoryModule.authRepository,
  "findById",
);

const create = vi.spyOn(
  authRepositoryModule.authRepository,
  "create",
);

const createRefreshToken = vi.spyOn(
  authRepositoryModule.authRepository,
  "createRefreshToken",
);

const findActiveRefreshToken = vi.spyOn(
  authRepositoryModule.authRepository,
  "findActiveRefreshToken",
);

const findRefreshToken = vi.spyOn(
  authRepositoryModule.authRepository,
  "findRefreshToken",
);

const revokeRefreshToken = vi.spyOn(
  authRepositoryModule.authRepository,
  "revokeRefreshToken",
);

const rotateRefreshToken = vi.spyOn(
  authRepositoryModule.authRepository,
  "rotateRefreshToken",
);

const hashPassword = vi.spyOn(
  passwordHasher,
  "hashPassword",
);

const verifyPassword = vi.spyOn(
  passwordHasher,
  "verifyPassword",
);

const hashRefreshToken = vi.spyOn(
  refreshTokenUtils,
  "hashRefreshToken",
);

const verifyRefreshToken = vi.spyOn(
  jwt,
  "verifyRefreshToken",
);

const generateAccessToken = vi.spyOn(
  jwt,
  "generateAccessToken",
);

const generateRefreshToken = vi.spyOn(
  jwt,
  "generateRefreshToken",
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

      expect(findByEmail).toHaveBeenCalledWith(
        "user@example.com",
      );
    });

    it("should throw EMAIL_ALREADY_EXISTS for duplicate email", async () => {
      findByEmail.mockResolvedValue(user);

      await expect(
        register(registerData),
      ).rejects.toMatchObject({
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

      expect(hashPassword).toHaveBeenCalledWith(
        "password123",
      );
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

      expect(result.user).not.toHaveProperty(
        "passwordHash",
      );
    });
  });

  describe("login", () => {
    it("should login successfully and return both tokens", async () => {
      findByEmail.mockResolvedValue(user);
      verifyPassword.mockResolvedValue(true);
      hashRefreshToken.mockReturnValue(
        "hashed-refresh-token",
      );

      createRefreshToken.mockResolvedValue({
        id: 1,
        userId: user.id,
        tokenHash: "hashed-refresh-token",
        expiresAt: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ),
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
      hashRefreshToken.mockReturnValue(
        "hashed-refresh-token",
      );

      createRefreshToken.mockResolvedValue({
        id: 1,
        userId: user.id,
        tokenHash: "hashed-refresh-token",
        expiresAt: new Date(),
        createdAt: new Date(),
        revokedAt: null,
      });

      await login(loginData);

      expect(findByEmail).toHaveBeenCalledWith(
        "user@example.com",
      );
    });

    it("should verify the password", async () => {
      findByEmail.mockResolvedValue(user);
      verifyPassword.mockResolvedValue(true);
      hashRefreshToken.mockReturnValue(
        "hashed-refresh-token",
      );

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
      hashRefreshToken.mockReturnValue(
        "hashed-refresh-token",
      );

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
      hashRefreshToken.mockReturnValue(
        "hashed-refresh-token",
      );

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

      await expect(
        login(loginData),
      ).rejects.toMatchObject({
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

      await expect(
        login(loginData),
      ).rejects.toMatchObject({
        statusCode: 401,
        code: errorCodes.INVALID_CREDENTIALS,
        message: "Invalid email or password",
      });

      expect(createRefreshToken).not.toHaveBeenCalled();
    });

    it("should not return passwordHash", async () => {
      findByEmail.mockResolvedValue(user);
      verifyPassword.mockResolvedValue(true);
      hashRefreshToken.mockReturnValue(
        "hashed-refresh-token",
      );

      createRefreshToken.mockResolvedValue({
        id: 1,
        userId: user.id,
        tokenHash: "hashed-refresh-token",
        expiresAt: new Date(),
        createdAt: new Date(),
        revokedAt: null,
      });

      const result = await login(loginData);

      expect(result.user).not.toHaveProperty(
        "passwordHash",
      );
    });
  });

  describe("refresh", () => {
    const refreshRequest = {
      refreshToken: "refresh-token",
    };

    beforeEach(() => {
      findById.mockResolvedValue(user);

      findActiveRefreshToken.mockResolvedValue({
        id: 1,
        userId: user.id,
        tokenHash: "hashed-refresh-token",
        expiresAt: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ),
        createdAt: new Date(),
        revokedAt: null,
      });

      verifyRefreshToken
        .mockResolvedValueOnce({
          payload: {
            sub: String(user.id),
          },
        })
        .mockResolvedValueOnce({
          payload: {
            sub: String(user.id),
            exp:
              Math.floor(Date.now() / 1000) +
              7 * 24 * 60 * 60,
          },
        });

      hashRefreshToken.mockReturnValue(
        "hashed-refresh-token",
      );

      generateAccessToken.mockResolvedValue(
        "new-access-token",
      );

      generateRefreshToken.mockResolvedValue(
        "new-refresh-token",
      );

      rotateRefreshToken.mockResolvedValue({
        id: 2,
        userId: user.id,
        tokenHash: "new-hashed-refresh-token",
        expiresAt: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ),
        createdAt: new Date(),
        revokedAt: null,
      });
    });

    it("should refresh successfully", async () => {
      const result = await refresh(refreshRequest);

      expect(result).toEqual({
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
      });
    });

    it("should verify the refresh token", async () => {
      await refresh(refreshRequest);

      expect(verifyRefreshToken).toHaveBeenCalledWith(
        "refresh-token",
      );
    });

    it("should find the active refresh token", async () => {
      await refresh(refreshRequest);

      expect(
        findActiveRefreshToken,
      ).toHaveBeenCalledWith(
        "hashed-refresh-token",
      );
    });

    it("should find the user", async () => {
      await refresh(refreshRequest);

      expect(findById).toHaveBeenCalledWith(user.id);
    });

    it("should rotate the refresh token", async () => {
      await refresh(refreshRequest);

      expect(
        rotateRefreshToken,
      ).toHaveBeenCalledWith({
        oldTokenId: 1,
        userId: user.id,
        tokenHash: expect.any(String),
        expiresAt: expect.any(Date),
      });
    });

    it("should throw INVALID_REFRESH_TOKEN when token is invalid", async () => {
      verifyRefreshToken.mockReset();
    
      verifyRefreshToken.mockRejectedValueOnce(
        new Error("Invalid token"),
      );
    
      await expect(
        refresh(refreshRequest),
      ).rejects.toMatchObject({
        statusCode: 401,
        code: errorCodes.INVALID_REFRESH_TOKEN,
        message: "Invalid refresh token",
      });
    
      expect(findActiveRefreshToken).not.toHaveBeenCalled();
    });

    it("should throw INVALID_REFRESH_TOKEN when active session does not exist", async () => {
      findActiveRefreshToken.mockResolvedValue(null);

      await expect(
        refresh(refreshRequest),
      ).rejects.toMatchObject({
        statusCode: 401,
        code: errorCodes.INVALID_REFRESH_TOKEN,
        message: "Invalid refresh token",
      });

      expect(findById).not.toHaveBeenCalled();
      expect(
        rotateRefreshToken,
      ).not.toHaveBeenCalled();
    });

    it("should throw INVALID_REFRESH_TOKEN when session belongs to another user", async () => {
      findActiveRefreshToken.mockResolvedValue({
        id: 1,
        userId: 999,
        tokenHash: "hashed-refresh-token",
        expiresAt: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ),
        createdAt: new Date(),
        revokedAt: null,
      });

      await expect(
        refresh(refreshRequest),
      ).rejects.toMatchObject({
        statusCode: 401,
        code: errorCodes.INVALID_REFRESH_TOKEN,
        message: "Invalid refresh token",
      });

      expect(findById).not.toHaveBeenCalled();
      expect(
        rotateRefreshToken,
      ).not.toHaveBeenCalled();
    });

    it("should throw INVALID_REFRESH_TOKEN when user does not exist", async () => {
      findById.mockResolvedValue(null);

      await expect(
        refresh(refreshRequest),
      ).rejects.toMatchObject({
        statusCode: 401,
        code: errorCodes.INVALID_REFRESH_TOKEN,
        message: "Invalid refresh token",
      });

      expect(
        rotateRefreshToken,
      ).not.toHaveBeenCalled();
    });
  });

  describe("logout", () => {
    const refreshToken = "refresh-token";

    beforeEach(() => {
      hashRefreshToken.mockReturnValue(
        "hashed-refresh-token",
      );

      findRefreshToken.mockResolvedValue({
        id: 1,
        userId: user.id,
        tokenHash: "hashed-refresh-token",
        expiresAt: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ),
        createdAt: new Date(),
        revokedAt: null,
      });

      revokeRefreshToken.mockResolvedValue({
        id: 1,
        userId: user.id,
        tokenHash: "hashed-refresh-token",
        expiresAt: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ),
        createdAt: new Date(),
        revokedAt: new Date(),
      });
    });

    it("should logout successfully", async () => {
      await logout(user.id, refreshToken);

      expect(revokeRefreshToken).toHaveBeenCalledWith(1);
    });

    it("should hash the refresh token", async () => {
      await logout(user.id, refreshToken);

      expect(hashRefreshToken).toHaveBeenCalledWith(
        refreshToken,
      );
    });

    it("should find the refresh token session", async () => {
      await logout(user.id, refreshToken);

      expect(findRefreshToken).toHaveBeenCalledWith(
        "hashed-refresh-token",
      );
    });

    it("should do nothing when refresh token does not exist", async () => {
      findRefreshToken.mockResolvedValue(null);

      await expect(
        logout(user.id, refreshToken),
      ).resolves.toBeUndefined();

      expect(
        revokeRefreshToken,
      ).not.toHaveBeenCalled();
    });

    it("should not revoke another user's session", async () => {
      findRefreshToken.mockResolvedValue({
        id: 1,
        userId: 999,
        tokenHash: "hashed-refresh-token",
        expiresAt: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ),
        createdAt: new Date(),
        revokedAt: null,
      });

      await expect(
        logout(user.id, refreshToken),
      ).resolves.toBeUndefined();

      expect(
        revokeRefreshToken,
      ).not.toHaveBeenCalled();
    });

    it("should do nothing when refresh token is already revoked", async () => {
      findRefreshToken.mockResolvedValue({
        id: 1,
        userId: user.id,
        tokenHash: "hashed-refresh-token",
        expiresAt: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ),
        createdAt: new Date(),
        revokedAt: new Date(),
      });

      await expect(
        logout(user.id, refreshToken),
      ).resolves.toBeUndefined();

      expect(
        revokeRefreshToken,
      ).toHaveBeenCalledWith(1);
    });
  });
});