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

vi.mock("../features/dashboard/api/dashboard.queries", () => ({
  fetchDashboard: vi.fn().mockResolvedValue({
    totalBalance: 0,
    totalIncome: 0,
    totalExpenses: 0,
    netCashFlow: 0,
    expenseByCategory: [],
    incomeByCategory: [],
    recentTransactions: [],
  }),
}));

vi.mock("../features/budgets/api/budgets.queries", () => ({
  fetchBudgets: vi.fn().mockResolvedValue([]),
  fetchBudget: vi.fn(),
  fetchBudgetProgress: vi.fn(),
  createBudgetMutation: vi.fn(),
  updateBudgetMutation: vi.fn(),
  deleteBudgetMutation: vi.fn(),
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

vi.mock("../features/reports/api/reports.queries", () => ({
  fetchSummaryReport: vi.fn().mockResolvedValue({
    totalIncome: "0",
    totalExpenses: "0",
    netCashFlow: "0",
    transactionCount: 0,
    incomeTransactionCount: 0,
    expenseTransactionCount: 0,
  }),
  fetchExpenseReport: vi.fn().mockResolvedValue({
    totalExpenses: "0",
    categories: [],
  }),
  fetchCashFlowReport: vi.fn().mockResolvedValue({
    startDate: "",
    endDate: "",
    data: [],
  }),
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

  it("renders the budgets page at /budgets", async () => {
    renderRoutes("/budgets", "authenticated");

    expect(
      await screen.findByRole("heading", { name: "Budgets", level: 1 }),
    ).toBeInTheDocument();
  });

  it("renders the reports page at /reports", async () => {
    renderRoutes("/reports", "authenticated");

    expect(
      await screen.findByRole("heading", { name: "Reports", level: 1 }),
    ).toBeInTheDocument();
  });

  it("renders a specific report at /reports/:reportType", async () => {
    renderRoutes("/reports/cash-flow", "authenticated");

    expect(
      await screen.findByRole("heading", { name: "Cash Flow Report", level: 2 }),
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

  it("redirects unauthenticated users away from budgets", () => {
    renderRoutes("/budgets", "unauthenticated");

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
