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
};

