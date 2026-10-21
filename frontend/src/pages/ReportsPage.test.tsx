import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import ReportsPage from "./ReportsPage";

import * as categoryQueries from "../features/categories/api/categories.queries";
import * as reportQueries from "../features/reports/api/reports.queries";
import { reportKeys } from "../features/reports/api/reports.keys";
import { ApiError } from "../lib/api/client";
import { authenticated, renderWithAuth } from "../test/auth-mock";

import type { Category } from "../features/categories/types";
import type {
  CashFlowReport,
  ExpenseReport,
  SummaryReport,
} from "../features/reports/types";

vi.mock("../features/reports/api/reports.queries");
vi.mock("../features/categories/api/categories.queries");

const reportsApi = vi.mocked(reportQueries);
const categoriesApi = vi.mocked(categoryQueries);

const foodCategory: Category = {
  id: "22222222-2222-4222-8222-222222222222",
  userId: 42,
  name: "Food",
  normalizedName: "food",
  type: "EXPENSE",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const rentCategory: Category = {
  id: "33333333-3333-4333-8333-333333333333",
  userId: 42,
  name: "Rent",
  normalizedName: "rent",
  type: "EXPENSE",
  createdAt: "2026-01-02T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
};

const salaryCategory: Category = {
  id: "11111111-1111-4111-8111-111111111111",
  userId: 42,
  name: "Salary",
  normalizedName: "salary",
  type: "INCOME",
  createdAt: "2026-01-03T00:00:00.000Z",
  updatedAt: "2026-01-03T00:00:00.000Z",
};

const categories = [foodCategory, rentCategory, salaryCategory];

const makeSummary = (
  overrides: Partial<SummaryReport> = {},
): SummaryReport => ({
  totalIncome: "5000.50",
  totalExpenses: "1500.25",
  netCashFlow: "3500.25",
  transactionCount: 12,
  incomeTransactionCount: 4,
  expenseTransactionCount: 8,
  ...overrides,
});

const makeExpenseReport = (
  overrides: Partial<ExpenseReport> = {},
): ExpenseReport => ({
  totalExpenses: "1000.50",
  categories: [
    {
      categoryId: rentCategory.id,
      categoryName: "Rent",
      amount: "800",
      transactionCount: 2,
    },
    {
      categoryId: foodCategory.id,
      categoryName: "Food",
      amount: "200.50",
      transactionCount: 5,
    },
  ],
  ...overrides,
});

const makeCashFlowReport = (
  overrides: Partial<CashFlowReport> = {},
): CashFlowReport => ({
  startDate: "2026-10-01",
  endDate: "2026-10-03",
  data: [
    {
      date: "2026-10-01",
      income: "1000",
      expenses: "200",
      netCashFlow: "800",
    },
    {
      date: "2026-10-02",
      income: "0",
      expenses: "50.25",
      netCashFlow: "-50.25",
    },
    {
      date: "2026-10-03",
      income: "0",
      expenses: "0",
      netCashFlow: "0",
    },
  ],
  ...overrides,
});

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  });

const renderReports = (
  path = "/reports/summary",
  queryClient: QueryClient = createQueryClient(),
) => {
  const result = renderWithAuth(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/reports/:reportType" element={<ReportsPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
    authenticated(),
  );

  return { ...result, queryClient };
};

const changeDate = (label: string, value: string) => {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
};

const findSummaryCard = (name: string) =>
  screen.findByRole("article", { name });

const getReportTable = (name: string) =>
  screen.findByRole("table", { name });

beforeEach(() => {
  vi.clearAllMocks();

  reportsApi.fetchSummaryReport.mockResolvedValue(makeSummary());
  reportsApi.fetchExpenseReport.mockResolvedValue(makeExpenseReport());
  reportsApi.fetchCashFlowReport.mockResolvedValue(makeCashFlowReport());
  categoriesApi.fetchCategories.mockResolvedValue(categories);
});

