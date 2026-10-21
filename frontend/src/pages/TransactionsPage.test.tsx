import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import TransactionsPage from "./TransactionsPage";

import * as transactionQueries from "../features/transactions/api/transactions.queries";
import * as accountQueries from "../features/accounts/api/accounts.queries";
import * as categoryQueries from "../features/categories/api/categories.queries";

import { ApiError } from "../lib/api/client";

import type {
  PaginatedTransactions,
  Transaction,
} from "../features/transactions/types";
import type { Account } from "../features/accounts/types";
import type { Category } from "../features/categories/types";

vi.mock("../features/transactions/api/transactions.queries");
vi.mock("../features/accounts/api/accounts.queries");
vi.mock("../features/categories/api/categories.queries");

const transactionsApi = vi.mocked(transactionQueries);
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

const incomeCategory: Category = {
  id: "11111111-1111-4111-8111-111111111111",
  userId: 42,
  name: "Salary",
  normalizedName: "salary",
  type: "INCOME",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const expenseCategory: Category = {
  id: "22222222-2222-4222-8222-222222222222",
  userId: 42,
  name: "Food",
  normalizedName: "food",
  type: "EXPENSE",
  createdAt: "2026-01-02T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
};

const categories = [incomeCategory, expenseCategory];

const salary: Transaction = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  userId: 42,
  type: "INCOME",
  amount: "2500",
  description: "Salary",
  date: "2026-09-01T00:00:00.000Z",
  accountId: 1,
  categoryId: incomeCategory.id,
  createdAt: "2026-09-01T10:00:00.000Z",
  updatedAt: "2026-09-01T10:00:00.000Z",
};

const groceries: Transaction = {
  id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  userId: 42,
  type: "EXPENSE",
  amount: "45.5",
  description: "Groceries",
  date: "2026-09-20T00:00:00.000Z",
  accountId: 2,
  categoryId: expenseCategory.id,
  createdAt: "2026-09-20T10:00:00.000Z",
  updatedAt: "2026-09-20T10:00:00.000Z",
};

const paginated = (
  data: Transaction[],
  overrides: Partial<PaginatedTransactions["pagination"]> = {},
): PaginatedTransactions => ({
  data,
  pagination: {
    page: 1,
    limit: 20,
    total: data.length,
    totalPages: data.length === 0 ? 0 : 1,
    ...overrides,
  },
});

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  });

const renderPage = (client: QueryClient = createQueryClient()) =>
  render(
    <QueryClientProvider client={client}>
      <TransactionsPage />
    </QueryClientProvider>,
  );

const getCard = (name: string | RegExp) =>
  screen.getByRole("article", { name });

const waitForOptions = async () => {
  await waitFor(() => {
    expect(
      within(screen.getByLabelText("Account")).getByRole("option", {
        name: "Checking",
      }),
    ).toBeInTheDocument();
    expect(
      within(screen.getByLabelText("Category")).getByRole("option", {
        name: "Food",
      }),
    ).toBeInTheDocument();
  });
};

const fillCreateForm = async (
  user: ReturnType<typeof userEvent.setup>,
  values: {
    type?: string;
    amount?: string;
    description?: string;
    date?: string;
    accountId?: string;
    categoryId?: string;
  } = {},
) => {
  const {
    type = "EXPENSE",
    amount = "25",
    description = "Lunch",
    date = "2026-09-20",
    accountId = "1",
    categoryId = expenseCategory.id,
  } = values;

  await user.selectOptions(screen.getByLabelText("Transaction type"), type);
  await user.type(screen.getByLabelText("Amount"), amount);

  if (description) {
    await user.type(
      screen.getByLabelText("Description (optional)"),
      description,
    );
  }

  fireEvent.change(screen.getByLabelText("Date"), {
    target: { value: date },
  });

  await user.selectOptions(screen.getByLabelText("Account"), accountId);
  await user.selectOptions(screen.getByLabelText("Category"), categoryId);
};

