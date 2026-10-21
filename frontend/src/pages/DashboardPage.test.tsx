import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  fireEvent,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import DashboardPage from "./DashboardPage";

import * as dashboardQueries from "../features/dashboard/api/dashboard.queries";
import * as accountQueries from "../features/accounts/api/accounts.queries";
import * as categoryQueries from "../features/categories/api/categories.queries";

import { dashboardKeys } from "../features/dashboard/api/dashboard.keys";
import { formatCurrency } from "../features/accounts/utils/account-format";
import { ApiError } from "../lib/api/client";
import { authenticated, renderWithAuth } from "../test/auth-mock";

import type { Dashboard } from "../features/dashboard/types";
import type { Account } from "../features/accounts/types";
import type { Category } from "../features/categories/types";
import type { Transaction } from "../features/transactions/types";

vi.mock("../features/dashboard/api/dashboard.queries");
vi.mock("../features/accounts/api/accounts.queries");
vi.mock("../features/categories/api/categories.queries");

const dashboardApi = vi.mocked(dashboardQueries);
const accountsApi = vi.mocked(accountQueries);
const categoriesApi = vi.mocked(categoryQueries);

const checking: Account = {
  id: 1,
  userId: 42,
  name: "Checking",
  type: "BANK",
  balance: "1250.50",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const wallet: Account = {
  id: 2,
  userId: 42,
  name: "Wallet",
  type: "CASH",
  balance: 200,
  createdAt: "2026-01-02T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
};

const accounts = [checking, wallet];

const salaryCategory: Category = {
  id: "11111111-1111-4111-8111-111111111111",
  userId: 42,
  name: "Salary",
  normalizedName: "salary",
  type: "INCOME",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const foodCategory: Category = {
  id: "22222222-2222-4222-8222-222222222222",
  userId: 42,
  name: "Food",
  normalizedName: "food",
  type: "EXPENSE",
  createdAt: "2026-01-02T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
};

const rentCategory: Category = {
  id: "33333333-3333-4333-8333-333333333333",
  userId: 42,
  name: "Rent",
  normalizedName: "rent",
  type: "EXPENSE",
  createdAt: "2026-01-03T00:00:00.000Z",
  updatedAt: "2026-01-03T00:00:00.000Z",
};

const categories = [salaryCategory, foodCategory, rentCategory];

const salaryTransaction: Transaction = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  userId: 42,
  type: "INCOME",
  amount: "2500",
  description: "Monthly salary",
  date: "2026-10-01T00:00:00.000Z",
  accountId: 1,
  categoryId: salaryCategory.id,
  createdAt: "2026-10-01T10:00:00.000Z",
  updatedAt: "2026-10-01T10:00:00.000Z",
};

const groceriesTransaction: Transaction = {
  id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  userId: 42,
  type: "EXPENSE",
  amount: "45.5",
  description: "Groceries",
  date: "2026-09-20T00:00:00.000Z",
  accountId: 2,
  categoryId: foodCategory.id,
  createdAt: "2026-09-20T10:00:00.000Z",
  updatedAt: "2026-09-20T10:00:00.000Z",
};

const makeDashboard = (
  overrides: Partial<Dashboard> = {},
): Dashboard => ({
  totalBalance: 5432.1,
  totalIncome: 2500,
  totalExpenses: 900,
  netCashFlow: 1600,
  incomeByCategory: [
    {
      categoryId: salaryCategory.id,
      categoryName: "Salary",
      total: "2500",
    },
  ],
  expenseByCategory: [
    {
      categoryId: foodCategory.id,
      categoryName: "Food",
      total: "600",
    },
    {
      categoryId: rentCategory.id,
      categoryName: "Rent",
      total: "300",
    },
  ],
  recentTransactions: [groceriesTransaction, salaryTransaction],
  ...overrides,
});

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  });

const renderPage = (queryClient: QueryClient = createQueryClient()) => {
  const result = renderWithAuth(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route
            path="/transactions"
            element={<h1>Transactions page</h1>}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
    authenticated(),
  );

  return { ...result, queryClient };
};

const findSummaryCard = (name: string) =>
  screen.findByRole("article", { name });

const findSection = (name: string) =>
  screen.findByRole("region", { name });

