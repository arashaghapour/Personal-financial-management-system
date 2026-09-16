import { beforeEach, describe, expect, it, vi } from "vitest";
import { errorCodes } from "../../src/constants/error-codes.js";
import * as authRepositoryModule from "../../src/modules/auth/auth.repository.js";
import * as passwordHasher from "../../src/modules/auth/password-hasher.js";
import { register } from "../../src/modules/auth/auth.service.js";
import type {
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

const hashPassword = vi.spyOn(passwordHasher, "hashPassword");

const registerData: RegisterRequest = {
  email: "  User@Example.COM  ",
  password: "password123",
  firstName: "Arash",
  lastName: "Aghapour",
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
});