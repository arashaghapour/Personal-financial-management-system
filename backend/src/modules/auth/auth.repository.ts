import type { RefreshToken, User } from "./auth.types.js";

import { prisma } from "../../lib/prisma.js";

export type CreateUserData = {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
};

export type CreateRefreshTokenData = {
  userId: number;
  tokenHash: string;
  expiresAt: Date;
};

export type RotateRefreshTokenData = {
  oldTokenId: number;
  userId: number;
  tokenHash: string;
  expiresAt: Date;
};

export interface AuthRepository {
  findById(id: number): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: CreateUserData): Promise<User>;
  createRefreshToken(
    data: CreateRefreshTokenData,
  ): Promise<RefreshToken>;
  findRefreshToken(
    tokenHash: string,
  ): Promise<RefreshToken | null>;
  revokeRefreshToken(id: number): Promise<RefreshToken>;
  rotateRefreshToken(
    data: RotateRefreshTokenData,
  ): Promise<RefreshToken>;
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

  async createRefreshToken(data) {
    return prisma.refreshToken.create({
      data,
    });
  },

  async findRefreshToken(tokenHash) {
    return prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
  },

  async revokeRefreshToken(id) {
    return prisma.refreshToken.update({
      where: { id },
      data: {
        revokedAt: new Date(),
      },
    });
  },

  async rotateRefreshToken(data) {
    return prisma.$transaction(async (tx) => {
      const storedToken = await tx.refreshToken.findUnique({
        where: {
          id: data.oldTokenId,
        },
      });
  
      if (!storedToken) {
        throw new Error("Refresh token not found");
      }
  
      await tx.refreshToken.update({
        where: {
          id: storedToken.id,
        },
        data: {
          revokedAt: new Date(),
        },
      });
  
      return tx.refreshToken.create({
        data: {
          userId: data.userId,
          tokenHash: data.tokenHash,
          expiresAt: data.expiresAt,
        },
      });
    });
  },
};