describe("ReportsPage summary report", () => {
  it("renders all six summary metrics from the API response", async () => {
    renderReports();

    const income = await findSummaryCard("Total income");
    const expenses = await findSummaryCard("Total expenses");
    const net = await findSummaryCard("Net cash flow");
    const transactions = await findSummaryCard("Transactions");
    const incomeCount = await findSummaryCard("Income transactions");
    const expenseCount = await findSummaryCard("Expense transactions");

    expect(within(income).getByText("$5,000.50")).toBeInTheDocument();
    expect(within(expenses).getByText("$1,500.25")).toBeInTheDocument();
    expect(within(net).getByText("$3,500.25")).toBeInTheDocument();
    expect(within(transactions).getByText("12")).toBeInTheDocument();
    expect(within(incomeCount).getByText("4")).toBeInTheDocument();
    expect(within(expenseCount).getByText("8")).toBeInTheDocument();
  });

  it("handles decimal values serialized as strings", async () => {
    reportsApi.fetchSummaryReport.mockResolvedValue(
      makeSummary({
        totalIncome: "1234.56",
        totalExpenses: "234.56",
        netCashFlow: "1000",
      }),
    );

    renderReports();

    expect(
      within(await findSummaryCard("Total income")).getByText("$1,234.56"),
    ).toBeInTheDocument();
    expect(
      within(await findSummaryCard("Total expenses")).getByText("$234.56"),
    ).toBeInTheDocument();
    expect(
      within(await findSummaryCard("Net cash flow")).getByText("$1,000.00"),
    ).toBeInTheDocument();
  });

  it("displays zero values instead of hiding them", async () => {
    reportsApi.fetchSummaryReport.mockResolvedValue(
      makeSummary({
        totalIncome: "0",
        totalExpenses: "0",
        netCashFlow: "0",
        transactionCount: 0,
        incomeTransactionCount: 0,
        expenseTransactionCount: 0,
      }),
    );

    renderReports();

    for (const label of ["Total income", "Total expenses", "Net cash flow"]) {
      expect(
        within(await findSummaryCard(label)).getByText("$0.00"),
      ).toBeInTheDocument();
    }

    for (const label of [
      "Transactions",
      "Income transactions",
      "Expense transactions",
    ]) {
      expect(within(await findSummaryCard(label)).getByText("0")).toBeInTheDocument();
    }

    expect(
      screen.getByText("No transactions match the selected date range."),
    ).toBeInTheDocument();
  });

  it("displays negative net cash flow with its sign", async () => {
    reportsApi.fetchSummaryReport.mockResolvedValue(
      makeSummary({
        totalIncome: "400",
        totalExpenses: "850.75",
        netCashFlow: "-450.75",
      }),
    );

    renderReports();

    const net = await findSummaryCard("Net cash flow");

    expect(within(net).getByText("-$450.75")).toBeInTheDocument();
    expect(net).toHaveClass("report-summary-card--negative");
  });

  it("does not recalculate API-provided totals", async () => {
    reportsApi.fetchSummaryReport.mockResolvedValue(
      makeSummary({
        totalIncome: "100",
        totalExpenses: "30",
        netCashFlow: "999",
        transactionCount: 5,
        incomeTransactionCount: 2,
        expenseTransactionCount: 3,
      }),
    );

    renderReports();

    const net = await findSummaryCard("Net cash flow");

    expect(within(net).getByText("$999.00")).toBeInTheDocument();
    expect(within(net).queryByText("$70.00")).not.toBeInTheDocument();
  });
});

