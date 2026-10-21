import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { MemoryRouter, useRoutes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

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

vi.mock("../features/categories/api/categories.queries", () => ({
  fetchCategories: vi.fn().mockResolvedValue([]),
  fetchCategory: vi.fn(),
  createCategoryMutation: vi.fn(),
  updateCategoryMutation: vi.fn(),
  deleteCategoryMutation: vi.fn(),
}));

vi.mock("../features/transactions/api/transactions.queries", () => ({
  fetchTransactions: vi.fn().mockResolvedValue({
    data: [],
    pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  }),
  fetchTransaction: vi.fn(),
  createTransactionMutation: vi.fn(),
  updateTransactionMutation: vi.fn(),
  deleteTransactionMutation: vi.fn(),
}));

function RoutesProbe() {
  return useRoutes(routes);
}

function renderRoutes(path: string, status: AuthStatus) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  });

  return renderWithAuth(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <RoutesProbe />
      </MemoryRouter>
    </QueryClientProvider>,
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

  it("renders the categories page at /categories", async () => {
    renderRoutes("/categories", "authenticated");

    expect(
      await screen.findByRole("heading", { name: "Categories", level: 1 }),
    ).toBeInTheDocument();
  });

  it("renders the transactions page at /transactions", async () => {
    renderRoutes("/transactions", "authenticated");

    expect(
      await screen.findByRole("heading", { name: "Transactions", level: 1 }),
    ).toBeInTheDocument();
  });

  it("redirects unauthenticated users away from transactions", () => {
    renderRoutes("/transactions", "unauthenticated");

    expect(
      screen.getByRole("heading", { name: "Sign in", level: 1 }),
    ).toBeInTheDocument();
  });

  it("redirects unauthenticated users away from categories", () => {
    renderRoutes("/categories", "unauthenticated");

    expect(
      screen.getByRole("heading", { name: "Sign in", level: 1 }),
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
