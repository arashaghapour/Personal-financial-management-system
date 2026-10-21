import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { MemoryRouter, useRoutes } from "react-router-dom";

import { routes } from "./router";

import {
  authenticated,
  renderWithAuth,
  type AuthStatus,
} from "../test/auth-mock";

vi.mock("../features/accounts/api/accounts.queries", () => ({
  fetchAccounts: vi.fn().mockResolvedValue([]),
  fetchAccount: vi.fn(),
  createAccountMutation: vi.fn(),
  updateAccountMutation: vi.fn(),
  deleteAccountMutation: vi.fn(),
}));

function RoutesProbe() {
  return useRoutes(routes);
}

function renderRoutes(path: string, status: AuthStatus) {
  return renderWithAuth(
    <MemoryRouter initialEntries={[path]}>
      <RoutesProbe />
    </MemoryRouter>,
    status === "authenticated"
      ? authenticated()
      : { status, user: null },
  );
}

describe("router configuration", () => {
  it("redirects the root route to the dashboard", async () => {
    renderRoutes("/", "authenticated");

    expect(
      await screen.findByRole("heading", { name: "Dashboard", level: 1 }),
    ).toBeInTheDocument();
  });

  it("renders the dashboard page at /dashboard", () => {
    renderRoutes("/dashboard", "authenticated");

    expect(
      screen.getByRole("heading", { name: "Dashboard", level: 1 }),
    ).toBeInTheDocument();
  });

  it("renders the accounts page at /accounts", async () => {
    renderRoutes("/accounts", "authenticated");

    expect(
      await screen.findByRole("heading", { name: "Accounts", level: 1 }),
    ).toBeInTheDocument();
  });

  it("redirects unauthenticated users away from accounts", () => {
    renderRoutes("/accounts", "unauthenticated");

    expect(
      screen.getByRole("heading", { name: "Sign in", level: 1 }),
    ).toBeInTheDocument();
  });

  it("renders the login page at /login", () => {
    renderRoutes("/login", "unauthenticated");

    expect(
      screen.getByRole("heading", { name: "Sign in", level: 1 }),
    ).toBeInTheDocument();
  });

  it("renders the register page at /register", () => {
    renderRoutes("/register", "unauthenticated");

    expect(
      screen.getByRole("heading", { name: "Create account", level: 1 }),
    ).toBeInTheDocument();
  });

  it("renders the not-found page for unknown routes", () => {
    renderRoutes("/unknown-route", "unauthenticated");

    expect(
      screen.getByRole("heading", { name: "Page not found", level: 1 }),
    ).toBeInTheDocument();
  });

  it("redirects unauthenticated users away from the dashboard", () => {
    renderRoutes("/dashboard", "unauthenticated");

    expect(
      screen.getByRole("heading", { name: "Sign in", level: 1 }),
    ).toBeInTheDocument();
  });

  it("redirects authenticated users away from the login page", () => {
    renderRoutes("/login", "authenticated");

    expect(
      screen.getByRole("heading", { name: "Dashboard", level: 1 }),
    ).toBeInTheDocument();
  });
});