beforeEach(() => {
  vi.clearAllMocks();

  transactionsApi.fetchTransactions.mockResolvedValue(
    paginated([groceries, salary]),
  );
  transactionsApi.fetchTransaction.mockResolvedValue(groceries);
  transactionsApi.createTransactionMutation.mockResolvedValue(groceries);
  transactionsApi.updateTransactionMutation.mockResolvedValue(groceries);
  transactionsApi.deleteTransactionMutation.mockResolvedValue(undefined);

  accountsApi.fetchAccounts.mockResolvedValue(accounts);
  accountsApi.createAccountMutation.mockResolvedValue(checking);
  accountsApi.updateAccountMutation.mockResolvedValue(checking);
  accountsApi.deleteAccountMutation.mockResolvedValue(undefined);

  categoriesApi.fetchCategories.mockResolvedValue(categories);
  categoriesApi.createCategoryMutation.mockResolvedValue(expenseCategory);
  categoriesApi.updateCategoryMutation.mockResolvedValue(expenseCategory);
  categoriesApi.deleteCategoryMutation.mockResolvedValue(undefined);
});

describe("TransactionsPage list", () => {
  it("shows a loading state while transactions are fetched", () => {
    transactionsApi.fetchTransactions.mockReturnValue(new Promise(() => {}));

    renderPage();

    expect(screen.getByText("Loading transactions")).toBeInTheDocument();
  });

  it("renders income and expense transactions with their relations", async () => {
    renderPage();

    const incomeCard = await screen.findByRole("article", { name: "Salary" });
    const expenseCard = getCard("Groceries");

    expect(within(incomeCard).getAllByText("INCOME").length).toBeGreaterThan(0);
    expect(within(incomeCard).getByText("+$2,500.00")).toBeInTheDocument();
    expect(
      within(incomeCard).getByText("Sep 1, 2026"),
    ).toBeInTheDocument();
    expect(within(incomeCard).getByText("Checking")).toBeInTheDocument();
    expect(
      within(incomeCard).getAllByText("Salary").length,
    ).toBeGreaterThan(0);

    expect(
      within(expenseCard).getAllByText("EXPENSE").length,
    ).toBeGreaterThan(0);
    expect(within(expenseCard).getByText("-$45.50")).toBeInTheDocument();
    expect(
      within(expenseCard).getByText("Sep 20, 2026"),
    ).toBeInTheDocument();
    expect(within(expenseCard).getByText("Wallet")).toBeInTheDocument();
    expect(within(expenseCard).getByText("Food")).toBeInTheDocument();
  });

  it("shows an empty state when there are no transactions", async () => {
    transactionsApi.fetchTransactions.mockResolvedValue(paginated([]));

    renderPage();

    expect(await screen.findByText("No transactions yet")).toBeInTheDocument();
  });

  it("shows an API error state and retries", async () => {
    transactionsApi.fetchTransactions
      .mockRejectedValueOnce(
        new ApiError(500, "Internal server error", "INTERNAL_SERVER_ERROR"),
      )
      .mockResolvedValueOnce(paginated([salary]));

    renderPage();

    expect(
      await screen.findByText("Unable to load transactions"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Something went wrong. Please try again."),
    ).toBeInTheDocument();

    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(
      await screen.findByRole("article", { name: "Salary" }),
    ).toBeInTheDocument();
    expect(transactionsApi.fetchTransactions).toHaveBeenCalledTimes(2);
  });

  it("moves between pages using the backend pagination contract", async () => {
    transactionsApi.fetchTransactions
      .mockResolvedValueOnce(
        paginated([salary], { page: 1, total: 25, totalPages: 2 }),
      )
      .mockResolvedValueOnce(
        paginated([groceries], { page: 2, total: 25, totalPages: 2 }),
      );

    const user = userEvent.setup();

    renderPage();

    await screen.findByRole("article", { name: "Salary" });
    expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Next page" }));

    expect(
      await screen.findByRole("article", { name: "Groceries" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Page 2 of 2")).toBeInTheDocument();
    expect(transactionsApi.fetchTransactions).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 2 }),
    );

    await user.click(screen.getByRole("button", { name: "Previous page" }));

    await waitFor(() =>
      expect(transactionsApi.fetchTransactions).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 1 }),
      ),
    );
  });

  it("sends supported filters and sort options and resets the page", async () => {
    const user = userEvent.setup();

    renderPage();

    await screen.findByRole("article", { name: "Salary" });

    await user.selectOptions(screen.getByLabelText("Filter type"), "EXPENSE");
    await user.selectOptions(screen.getByLabelText("Filter account"), "2");
    await user.selectOptions(
      screen.getByLabelText("Filter category"),
      expenseCategory.id,
    );

    fireEvent.change(screen.getByLabelText("From date"), {
      target: { value: "2026-09-01" },
    });
    fireEvent.change(screen.getByLabelText("To date"), {
      target: { value: "2026-09-30" },
    });

    await user.type(screen.getByLabelText("Minimum amount"), "10");
    await user.type(screen.getByLabelText("Maximum amount"), "100");
    await user.selectOptions(
      screen.getByLabelText("Sort by"),
      "amount_asc",
    );

    await waitFor(() =>
      expect(transactionsApi.fetchTransactions).toHaveBeenLastCalledWith({
        type: "EXPENSE",
        accountId: 2,
        categoryId: expenseCategory.id,
        startDate: "2026-09-01",
        endDate: "2026-09-30",
        minAmount: 10,
        maxAmount: 100,
        sort: "amount_asc",
        page: 1,
        limit: 20,
      }),
    );
  });

  it("validates date and amount ranges before querying", async () => {
    const user = userEvent.setup();

    renderPage();

    await screen.findByRole("article", { name: "Salary" });

    await user.type(screen.getByLabelText("Minimum amount"), "100");
    await user.type(screen.getByLabelText("Maximum amount"), "50");

    expect(
      await screen.findByText(
        "Minimum amount must be less than or equal to the maximum amount.",
      ),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("From date"), {
      target: { value: "2026-09-30" },
    });
    fireEvent.change(screen.getByLabelText("To date"), {
      target: { value: "2026-09-01" },
    });

    expect(
      await screen.findByText(
        "Start date must be on or before the end date.",
      ),
    ).toBeInTheDocument();

    const calls = transactionsApi.fetchTransactions.mock.calls;

    expect(
      calls.every(
        ([filters]) =>
          filters?.maxAmount !== 50 &&
          !(
            filters?.startDate === "2026-09-30" &&
            filters?.endDate === "2026-09-01"
          ),
      ),
    ).toBe(true);
  });

  it("shows an empty filtered result state", async () => {
    transactionsApi.fetchTransactions
      .mockResolvedValueOnce(paginated([salary]))
      .mockResolvedValue(paginated([]));

    const user = userEvent.setup();

    renderPage();

    await screen.findByRole("article", { name: "Salary" });

    await user.selectOptions(screen.getByLabelText("Filter type"), "EXPENSE");

    expect(
      await screen.findByText("No transactions match your filters"),
    ).toBeInTheDocument();
  });
});

