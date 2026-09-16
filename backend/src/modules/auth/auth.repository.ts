import type { User } from "./auth.types.js";
import { prisma } from "../../lib/prisma.js";

export type CreateUserData = {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
};

export interface AuthRepository {
  findById(id: number): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: CreateUserData): Promise<User>;
}

export const authRepository: AuthRepository = {
  async findById(id) {
    return prisma.user.findUnique({
      where: { id },
    });
  },

  async findByEmail(email) {
    return prisma.user.findUnique({
      where: { email },
    });
  },

  async create(data) {
    return prisma.user.create({
      data,
    });
  },
};