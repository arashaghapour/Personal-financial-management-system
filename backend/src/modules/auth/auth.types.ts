export type User = {
  id: number;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
  updatedAt: Date;
};

export type PublicUser = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
  updatedAt: Date;
};

export type RegisterRequest = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};

export type RegisterResponse = {
  user: PublicUser;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
};


export type RefreshToken = {
  id: number;
  userId: number;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  revokedAt: Date | null;
};


export type RefreshRequest = {
  refreshToken: string;
};

export type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
};

export type AccessTokenPayload = {
  sub: string;
  iat?: number;
  exp?: number;
};


export type AuthenticatedUser = {
  id: string;
};