describe("TransactionsPage create", () => {
  it("creates an expense without sending userId and refreshes transaction and account queries", async () => {
    const created: Transaction = {
      ...groceries,
      id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      description: "Lunch",
      amount: "25",
    };

    transactionsApi.createTransactionMutation.mockResolvedValue(created);
    transactionsApi.fetchTransactions
      .mockResolvedValueOnce(paginated([salary]))
      .mockResolvedValue(paginated([created, salary]));

    const user = userEvent.setup();

    renderPage();

    await screen.findByRole("article", { name: "Salary" });
    await user.click(screen.getByRole("button", { name: "Add transaction" }));
    await waitForOptions();
    await fillCreateForm(user);

    await user.click(
      screen.getByRole("button", { name: "Create transaction" }),
    );

    await waitFor(() =>
      expect(transactionsApi.createTransactionMutation).toHaveBeenCalledWith({
        type: "EXPENSE",
        amount: 25,
        description: "Lunch",
        date: "2026-09-20",
        accountId: 1,
        categoryId: expenseCategory.id,
      }),
    );

    expect(
      transactionsApi.createTransactionMutation.mock.calls[0][0],
    ).not.toHaveProperty("userId");

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Transaction created.",
    );
    expect(
      await screen.findByRole("article", { name: "Lunch" }),
    ).toBeInTheDocument();
    expect(accountsApi.fetchAccounts.mock.calls.length).toBeGreaterThanOrEqual(
      2,
    );
  });

  it("creates an income transaction with an income category", async () => {
    const created: Transaction = {
      ...salary,
      id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
      description: "Bonus",
      amount: "500",
    };

    transactionsApi.createTransactionMutation.mockResolvedValue(created);

    const user = userEvent.setup();

    renderPage();

    await screen.findByRole("article", { name: "Salary" });
    await user.click(screen.getByRole("button", { name: "Add transaction" }));
    await waitForOptions();
    await fillCreateForm(user, {
      type: "INCOME",
      amount: "500",
      description: "Bonus",
      categoryId: incomeCategory.id,
    });

    await user.click(
      screen.getByRole("button", { name: "Create transaction" }),
    );

    await waitFor(() =>
      expect(transactionsApi.createTransactionMutation).toHaveBeenCalledWith({
        type: "INCOME",
        amount: 500,
        description: "Bonus",
        date: "2026-09-20",
        accountId: 1,
        categoryId: incomeCategory.id,
      }),
    );
  });

  it("shows required field validation and does not submit", async () => {
    const user = userEvent.setup();

    renderPage();

    await screen.findByRole("article", { name: "Salary" });
    await user.click(screen.getByRole("button", { name: "Add transaction" }));
    await waitForOptions();

    await user.click(
      screen.getByRole("button", { name: "Create transaction" }),
    );

    expect(await screen.findByText("Amount is required")).toBeInTheDocument();
    expect(screen.getByText("Select an account")).toBeInTheDocument();
    expect(screen.getByText("Select a category")).toBeInTheDocument();
    expect(transactionsApi.createTransactionMutation).not.toHaveBeenCalled();
  });

  it("rejects a non-positive amount", async () => {
    const user = userEvent.setup();

    renderPage();

    await screen.findByRole("article", { name: "Salary" });
    await user.click(screen.getByRole("button", { name: "Add transaction" }));
    await waitForOptions();

    await user.type(screen.getByLabelText("Amount"), "-5");
    await user.selectOptions(screen.getByLabelText("Account"), "1");
    await user.selectOptions(
      screen.getByLabelText("Category"),
      expenseCategory.id,
    );
    await user.click(
      screen.getByRole("button", { name: "Create transaction" }),
    );

    expect(
      await screen.findByText("Amount must be greater than 0"),
    ).toBeInTheDocument();
    expect(transactionsApi.createTransactionMutation).not.toHaveBeenCalled();
  });

  it("validates the transaction date", async () => {
    const user = userEvent.setup();

    renderPage();

    await screen.findByRole("article", { name: "Salary" });
    await user.click(screen.getByRole("button", { name: "Add transaction" }));
    await waitForOptions();

    fireEvent.change(screen.getByLabelText("Date"), {
      target: { value: "" },
    });
    await user.type(screen.getByLabelText("Amount"), "10");
    await user.selectOptions(screen.getByLabelText("Account"), "1");
    await user.selectOptions(
      screen.getByLabelText("Category"),
      expenseCategory.id,
    );
    await user.click(
      screen.getByRole("button", { name: "Create transaction" }),
    );

    expect(await screen.findByText("Date is required")).toBeInTheDocument();
    expect(transactionsApi.createTransactionMutation).not.toHaveBeenCalled();
  });

  it("filters categories by type and clears an incompatible selection", async () => {
    const user = userEvent.setup();

    renderPage();

    await screen.findByRole("article", { name: "Salary" });
    await user.click(screen.getByRole("button", { name: "Add transaction" }));
    await waitForOptions();

    const categorySelect = screen.getByLabelText("Category");

    expect(
      within(categorySelect).queryByRole("option", { name: "Salary" }),
    ).not.toBeInTheDocument();

    await user.selectOptions(
      screen.getByLabelText("Transaction type"),
      "INCOME",
    );

    const incomeOptions = within(screen.getByLabelText("Category"));

    expect(
      incomeOptions.getByRole("option", { name: "Salary" }),
    ).toBeInTheDocument();
    expect(
      incomeOptions.queryByRole("option", { name: "Food" }),
    ).not.toBeInTheDocument();

    await user.selectOptions(
      screen.getByLabelText("Category"),
      incomeCategory.id,
    );

    expect(screen.getByLabelText("Category")).toHaveValue(incomeCategory.id);

    await user.selectOptions(
      screen.getByLabelText("Transaction type"),
      "EXPENSE",
    );

    await waitFor(() =>
      expect(screen.getByLabelText("Category")).toHaveValue(""),
    );
  });

  it("shows insufficient balance errors and keeps the form open", async () => {
    transactionsApi.createTransactionMutation.mockRejectedValue(
      new ApiError(400, "Insufficient account balance", "INSUFFICIENT_BALANCE"),
    );

    const user = userEvent.setup();

    renderPage();

    await screen.findByRole("article", { name: "Salary" });
    await user.click(screen.getByRole("button", { name: "Add transaction" }));
    await waitForOptions();
    await fillCreateForm(user);
    await user.click(
      screen.getByRole("button", { name: "Create transaction" }),
    );

    expect(
      await screen.findByText(
        "Insufficient account balance for this expense.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Add transaction" }),
    ).toBeInTheDocument();
  });

  it("shows backend validation errors", async () => {
    transactionsApi.createTransactionMutation.mockRejectedValue(
      new ApiError(400, "Request validation failed", "VALIDATION_ERROR"),
    );

    const user = userEvent.setup();

    renderPage();

    await screen.findByRole("article", { name: "Salary" });
    await user.click(screen.getByRole("button", { name: "Add transaction" }));
    await waitForOptions();
    await fillCreateForm(user);
    await user.click(
      screen.getByRole("button", { name: "Create transaction" }),
    );

    expect(
      await screen.findByText("Please check the form and try again."),
    ).toBeInTheDocument();
  });

  it("prevents duplicate submissions while pending", async () => {
    transactionsApi.createTransactionMutation.mockReturnValue(
      new Promise(() => {}),
    );

    const user = userEvent.setup();

    renderPage();

    await screen.findByRole("article", { name: "Salary" });
    await user.click(screen.getByRole("button", { name: "Add transaction" }));
    await waitForOptions();
    await fillCreateForm(user);

    await user.click(
      screen.getByRole("button", { name: "Create transaction" }),
    );

    const pendingButton = screen.getByRole("button", {
      name: "Creating transaction",
    });

    expect(pendingButton).toBeDisabled();

    await user.click(pendingButton).catch(() => {});

    expect(transactionsApi.createTransactionMutation).toHaveBeenCalledTimes(1);
  });

  it("handles accounts and categories that fail to load", async () => {
    accountsApi.fetchAccounts.mockRejectedValue(
      new ApiError(500, "Internal server error", "INTERNAL_SERVER_ERROR"),
    );
    categoriesApi.fetchCategories.mockRejectedValue(
      new ApiError(500, "Internal server error", "INTERNAL_SERVER_ERROR"),
    );

    const user = userEvent.setup();

    renderPage();

    await screen.findByRole("article", { name: "Salary" });
    await user.click(screen.getByRole("button", { name: "Add transaction" }));

    expect(
      await screen.findByText("Unable to load accounts"),
    ).toBeInTheDocument();
    expect(screen.getByText("Unable to load categories")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create transaction" }),
    ).toBeDisabled();
  });
});