const changeDate = (label: string, value: string) => {
  fireEvent.change(screen.getByLabelText(label), {
    target: { value },
  });
};

const expectedSummary = (dashboard: Dashboard) => ({
  balance: formatCurrency(dashboard.totalBalance),
  income: formatCurrency(dashboard.totalIncome),
  expenses: formatCurrency(dashboard.totalExpenses),
  net: formatCurrency(dashboard.netCashFlow),
});

beforeEach(() => {
  vi.clearAllMocks();

  dashboardApi.fetchDashboard.mockResolvedValue(makeDashboard());
  accountsApi.fetchAccounts.mockResolvedValue(accounts);
  categoriesApi.fetchCategories.mockResolvedValue(categories);
});

describe("DashboardPage summary", () => {
  it("shows loading placeholders while dashboard data is loading", () => {
    dashboardApi.fetchDashboard.mockReturnValue(new Promise(() => {}));

    renderPage();

    expect(screen.getByText("Loading dashboard")).toBeInTheDocument();
  });

  it("renders the backend summary values with existing currency formatting", async () => {
    const dashboard = makeDashboard();
    const expected = expectedSummary(dashboard);

    dashboardApi.fetchDashboard.mockResolvedValue(dashboard);

    renderPage();

    const balanceCard = await findSummaryCard("Total balance");
    const incomeCard = await findSummaryCard("Total income");
    const expensesCard = await findSummaryCard("Total expenses");
    const netCard = await findSummaryCard("Net cash flow");

    expect(within(balanceCard).getByText(expected.balance)).toBeInTheDocument();
    expect(within(incomeCard).getByText(expected.income)).toBeInTheDocument();
    expect(within(expensesCard).getByText(expected.expenses)).toBeInTheDocument();
    expect(within(netCard).getByText(expected.net)).toBeInTheDocument();
    expect(
      within(balanceCard).getByText(/not affected by the date range/i),
    ).toBeInTheDocument();
  });

  it("displays zero values correctly", async () => {
    dashboardApi.fetchDashboard.mockResolvedValue(
      makeDashboard({
        totalBalance: 0,
        totalIncome: 0,
        totalExpenses: 0,
        netCashFlow: 0,
        incomeByCategory: [],
        expenseByCategory: [],
        recentTransactions: [],
      }),
    );

    renderPage();

    for (const label of [
      "Total balance",
      "Total income",
      "Total expenses",
      "Net cash flow",
    ]) {
      const card = await findSummaryCard(label);
      expect(within(card).getByText("$0.00")).toBeInTheDocument();
    }

    expect(
      await screen.findByText("No income recorded for this period."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("No expenses recorded for this period."),
    ).toBeInTheDocument();
    expect(screen.getByText("No recent transactions")).toBeInTheDocument();
  });

  it("renders a negative net cash flow with its negative sign", async () => {
    dashboardApi.fetchDashboard.mockResolvedValue(
      makeDashboard({
        totalIncome: 400,
        totalExpenses: 850.75,
        netCashFlow: -450.75,
      }),
    );

    renderPage();

    const netCard = await findSummaryCard("Net cash flow");

    expect(within(netCard).getByText("-$450.75")).toBeInTheDocument();
    expect(netCard).toHaveClass("dashboard-summary-card--negative");
  });

  it("keeps large monetary values readable", async () => {
    dashboardApi.fetchDashboard.mockResolvedValue(
      makeDashboard({
        totalBalance: 1234567890.12,
      }),
    );

    renderPage();

    const balanceCard = await findSummaryCard("Total balance");

    expect(
      within(balanceCard).getByText("$1,234,567,890.12"),
    ).toBeInTheDocument();
  });

  it("shows an API error state and retries the request", async () => {
    dashboardApi.fetchDashboard
      .mockRejectedValueOnce(
        new ApiError(500, "Internal server error", "INTERNAL_SERVER_ERROR"),
      )
      .mockResolvedValueOnce(makeDashboard());

    const user = userEvent.setup();

    renderPage();

    expect(
      await screen.findByText("Unable to load dashboard"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(
      await screen.findByRole("article", { name: "Total balance" }),
    ).toBeInTheDocument();
  });
});

describe("DashboardPage date filters", () => {
  it("requests only the start date when it is set", async () => {
    renderPage();

    await findSummaryCard("Total balance");

    changeDate("Start date", "2026-10-01");

    await waitFor(() =>
      expect(dashboardApi.fetchDashboard).toHaveBeenLastCalledWith({
        startDate: "2026-10-01",
      }),
    );
  });

  it("requests only the end date when it is set", async () => {
    renderPage();

    await findSummaryCard("Total balance");

    changeDate("End date", "2026-10-31");

    await waitFor(() =>
      expect(dashboardApi.fetchDashboard).toHaveBeenLastCalledWith({
        endDate: "2026-10-31",
      }),
    );
  });

  it("requests a combined date range", async () => {
    renderPage();

    await findSummaryCard("Total balance");

    changeDate("Start date", "2026-10-01");

    await waitFor(() =>
      expect(dashboardApi.fetchDashboard).toHaveBeenLastCalledWith({
        startDate: "2026-10-01",
      }),
    );

    changeDate("End date", "2026-10-31");

    await waitFor(() =>
      expect(dashboardApi.fetchDashboard).toHaveBeenLastCalledWith({
        startDate: "2026-10-01",
        endDate: "2026-10-31",
      }),
    );

    for (const [filters] of dashboardApi.fetchDashboard.mock.calls) {
      expect(filters).not.toHaveProperty("userId");
    }
  });

  it("rejects an invalid date range without requesting it", async () => {
    renderPage();

    await findSummaryCard("Total balance");

    changeDate("Start date", "2026-10-31");

    await waitFor(() =>
      expect(dashboardApi.fetchDashboard).toHaveBeenLastCalledWith({
        startDate: "2026-10-31",
      }),
    );

    changeDate("End date", "2026-10-01");

    expect(
      await screen.findByText("Start date must be on or before the end date."),
    ).toBeInTheDocument();

    expect(dashboardApi.fetchDashboard).toHaveBeenCalledTimes(2);
    expect(dashboardApi.fetchDashboard).not.toHaveBeenCalledWith({
      startDate: "2026-10-31",
      endDate: "2026-10-01",
    });
  });

  it("clears both date filters", async () => {
    const user = userEvent.setup();

    renderPage();

    await findSummaryCard("Total balance");

    changeDate("Start date", "2026-10-01");
    changeDate("End date", "2026-10-31");

    await waitFor(() =>
      expect(dashboardApi.fetchDashboard).toHaveBeenLastCalledWith({
        startDate: "2026-10-01",
        endDate: "2026-10-31",
      }),
    );

    await user.click(screen.getByRole("button", { name: "Clear dates" }));

    await waitFor(() =>
      expect(dashboardApi.fetchDashboard).toHaveBeenLastCalledWith({}),
    );

    expect(screen.getByLabelText("Start date")).toHaveValue("");
    expect(screen.getByLabelText("End date")).toHaveValue("");
  });

  it("refreshes the displayed data when the date range changes", async () => {
    const filtered = makeDashboard({
      totalBalance: 5432.1,
      totalIncome: 300,
      totalExpenses: 100,
      netCashFlow: 200,
      incomeByCategory: [
        {
          categoryId: salaryCategory.id,
          categoryName: "Salary",
          total: "300",
        },
      ],
      expenseByCategory: [],
      recentTransactions: [],
    });

    dashboardApi.fetchDashboard
      .mockResolvedValueOnce(makeDashboard())
      .mockResolvedValueOnce(filtered);

    const { queryClient } = renderPage();

    const incomeCard = await findSummaryCard("Total income");

    expect(within(incomeCard).getByText("$2,500.00")).toBeInTheDocument();

    changeDate("Start date", "2026-10-01");

    await waitFor(() =>
      expect(
        within(screen.getByRole("article", { name: "Total income" })).getByText(
          "$300.00",
        ),
      ).toBeInTheDocument(),
    );

    expect(
      queryClient.getQueryData(
        dashboardKeys.summary({ startDate: "2026-10-01" }),
      ),
    ).toEqual(filtered);
  });

  it("keeps the selected date range while the dashboard is displayed", async () => {
    renderPage();

    await findSummaryCard("Total balance");

    changeDate("Start date", "2026-10-01");
    changeDate("End date", "2026-10-31");

    await waitFor(() =>
      expect(dashboardApi.fetchDashboard).toHaveBeenLastCalledWith({
        startDate: "2026-10-01",
        endDate: "2026-10-31",
      }),
    );

    expect(screen.getByLabelText("Start date")).toHaveValue("2026-10-01");
    expect(screen.getByLabelText("End date")).toHaveValue("2026-10-31");
    expect(
      screen.getByText("Showing transactions from Oct 1, 2026 to Oct 31, 2026."),
    ).toBeInTheDocument();
  });
});

describe("DashboardPage total balance independence", () => {
  it("displays total balance from the API instead of deriving it from cash flow", async () => {
    const dashboard = makeDashboard({
      totalBalance: 7777,
      totalIncome: 100,
      totalExpenses: 60,
      netCashFlow: 40,
      recentTransactions: [],
    });

    dashboardApi.fetchDashboard.mockResolvedValue(dashboard);

    renderPage();

    const balanceCard = await findSummaryCard("Total balance");
    const netCard = await findSummaryCard("Net cash flow");

    expect(within(balanceCard).getByText("$7,777.00")).toBeInTheDocument();
    expect(within(netCard).getByText("$40.00")).toBeInTheDocument();
    expect(within(balanceCard).queryByText("$40.00")).not.toBeInTheDocument();
  });

  it("does not reinterpret total balance when the date range changes", async () => {
    const filtered = makeDashboard({
      totalBalance: 5432.1,
      totalIncome: 0,
      totalExpenses: 0,
      netCashFlow: 0,
      incomeByCategory: [],
      expenseByCategory: [],
      recentTransactions: [],
    });

    dashboardApi.fetchDashboard
      .mockResolvedValueOnce(makeDashboard())
      .mockResolvedValueOnce(filtered);

    renderPage();

    expect(
      within(await findSummaryCard("Total balance")).getByText("$5,432.10"),
    ).toBeInTheDocument();

    changeDate("Start date", "2026-10-01");

    await waitFor(() =>
      expect(
        within(screen.getByRole("article", { name: "Total income" })).getByText(
          "$0.00",
        ),
      ).toBeInTheDocument(),
    );

    expect(
      within(screen.getByRole("article", { name: "Total balance" })).getByText(
        "$5,432.10",
      ),
    ).toBeInTheDocument();
  });
});

describe("DashboardPage category breakdowns", () => {
  it("renders income and expense categories with names and amounts", async () => {
    renderPage();

    const incomeSection = await findSection("Income by category");
    const expenseSection = await findSection("Expenses by category");

    expect(within(incomeSection).getByText("Salary")).toBeInTheDocument();
    expect(
      within(incomeSection).getByText("$2,500.00"),
    ).toBeInTheDocument();

    expect(within(expenseSection).getByText("Food")).toBeInTheDocument();
    expect(within(expenseSection).getByText("$600.00")).toBeInTheDocument();
    expect(within(expenseSection).getByText("Rent")).toBeInTheDocument();
    expect(within(expenseSection).getByText("$300.00")).toBeInTheDocument();

    expect(
      within(expenseSection).getByRole("list", {
        name: "Expenses by category amounts",
      }),
    ).toBeInTheDocument();
  });

  it("handles zero and very small category values without hiding labels", async () => {
    dashboardApi.fetchDashboard.mockResolvedValue(
      makeDashboard({
        incomeByCategory: [],
        expenseByCategory: [
          {
            categoryId: foodCategory.id,
            categoryName: "Food",
            total: "0.01",
          },
          {
            categoryId: rentCategory.id,
            categoryName: "Rent",
            total: "100",
          },
          {
            categoryId: "44444444-4444-4444-8444-444444444444",
            categoryName: "Other",
            total: "0",
          },
        ],
      }),
    );

    renderPage();

    const expenseSection = await findSection("Expenses by category");

    expect(within(expenseSection).getByText("Food")).toBeInTheDocument();
    expect(within(expenseSection).getByText("$0.01")).toBeInTheDocument();
    expect(within(expenseSection).getByText("<1%")).toBeInTheDocument();
    expect(within(expenseSection).getByText("Other")).toBeInTheDocument();
    expect(within(expenseSection).getByText("$0.00")).toBeInTheDocument();
    expect(within(expenseSection).getByText("0%")).toBeInTheDocument();
  });

  it("handles missing category names safely", async () => {
    dashboardApi.fetchDashboard.mockResolvedValue(
      makeDashboard({
        incomeByCategory: [],
        expenseByCategory: [
          {
            categoryId: "55555555-5555-4555-8555-555555555555",
            categoryName: "",
            total: "10",
          },
        ],
      }),
    );

    renderPage();

    const expenseSection = await findSection("Expenses by category");

    expect(within(expenseSection).getByText("Uncategorized")).toBeInTheDocument();
    expect(within(expenseSection).getByText("$10.00")).toBeInTheDocument();
  });
});

describe("DashboardPage recent transactions", () => {
  it("renders recent transaction fields with formatting and direction", async () => {
    renderPage();

    const section = await findSection("Recent transactions");

    expect(within(section).getByText("Groceries")).toBeInTheDocument();
    expect(within(section).getByText("Sep 20, 2026")).toBeInTheDocument();
    expect(within(section).getByText("Wallet")).toBeInTheDocument();
    expect(within(section).getByText("Food")).toBeInTheDocument();
    expect(within(section).getByText("-$45.50")).toBeInTheDocument();

    expect(within(section).getByText("Monthly salary")).toBeInTheDocument();
    expect(within(section).getByText("Oct 1, 2026")).toBeInTheDocument();
    expect(within(section).getByText("Checking")).toBeInTheDocument();
    expect(within(section).getByText("Salary")).toBeInTheDocument();
    expect(within(section).getByText("+$2,500.00")).toBeInTheDocument();
  });

  it("handles missing descriptions and unknown account or category references", async () => {
    dashboardApi.fetchDashboard.mockResolvedValue(
      makeDashboard({
        recentTransactions: [
          {
            ...groceriesTransaction,
            description: null,
            accountId: 999,
            categoryId: "99999999-9999-4999-8999-999999999999",
          },
        ],
      }),
    );

    renderPage();

    const section = await findSection("Recent transactions");

    expect(within(section).getByText("Untitled transaction")).toBeInTheDocument();
    expect(within(section).getByText("Account #999")).toBeInTheDocument();
    expect(within(section).getByText("Unknown category")).toBeInTheDocument();
  });

  it("preserves the ordering returned by the backend", async () => {
    renderPage();

    const section = await findSection("Recent transactions");
    const list = within(section).getByRole("list", {
      name: "Recent transactions list",
    });
    const items = within(list).getAllByRole("listitem");

    expect(items[0]).toHaveTextContent("Groceries");
    expect(items[1]).toHaveTextContent("Monthly salary");
  });

  it("shows an empty state when no transactions match", async () => {
    dashboardApi.fetchDashboard.mockResolvedValue(
      makeDashboard({
        totalIncome: 0,
        totalExpenses: 0,
        netCashFlow: 0,
        incomeByCategory: [],
        expenseByCategory: [],
        recentTransactions: [],
      }),
    );

    renderPage();

    expect(await screen.findByText("No recent transactions")).toBeInTheDocument();
    expect(
      screen.getByText("No transactions match this date range."),
    ).toBeInTheDocument();
  });

  it("navigates to the transactions page", async () => {
    const user = userEvent.setup();

    renderPage();

    const section = await findSection("Recent transactions");

    await user.click(
      within(section).getByRole("link", { name: "View all transactions" }),
    );

    expect(
      await screen.findByRole("heading", { name: "Transactions page" }),
    ).toBeInTheDocument();
  });

  it("keeps the dashboard visible when account or category lookups fail", async () => {
    accountsApi.fetchAccounts.mockRejectedValue(new Error("accounts failed"));
    categoriesApi.fetchCategories.mockRejectedValue(
      new Error("categories failed"),
    );

    renderPage();

    const section = await findSection("Recent transactions");

    expect(within(section).getByText("Account #2")).toBeInTheDocument();
    expect(
      within(section).getAllByText("Unknown category"),
    ).toHaveLength(2);
    expect(await findSummaryCard("Total balance")).toBeInTheDocument();
  });
});

describe("DashboardPage integration with routing", () => {
  it("renders the dashboard heading and description", async () => {
    renderPage();

    expect(
      screen.getByRole("heading", { name: "Dashboard", level: 1 }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("Welcome back, Arash Aghapour."),
    ).toBeInTheDocument();
  });
});
