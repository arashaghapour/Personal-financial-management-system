import type { PublicUser, User } from "./auth.types.js";

export const toPublicUser = (user: User): PublicUser => {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};