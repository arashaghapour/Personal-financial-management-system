import { errorCodes } from "../../constants/error-codes.js";
import { AppError } from "../../utils/app-error.js";
import * as authRepositoryModule from "./auth.repository.js";
import { normalizeEmail } from "./auth.utils.js";
import { toPublicUser } from "./auth.mapper.js";
import * as passwordHasher from "./password-hasher.js";
import type {
  RegisterRequest,
  RegisterResponse,
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