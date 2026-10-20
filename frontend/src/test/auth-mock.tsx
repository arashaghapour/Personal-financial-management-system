import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { vi } from "vitest";

import { AuthContext } from "../features/auth/auth-context";
import type { AuthContextValue, AuthStatus } from "../features/auth/auth-context";
import type { PublicUser } from "../features/auth/types";

export const mockUser: PublicUser = {
  id: 42,
  email: "user@example.com",
  firstName: "Arash",
  lastName: "Aghapour",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

export const createAuthValue = (
  overrides: Partial<AuthContextValue> = {},
): AuthContextValue => ({
  status: "unauthenticated",
  user: null,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  ...overrides,
});

/** Renders a component tree with a mocked authentication context. */
export const renderWithAuth = (
  ui: ReactElement,
  auth: Partial<AuthContextValue> = {},
) =>
  render(
    <AuthContext.Provider value={createAuthValue(auth)}>
      {ui}
    </AuthContext.Provider>,
  );

export const authenticated = (): Partial<AuthContextValue> => ({
  status: "authenticated",
  user: mockUser,
});

export const loadingAuth = (): Partial<AuthContextValue> => ({
  status: "loading",
  user: null,
});

export type { AuthStatus };