describe("ReportsPage expense report", () => {
  it("renders category names, amounts, and transaction counts", async () => {
    renderReports("/reports/expenses");

    const table = await getReportTable("Expense report by category");

    expect(within(table).getByText("Rent")).toBeInTheDocument();
    expect(within(table).getByText("$800.00")).toBeInTheDocument();
    expect(within(table).getByText("Food")).toBeInTheDocument();
    expect(within(table).getByText("$200.50")).toBeInTheDocument();
    expect(within(table).getByText("5")).toBeInTheDocument();
    expect(
      screen.getByText("$1,000.50", { selector: ".report-total-value" }),
    ).toBeInTheDocument();
  });

  it("preserves the API-provided group order", async () => {
    renderReports("/reports/expenses");

    const table = await getReportTable("Expense report by category");
    const rows = within(table).getAllByRole("row").slice(1);

    expect(rows[0]).toHaveTextContent("Rent");
    expect(rows[1]).toHaveTextContent("Food");
  });

  it("loads category options from the Categories API and excludes non-expense categories", async () => {
    renderReports("/reports/expenses");

    expect(await screen.findByRole("option", { name: "Food" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Rent" })).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: "Salary" }),
    ).not.toBeInTheDocument();
    expect(categoriesApi.fetchCategories).toHaveBeenCalledWith("EXPENSE");
  });

  it("applies date and category filters to the report request", async () => {
    const user = userEvent.setup();

    renderReports("/reports/expenses");

    await screen.findByRole("option", { name: "Food" });

    changeDate("Start date", "2026-10-01");

    await waitFor(() =>
      expect(reportsApi.fetchExpenseReport).toHaveBeenLastCalledWith({
        startDate: "2026-10-01",
      }),
    );

    await user.selectOptions(
      screen.getByLabelText("Category"),
      foodCategory.id,
    );

    await waitFor(() =>
      expect(reportsApi.fetchExpenseReport).toHaveBeenLastCalledWith({
        startDate: "2026-10-01",
        categoryId: foodCategory.id,
      }),
    );

    for (const [filters] of reportsApi.fetchExpenseReport.mock.calls) {
      expect(filters).not.toHaveProperty("userId");
    }
  });

  it("clears the date and category filters and returns to unfiltered results", async () => {
    const user = userEvent.setup();

    renderReports("/reports/expenses");

    await screen.findByRole("option", { name: "Food" });

    changeDate("Start date", "2026-10-01");

    await waitFor(() =>
      expect(reportsApi.fetchExpenseReport).toHaveBeenLastCalledWith({
        startDate: "2026-10-01",
      }),
    );

    await user.selectOptions(
      screen.getByLabelText("Category"),
      foodCategory.id,
    );

    await waitFor(() =>
      expect(reportsApi.fetchExpenseReport).toHaveBeenLastCalledWith({
        startDate: "2026-10-01",
        categoryId: foodCategory.id,
      }),
    );

    await user.click(screen.getByRole("button", { name: "Clear category" }));
    await user.click(screen.getByRole("button", { name: "Clear dates" }));

    await waitFor(() =>
      expect(reportsApi.fetchExpenseReport).toHaveBeenLastCalledWith({}),
    );

    expect(screen.getByLabelText("Start date")).toHaveValue("");
    expect(screen.getByLabelText("Category")).toHaveValue("");
  });

  it("shows an empty state when no expense groups match", async () => {
    reportsApi.fetchExpenseReport.mockResolvedValue({
      totalExpenses: "0",
      categories: [],
    });

    renderReports("/reports/expenses");

    expect(
      await screen.findByText("No expenses match your filters"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("table", { name: "Expense report by category" }),
    ).not.toBeInTheDocument();
  });

  it("shows category loading and category error states", async () => {
    categoriesApi.fetchCategories.mockReturnValue(new Promise(() => {}));

    const { unmount } = renderReports("/reports/expenses");

    expect(await screen.findByText("Loading categories...")).toBeInTheDocument();

    unmount();

    categoriesApi.fetchCategories.mockRejectedValue(
      new ApiError(500, "Internal server error", "INTERNAL_SERVER_ERROR"),
    );

    renderReports("/reports/expenses");

    expect(await screen.findByText("Unable to load categories.")).toBeInTheDocument();
  });

  it("shows a report error state without rendering report data", async () => {
    reportsApi.fetchExpenseReport.mockRejectedValue(
      new ApiError(500, "Internal server error", "INTERNAL_SERVER_ERROR"),
    );

    renderReports("/reports/expenses");

    expect(
      await screen.findByText("Unable to load expense report"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("table", { name: "Expense report by category" }),
    ).not.toBeInTheDocument();
  });

  it("handles an unavailable category error and allows clearing the category", async () => {
    const user = userEvent.setup();

    reportsApi.fetchExpenseReport.mockImplementation((filters) =>
      filters?.categoryId
        ? Promise.reject(
            new ApiError(404, "Category not found", "NOT_FOUND"),
          )
        : Promise.resolve(makeExpenseReport()),
    );

    renderReports("/reports/expenses");

    await screen.findByRole("option", { name: "Food" });
    await user.selectOptions(screen.getByLabelText("Category"), foodCategory.id);

    expect(
      await screen.findByText(
        "The selected category is no longer available. Clear the category filter and try again.",
      ),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Clear category filter" }),
    );

    expect(await screen.findByRole("table", { name: "Expense report by category" })).toBeInTheDocument();
    expect(screen.getByLabelText("Category")).toHaveValue("");
  });
});

describe("ReportsPage cash flow report", () => {
  it("renders the daily values and accessible table returned by the API", async () => {
    renderReports("/reports/cash-flow");

    const table = await getReportTable("Daily cash flow");

    expect(table).toHaveAccessibleDescription(
      "Daily income, expenses, and net cash flow for the selected date range.",
    );

    const rows = within(table).getAllByRole("row").slice(1);

    expect(rows[0]).toHaveTextContent("Oct 1, 2026");
    expect(rows[0]).toHaveTextContent("$1,000.00");
    expect(rows[0]).toHaveTextContent("$200.00");
    expect(rows[0]).toHaveTextContent("$800.00");

    expect(rows[1]).toHaveTextContent("Oct 2, 2026");
    expect(rows[1]).toHaveTextContent("$0.00");
    expect(rows[1]).toHaveTextContent("$50.25");
    expect(rows[1]).toHaveTextContent("-$50.25");

    expect(rows[2]).toHaveTextContent("Oct 3, 2026");
    expect(within(rows[2]).getAllByText("$0.00")).toHaveLength(3);
  });

  it("preserves the API-provided ascending date order", async () => {
    renderReports("/reports/cash-flow");

    const table = await getReportTable("Daily cash flow");
    const rows = within(table).getAllByRole("row").slice(1);

    expect(rows.map((row) => row.textContent)).toEqual([
      expect.stringContaining("Oct 1, 2026"),
      expect.stringContaining("Oct 2, 2026"),
      expect.stringContaining("Oct 3, 2026"),
    ]);
  });

  it("labels cash flow values for the stacked mobile table layout", async () => {
    renderReports("/reports/cash-flow");

    const table = await getReportTable("Daily cash flow");
    const firstRow = within(table).getAllByRole("row")[1];

    expect(
      firstRow.querySelector('[data-label="Income"]'),
    ).toHaveTextContent("$1,000.00");
    expect(
      firstRow.querySelector('[data-label="Expenses"]'),
    ).toHaveTextContent("$200.00");
    expect(
      firstRow.querySelector('[data-label="Net cash flow"]'),
    ).toHaveTextContent("$800.00");
  });

  it("shows an empty state when there is no cash flow data", async () => {
    reportsApi.fetchCashFlowReport.mockResolvedValue({
      startDate: "",
      endDate: "",
      data: [],
    });

    renderReports("/reports/cash-flow");

    expect(
      await screen.findByText("No cash flow for this period"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("table", { name: "Daily cash flow" }),
    ).not.toBeInTheDocument();
  });
});

describe("ReportsPage date filters", () => {
  it("sends correctly formatted date parameters and omits empty ones", async () => {
    const user = userEvent.setup();

    renderReports();

    await findSummaryCard("Total income");

    expect(reportsApi.fetchSummaryReport).toHaveBeenLastCalledWith({});

    changeDate("Start date", "2026-10-01");

    await waitFor(() =>
      expect(reportsApi.fetchSummaryReport).toHaveBeenLastCalledWith({
        startDate: "2026-10-01",
      }),
    );

    changeDate("End date", "2026-10-31");

    await waitFor(() =>
      expect(reportsApi.fetchSummaryReport).toHaveBeenLastCalledWith({
        startDate: "2026-10-01",
        endDate: "2026-10-31",
      }),
    );

    await user.click(screen.getByRole("button", { name: "Clear dates" }));

    await waitFor(() =>
      expect(reportsApi.fetchSummaryReport).toHaveBeenLastCalledWith({}),
    );
  });

  it("rejects a start date later than the end date without requesting it", async () => {
    renderReports();

    await findSummaryCard("Total income");

    changeDate("Start date", "2026-10-31");

    await waitFor(() =>
      expect(reportsApi.fetchSummaryReport).toHaveBeenLastCalledWith({
        startDate: "2026-10-31",
      }),
    );

    changeDate("End date", "2026-10-01");

    expect(
      await screen.findByText("Start date must be on or before the end date."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Start date")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(reportsApi.fetchSummaryReport).not.toHaveBeenCalledWith({
      startDate: "2026-10-31",
      endDate: "2026-10-01",
    });
  });

  it("keeps results associated with the correct filter combination", async () => {
    const unfiltered = makeSummary({ totalIncome: "5000.50" });
    const filtered = makeSummary({ totalIncome: "300" });

    reportsApi.fetchSummaryReport
      .mockResolvedValueOnce(unfiltered)
      .mockResolvedValueOnce(filtered);

    const { queryClient } = renderReports();

    expect(
      within(await findSummaryCard("Total income")).getByText("$5,000.50"),
    ).toBeInTheDocument();

    changeDate("Start date", "2026-10-01");

    await waitFor(() =>
      expect(
        within(
          screen.getByRole("article", { name: "Total income" }),
        ).getByText("$300.00"),
      ).toBeInTheDocument(),
    );

    expect(queryClient.getQueryData(reportKeys.summary())).toEqual(unfiltered);
    expect(
      queryClient.getQueryData(
        reportKeys.summary({ startDate: "2026-10-01" }),
      ),
    ).toEqual(filtered);
  });
});

describe("ReportsPage navigation, loading, and errors", () => {
  it("renders the reports page and navigates between report types", async () => {
    const user = userEvent.setup();

    renderReports("/reports");

    expect(
      screen.getByRole("heading", { name: "Reports", level: 1 }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { name: "Summary Report", level: 2 }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "Expense Report" }));

    expect(
      await screen.findByRole("heading", { name: "Expense Report", level: 2 }),
    ).toBeInTheDocument();
    expect(reportsApi.fetchExpenseReport).toHaveBeenCalled();

    await user.click(screen.getByRole("link", { name: "Cash Flow Report" }));

    expect(
      await screen.findByRole("heading", { name: "Cash Flow Report", level: 2 }),
    ).toBeInTheDocument();
    expect(reportsApi.fetchCashFlowReport).toHaveBeenCalled();
  });

  it("shows a loading indicator while the summary report loads", () => {
    reportsApi.fetchSummaryReport.mockReturnValue(new Promise(() => {}));

    renderReports();

    expect(screen.getByText("Loading summary report")).toBeInTheDocument();
  });

  it("shows an error state and does not keep stale report data for a failed filter change", async () => {
    reportsApi.fetchSummaryReport
      .mockResolvedValueOnce(makeSummary({ totalIncome: "5000.50" }))
      .mockRejectedValueOnce(
        new ApiError(500, "Internal server error", "INTERNAL_SERVER_ERROR"),
      );

    renderReports();

    expect(
      within(await findSummaryCard("Total income")).getByText("$5,000.50"),
    ).toBeInTheDocument();

    changeDate("Start date", "2026-10-01");

    expect(
      await screen.findByText("Unable to load summary report"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("article", { name: "Total income" }),
    ).not.toBeInTheDocument();
  });
});