describe("TransactionsPage edit", () => {
  it("loads existing values and updates only supported fields", async () => {
    const updated: Transaction = {
      ...groceries,
      amount: "50",
      description: "Dinner",
      date: "2026-09-21T00:00:00.000Z",
      accountId: 1,
    };

    transactionsApi.fetchTransaction.mockResolvedValue(groceries);
    transactionsApi.updateTransactionMutation.mockResolvedValue(updated);
    transactionsApi.fetchTransactions
      .mockResolvedValueOnce(paginated([groceries, salary]))
      .mockResolvedValue(paginated([updated, salary]));

    const user = userEvent.setup();

    renderPage();

    await screen.findByRole("article", { name: "Groceries" });
    await user.click(screen.getByRole("button", { name: "Edit Groceries" }));

    const panel = await screen.findByRole("region", {
      name: "Edit transaction",
    });

    expect(within(panel).getByLabelText("Amount")).toHaveValue(45.5);
    expect(within(panel).getByLabelText("Description (optional)")).toHaveValue(
      "Groceries",
    );
    expect(within(panel).getByLabelText("Date")).toHaveValue("2026-09-20");
    expect(within(panel).getByLabelText("Account")).toHaveValue("2");
    expect(within(panel).getByLabelText("Category")).toHaveValue(
      expenseCategory.id,
    );
    expect(within(panel).getAllByText("EXPENSE").length).toBeGreaterThan(0);

    const amount = within(panel).getByLabelText("Amount");
    const description = within(panel).getByLabelText("Description (optional)");

    await user.clear(amount);
    await user.type(amount, "50");
    await user.clear(description);
    await user.type(description, "Dinner");
    fireEvent.change(within(panel).getByLabelText("Date"), {
      target: { value: "2026-09-21" },
    });
    await user.selectOptions(within(panel).getByLabelText("Account"), "1");
    await user.selectOptions(
      within(panel).getByLabelText("Category"),
      expenseCategory.id,
    );

    await user.click(
      within(panel).getByRole("button", { name: "Save changes" }),
    );

    await waitFor(() =>
      expect(
        transactionsApi.updateTransactionMutation,
      ).toHaveBeenCalledWith(groceries.id, {
        amount: 50,
        description: "Dinner",
        date: "2026-09-21",
        accountId: 1,
        categoryId: expenseCategory.id,
      }),
    );

    const payload = transactionsApi.updateTransactionMutation.mock.calls[0][1];

    expect(payload).not.toHaveProperty("type");
    expect(payload).not.toHaveProperty("userId");
    expect(payload).not.toHaveProperty("id");

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Transaction updated.",
    );
    expect(
      await screen.findByRole("article", { name: "Dinner" }),
    ).toBeInTheDocument();
    expect(accountsApi.fetchAccounts.mock.calls.length).toBeGreaterThanOrEqual(
      2,
    );
  });

  it("only offers categories compatible with the transaction type", async () => {
    const user = userEvent.setup();

    renderPage();

    await screen.findByRole("article", { name: "Groceries" });
    await user.click(screen.getByRole("button", { name: "Edit Groceries" }));

    const panel = await screen.findByRole("region", {
      name: "Edit transaction",
    });
    const categorySelect = within(panel).getByLabelText("Category");

    expect(
      within(categorySelect).queryByRole("option", { name: "Salary" }),
    ).not.toBeInTheDocument();
    expect(
      within(categorySelect).getByRole("option", { name: "Food" }),
    ).toBeInTheDocument();
  });

  it("shows backend validation errors and keeps the form open", async () => {
    transactionsApi.updateTransactionMutation.mockRejectedValue(
      new ApiError(400, "Request validation failed", "VALIDATION_ERROR"),
    );

    const user = userEvent.setup();

    renderPage();

    await screen.findByRole("article", { name: "Groceries" });
    await user.click(screen.getByRole("button", { name: "Edit Groceries" }));

    const panel = await screen.findByRole("region", {
      name: "Edit transaction",
    });

    await user.clear(within(panel).getByLabelText("Amount"));
    await user.type(within(panel).getByLabelText("Amount"), "60");
    await user.click(
      within(panel).getByRole("button", { name: "Save changes" }),
    );

    expect(
      await screen.findByText("Please check the form and try again."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Edit transaction" }),
    ).toBeInTheDocument();
  });

  it("shows insufficient balance errors", async () => {
    transactionsApi.updateTransactionMutation.mockRejectedValue(
      new ApiError(400, "Insufficient account balance", "INSUFFICIENT_BALANCE"),
    );

    const user = userEvent.setup();

    renderPage();

    await screen.findByRole("article", { name: "Groceries" });
    await user.click(screen.getByRole("button", { name: "Edit Groceries" }));

    const panel = await screen.findByRole("region", {
      name: "Edit transaction",
    });

    await user.clear(within(panel).getByLabelText("Amount"));
    await user.type(within(panel).getByLabelText("Amount"), "60");
    await user.click(
      within(panel).getByRole("button", { name: "Save changes" }),
    );

    expect(
      await screen.findByText(
        "Insufficient account balance for this expense.",
      ),
    ).toBeInTheDocument();
  });

  it("shows a missing-resource error", async () => {
    transactionsApi.fetchTransaction.mockRejectedValue(
      new ApiError(404, "Transaction not found", "TRANSACTION_NOT_FOUND"),
    );

    const user = userEvent.setup();

    renderPage();

    await screen.findByRole("article", { name: "Groceries" });
    await user.click(screen.getByRole("button", { name: "Edit Groceries" }));

    expect(
      await screen.findByText("This transaction could not be found."),
    ).toBeInTheDocument();
  });

  it("shows general API failures", async () => {
    transactionsApi.updateTransactionMutation.mockRejectedValue(
      new ApiError(500, "Internal server error", "INTERNAL_SERVER_ERROR"),
    );

    const user = userEvent.setup();

    renderPage();

    await screen.findByRole("article", { name: "Groceries" });
    await user.click(screen.getByRole("button", { name: "Edit Groceries" }));

    const panel = await screen.findByRole("region", {
      name: "Edit transaction",
    });

    await user.clear(within(panel).getByLabelText("Amount"));
    await user.type(within(panel).getByLabelText("Amount"), "60");
    await user.click(
      within(panel).getByRole("button", { name: "Save changes" }),
    );

    expect(
      await screen.findByText("Something went wrong. Please try again."),
    ).toBeInTheDocument();
  });
});

