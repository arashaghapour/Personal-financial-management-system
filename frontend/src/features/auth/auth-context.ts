import { createContext, useContext } from "react";

import type { LoginRequest, PublicUser, RegisterRequest } from "./types";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export type AuthContextValue = {
  /** Current authentication state used to gate protected routes. */
  status: AuthStatus;
  /** Public information of the authenticated user, if any. */
  user: PublicUser | null;
  /** Authenticates the user and stores the returned tokens. */
  login: (credentials: LoginRequest) => Promise<void>;
  /** Registers a new account. Does not establish a session. */
  register: (data: RegisterRequest) => Promise<void>;
  /** Ends the session locally and revokes the backend refresh token. */
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