describe("TransactionsPage delete", () => {
  it("asks for confirmation and cancellation does not delete", async () => {
    const user = userEvent.setup();

    renderPage();

    await screen.findByRole("article", { name: "Groceries" });
    await user.click(screen.getByRole("button", { name: "Delete Groceries" }));

    const dialog = screen.getByRole("alertdialog");

    expect(
      within(dialog).getByText(/Are you sure you want to delete/),
    ).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(transactionsApi.deleteTransactionMutation).not.toHaveBeenCalled();
  });

  it("deletes the transaction and refreshes transaction and account queries", async () => {
    transactionsApi.fetchTransactions
      .mockResolvedValueOnce(paginated([groceries, salary]))
      .mockResolvedValue(paginated([salary]));

    const user = userEvent.setup();

    renderPage();

    await screen.findByRole("article", { name: "Groceries" });
    await user.click(screen.getByRole("button", { name: "Delete Groceries" }));

    const dialog = screen.getByRole("alertdialog");

    await user.click(
      within(dialog).getByRole("button", { name: "Delete transaction" }),
    );

    await waitFor(() =>
      expect(transactionsApi.deleteTransactionMutation).toHaveBeenCalledWith(
        groceries.id,
      ),
    );

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Transaction deleted.",
    );
    await waitFor(() =>
      expect(
        screen.queryByRole("article", { name: "Groceries" }),
      ).not.toBeInTheDocument(),
    );
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(accountsApi.fetchAccounts.mock.calls.length).toBeGreaterThanOrEqual(
      2,
    );
  });

  it("keeps the row and dialog open when deletion fails", async () => {
    transactionsApi.deleteTransactionMutation.mockRejectedValue(
      new ApiError(404, "Transaction not found", "TRANSACTION_NOT_FOUND"),
    );

    const user = userEvent.setup();

    renderPage();

    await screen.findByRole("article", { name: "Groceries" });
    await user.click(screen.getByRole("button", { name: "Delete Groceries" }));

    const dialog = screen.getByRole("alertdialog");

    await user.click(
      within(dialog).getByRole("button", { name: "Delete transaction" }),
    );

    expect(
      await within(dialog).findByText("This transaction could not be found."),
    ).toBeInTheDocument();
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(
      screen.getByRole("article", { name: "Groceries" }),
    ).toBeInTheDocument();
    expect(transactionsApi.fetchTransactions).toHaveBeenCalledTimes(1);
  });
});
