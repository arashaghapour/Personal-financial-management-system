import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BudgetsPage } from "./BudgetsPage";

import { ApiError } from "../lib/api/client";

import {
  createBudgetMutation,
  deleteBudgetMutation,
  fetchBudget,
  fetchBudgetProgress,
  fetchBudgets,
  updateBudgetMutation,
} from "../features/budgets/api/budgets.queries";
import { fetchCategories } from "../features/categories/api/categories.queries";

import type { Budget, BudgetProgress } from "../features/budgets/types";
import type { Category } from "../features/categories/types";

vi.mock("../features/budgets/api/budgets.queries", () => ({
  fetchBudgets: vi.fn(),
  fetchBudget: vi.fn(),
  fetchBudgetProgress: vi.fn(),
  createBudgetMutation: vi.fn(),
  updateBudgetMutation: vi.fn(),
  deleteBudgetMutation: vi.fn(),
}));

vi.mock("../features/categories/api/categories.queries", () => ({
  fetchCategories: vi.fn(),
}));

const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth() + 1;
const otherMonth = currentMonth === 1 ? 2 : 1;
const previousYear = currentYear - 1;

const FOOD_ID = "11111111-1111-4111-8111-111111111111";
const TRANSPORT_ID = "33333333-3333-4333-8333-333333333333";
const SALARY_ID = "44444444-4444-4444-8444-444444444444";
const FOOD_BUDGET_ID = "22222222-2222-4222-8222-222222222222";
const TRANSPORT_BUDGET_ID = "55555555-5555-4555-8555-555555555555";

const makeCategory = (
  id: string,
  name: string,
  type: Category["type"],
): Category => ({
  id,
  userId: 42,
  name,
  normalizedName: name.toLowerCase(),
  type,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
});

const food = makeCategory(FOOD_ID, "Food", "EXPENSE");
const transport = makeCategory(TRANSPORT_ID, "Transport", "EXPENSE");
const salary = makeCategory(SALARY_ID, "Salary", "INCOME");

const makeBudget = (overrides: Partial<Budget> = {}): Budget => ({
  id: FOOD_BUDGET_ID,
  userId: 42,
  categoryId: FOOD_ID,
  amount: "1000.00",
  year: currentYear,
  month: currentMonth,
  startDate: `${currentYear}-${String(currentMonth).padStart(2, "0")}-01T00:00:00.000Z`,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

const foodBudget = makeBudget();
const transportBudget = makeBudget({
  id: TRANSPORT_BUDGET_ID,
  categoryId: TRANSPORT_ID,
  amount: "300.00",
  month: otherMonth,
});

const foodProgress: BudgetProgress = {
  budgetId: FOOD_BUDGET_ID,
  budgetAmount: 1000,
  spentAmount: 650,
  remainingAmount: 350,
  percentageUsed: 65,
  status: "UNDER_BUDGET",
};

const transportProgress: BudgetProgress = {
  budgetId: TRANSPORT_BUDGET_ID,
  budgetAmount: 300,
  spentAmount: 300,
  remainingAmount: 0,
  percentageUsed: 100,
  status: "NEAR_LIMIT",
};

const renderPage = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BudgetsPage />
    </QueryClientProvider>,
  );
};

const findFoodCard = async (): Promise<HTMLElement> =>
  screen.findByRole("article", { name: "Food" });

const openCreateForm = async () => {
  const user = userEvent.setup();

  renderPage();
  await screen.findByRole("heading", { name: "Budgets", level: 1 });
  await user.click(screen.getByRole("button", { name: "Add budget" }));

  return {
    user,
    form: screen.getByRole("region", { name: "Add budget" }),
  };
};

const fillCreateForm = async (
  user: ReturnType<typeof userEvent.setup>,
  form: HTMLElement,
  values: { categoryId?: string; amount?: string; year?: string } = {},
) => {
  const categoryId = values.categoryId ?? FOOD_ID;

  await within(form).findByRole("option", { name: "Food" });
  await user.selectOptions(
    within(form).getByLabelText("Category"),
    categoryId,
  );

  await user.type(
    within(form).getByLabelText("Budget amount"),
    values.amount ?? "1200",
  );

  if (values.year !== undefined) {
    const yearInput = within(form).getByLabelText("Year");
    await user.clear(yearInput);
    await user.type(yearInput, values.year);
  }
};

beforeEach(() => {
  vi.mocked(fetchBudgets).mockReset().mockResolvedValue([foodBudget]);
  vi.mocked(fetchBudget).mockReset().mockResolvedValue(foodBudget);
  vi.mocked(fetchBudgetProgress)
    .mockReset()
    .mockImplementation(async (id: string) =>
      id === TRANSPORT_BUDGET_ID ? transportProgress : foodProgress,
    );
  vi.mocked(fetchCategories)
    .mockReset()
    .mockResolvedValue([food, transport, salary]);
  vi.mocked(createBudgetMutation).mockReset().mockResolvedValue(foodBudget);
  vi.mocked(updateBudgetMutation).mockReset().mockResolvedValue(foodBudget);
  vi.mocked(deleteBudgetMutation).mockReset().mockResolvedValue(undefined);
});

describe("BudgetsPage", () => {
  it("shows a loading state while budgets load", () => {
    vi.mocked(fetchBudgets).mockReturnValue(new Promise(() => {}));

    renderPage();

    expect(screen.getByText("Loading budgets...")).toBeInTheDocument();
  });

  it("lists budgets with backend progress data", async () => {
    renderPage();

    const card = await findFoodCard();

    expect(within(card).getByText("$1,000.00")).toBeInTheDocument();
    expect(within(card).getByText("$650.00")).toBeInTheDocument();
    expect(within(card).getByText("$350.00")).toBeInTheDocument();
    expect(within(card).getByText("65% used")).toBeInTheDocument();
    expect(within(card).getByText("Under budget")).toBeInTheDocument();
    expect(
      within(card).getByRole("progressbar", { name: "Food budget usage" }),
    ).toBeInTheDocument();
  });

  it("shows an empty state when no budgets match the period", async () => {
    vi.mocked(fetchBudgets).mockResolvedValue([]);

    renderPage();

    expect(
      await screen.findByText("No budgets for this period"),
    ).toBeInTheDocument();
  });

  it("shows a list error and retries the request", async () => {
    vi.mocked(fetchBudgets)
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce([foodBudget]);

    renderPage();

    expect(await screen.findByText("Unable to load budgets")).toBeInTheDocument();

    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Try again" }));

    expect(await findFoodCard()).toBeInTheDocument();
  });

  it("filters by month, year, and expense category", async () => {
    const user = userEvent.setup();
    renderPage();

    await findFoodCard();

    expect(fetchBudgets).toHaveBeenCalledWith({
      year: currentYear,
      month: currentMonth,
    });

    await user.selectOptions(
      screen.getByLabelText("Filter month"),
      String(otherMonth),
    );

    await waitFor(() =>
      expect(fetchBudgets).toHaveBeenLastCalledWith({
        year: currentYear,
        month: otherMonth,
      }),
    );

    const yearInput = screen.getByLabelText("Filter year");
    await user.clear(yearInput);
    await user.type(yearInput, String(previousYear));

    await waitFor(() =>
      expect(fetchBudgets).toHaveBeenLastCalledWith({
        year: previousYear,
        month: otherMonth,
      }),
    );

    await user.selectOptions(screen.getByLabelText("Filter category"), FOOD_ID);

    await waitFor(() =>
      expect(fetchBudgets).toHaveBeenLastCalledWith({
        year: previousYear,
        month: otherMonth,
        categoryId: FOOD_ID,
      }),
    );
  });

  it("shows results for the newly selected period without stale budgets", async () => {
    vi.mocked(fetchBudgets).mockImplementation(async (filters = {}) =>
      filters.month === currentMonth ? [foodBudget] : [transportBudget],
    );

    const user = userEvent.setup();
    renderPage();

    await findFoodCard();

    await user.selectOptions(
      screen.getByLabelText("Filter month"),
      String(otherMonth),
    );

    const transportCard = await screen.findByRole("article", {
      name: "Transport",
    });
    expect(within(transportCard).getByText("100% used")).toBeInTheDocument();
    expect(
      screen.queryByRole("article", { name: "Food" }),
    ).not.toBeInTheDocument();
    expect(fetchBudgets).toHaveBeenLastCalledWith({
      year: currentYear,
      month: otherMonth,
    });
  });

  it("only offers expense categories to filter and create budgets", async () => {
    const { form } = await openCreateForm();

    await within(form).findByRole("option", { name: "Food" });

    expect(
      within(form).queryByRole("option", { name: "Salary" }),
    ).not.toBeInTheDocument();
    expect(
      within(screen.getByLabelText("Filter category")).queryByRole("option", {
        name: "Salary",
      }),
    ).not.toBeInTheDocument();
  });

  it("uses the selected filter period as the create default", async () => {
    const user = userEvent.setup();
    renderPage();

    await findFoodCard();
    await user.selectOptions(
      screen.getByLabelText("Filter month"),
      String(otherMonth),
    );
    await waitFor(() =>
      expect(fetchBudgets).toHaveBeenLastCalledWith({
        year: currentYear,
        month: otherMonth,
      }),
    );

    await user.click(screen.getByRole("button", { name: "Add budget" }));

    const form = screen.getByRole("region", { name: "Add budget" });

    expect(within(form).getByLabelText("Month")).toHaveValue(
      String(otherMonth),
    );
    expect(within(form).getByLabelText("Year")).toHaveValue(currentYear);
  });

  it("explains when no expense categories are available", async () => {
    vi.mocked(fetchCategories).mockResolvedValue([salary]);

    const { form } = await openCreateForm();

    expect(
      await within(form).findByText(
        "No expense categories are available. Create an expense category before adding a budget.",
      ),
    ).toBeInTheDocument();
    expect(
      within(form).getByRole("button", { name: "Create budget" }),
    ).toBeDisabled();
  });

  it("creates a budget and refreshes the list", async () => {
    const { user, form } = await openCreateForm();
    await fillCreateForm(user, form);

    await user.click(
      within(form).getByRole("button", { name: "Create budget" }),
    );

    await waitFor(() =>
      expect(createBudgetMutation).toHaveBeenCalledWith({
        categoryId: FOOD_ID,
        amount: 1200,
        year: currentYear,
        month: currentMonth,
      }),
    );

    expect(vi.mocked(createBudgetMutation).mock.calls[0]?.[0]).not.toHaveProperty(
      "userId",
    );

    expect(await screen.findByText("Budget created.")).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.queryByRole("region", { name: "Add budget" }),
      ).not.toBeInTheDocument(),
    );
    expect(vi.mocked(fetchBudgets).mock.calls.length).toBeGreaterThan(1);
  });

  it("validates create form fields before submitting", async () => {
    const { user, form } = await openCreateForm();

    await user.click(
      within(form).getByRole("button", { name: "Create budget" }),
    );

    expect(
      await within(form).findByText("Select a category", {
        selector: "#budget-category-error",
      }),
    ).toBeInTheDocument();
    expect(
      within(form).getByText("Budget amount is required"),
    ).toBeInTheDocument();
    expect(createBudgetMutation).not.toHaveBeenCalled();
  });

  it("rejects a non-positive create amount", async () => {
    const { user, form } = await openCreateForm();

    await fillCreateForm(user, form, { amount: "0" });
    await user.click(
      within(form).getByRole("button", { name: "Create budget" }),
    );

    expect(
      await within(form).findByText("Amount must be greater than 0"),
    ).toBeInTheDocument();
    expect(createBudgetMutation).not.toHaveBeenCalled();
  });

  it("rejects an invalid create year", async () => {
    const { user, form } = await openCreateForm();

    await fillCreateForm(user, form, { year: "0" });
    await user.click(
      within(form).getByRole("button", { name: "Create budget" }),
    );

    expect(
      await within(form).findByText("Enter a valid year"),
    ).toBeInTheDocument();
    expect(createBudgetMutation).not.toHaveBeenCalled();
  });

  it("shows the duplicate budget error and keeps the form open", async () => {
    vi.mocked(createBudgetMutation).mockRejectedValueOnce(
      new ApiError(
        409,
        "A budget already exists for this category and month.",
        "DUPLICATE_BUDGET",
      ),
    );

    const { user, form } = await openCreateForm();
    await fillCreateForm(user, form);
    await user.click(
      within(form).getByRole("button", { name: "Create budget" }),
    );

    expect(
      await within(form).findByText(
        "A budget already exists for this category and month.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Add budget" }),
    ).toBeInTheDocument();
  });

  it("maps backend validation errors to a form error", async () => {
    vi.mocked(createBudgetMutation).mockRejectedValueOnce(
      new ApiError(400, "Invalid request body", "VALIDATION_ERROR"),
    );

    const { user, form } = await openCreateForm();
    await fillCreateForm(user, form);
    await user.click(
      within(form).getByRole("button", { name: "Create budget" }),
    );

    expect(
      await within(form).findByText("Please check the form and try again."),
    ).toBeInTheDocument();
    expect(createBudgetMutation).toHaveBeenCalledTimes(1);
  });

  it("disables budget creation when expense categories fail to load", async () => {
    vi.mocked(fetchCategories).mockRejectedValueOnce(new Error("network"));

    const { form } = await openCreateForm();

    expect(
      await within(form).findByText("Unable to load expense categories"),
    ).toBeInTheDocument();
    expect(
      within(form).getByRole("button", { name: "Create budget" }),
    ).toBeDisabled();
  });

  it("prevents duplicate submissions while create is pending", async () => {
    vi.mocked(createBudgetMutation).mockReturnValue(new Promise(() => {}));

    const { user, form } = await openCreateForm();
    await fillCreateForm(user, form);

    await user.click(
      within(form).getByRole("button", { name: "Create budget" }),
    );

    const pendingButton = await within(form).findByRole("button", {
      name: "Creating budget...",
    });

    expect(pendingButton).toBeDisabled();
    expect(createBudgetMutation).toHaveBeenCalledTimes(1);
  });

  it("edits only the budget amount", async () => {
    const user = userEvent.setup();
    renderPage();

    await findFoodCard();
    await user.click(
      screen.getByRole("button", { name: "Edit Food budget" }),
    );

    const panel = await screen.findByRole("region", { name: "Edit budget" });
    const amountInput = await within(panel).findByLabelText("Budget amount");

    await user.clear(amountInput);
    await user.type(amountInput, "1500");
    await user.click(
      within(panel).getByRole("button", { name: "Save changes" }),
    );

    await waitFor(() =>
      expect(updateBudgetMutation).toHaveBeenCalledWith(FOOD_BUDGET_ID, {
        amount: 1500,
      }),
    );

    expect(vi.mocked(updateBudgetMutation).mock.calls[0]?.[1]).not.toHaveProperty(
      "categoryId",
    );
    expect(await screen.findByText("Budget updated.")).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.queryByRole("region", { name: "Edit budget" }),
      ).not.toBeInTheDocument(),
    );
    expect(
      vi.mocked(fetchBudgetProgress).mock.calls.length,
    ).toBeGreaterThan(1);
  });

  it("validates the edited amount", async () => {
    const user = userEvent.setup();
    renderPage();

    await findFoodCard();
    await user.click(
      screen.getByRole("button", { name: "Edit Food budget" }),
    );

    const panel = await screen.findByRole("region", { name: "Edit budget" });
    const amountInput = await within(panel).findByLabelText("Budget amount");

    await user.clear(amountInput);
    await user.type(amountInput, "0");
    await user.click(
      within(panel).getByRole("button", { name: "Save changes" }),
    );

    expect(
      await within(panel).findByText("Amount must be greater than 0"),
    ).toBeInTheDocument();
    expect(updateBudgetMutation).not.toHaveBeenCalled();
  });

  it("shows an error when the budget being edited no longer exists", async () => {
    vi.mocked(fetchBudget).mockRejectedValueOnce(
      new ApiError(404, "Budget not found", "NOT_FOUND"),
    );

    const user = userEvent.setup();
    renderPage();

    await findFoodCard();
    await user.click(
      screen.getByRole("button", { name: "Edit Food budget" }),
    );

    expect(
      await screen.findByText("This budget could not be found."),
    ).toBeInTheDocument();
  });

  it("keeps the edit panel open when saving fails", async () => {
    vi.mocked(updateBudgetMutation).mockRejectedValueOnce(
      new ApiError(500, "Internal server error", "INTERNAL_ERROR"),
    );

    const user = userEvent.setup();
    renderPage();

    await findFoodCard();
    await user.click(
      screen.getByRole("button", { name: "Edit Food budget" }),
    );

    const panel = await screen.findByRole("region", { name: "Edit budget" });
    await within(panel).findByLabelText("Budget amount");
    await user.click(
      within(panel).getByRole("button", { name: "Save changes" }),
    );

    expect(
      await within(panel).findByText("Something went wrong. Please try again."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Edit budget" }),
    ).toBeInTheDocument();
  });

  it("cancels deletion without calling the API", async () => {
    const user = userEvent.setup();
    renderPage();

    await findFoodCard();
    await user.click(
      screen.getByRole("button", { name: "Delete Food budget" }),
    );

    const dialog = screen.getByRole("alertdialog", { name: "Delete budget" });
    expect(within(dialog).getByText("Food")).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

    expect(
      screen.queryByRole("alertdialog", { name: "Delete budget" }),
    ).not.toBeInTheDocument();
    expect(deleteBudgetMutation).not.toHaveBeenCalled();
  });

  it("deletes a budget and removes it from the list", async () => {
    vi.mocked(fetchBudgets)
      .mockResolvedValueOnce([foodBudget])
      .mockResolvedValueOnce([]);

    const user = userEvent.setup();
    renderPage();

    await findFoodCard();
    await user.click(
      screen.getByRole("button", { name: "Delete Food budget" }),
    );

    const dialog = screen.getByRole("alertdialog", { name: "Delete budget" });
    await user.click(
      within(dialog).getByRole("button", { name: "Delete budget" }),
    );

    await waitFor(() =>
      expect(deleteBudgetMutation).toHaveBeenCalledWith(FOOD_BUDGET_ID),
    );

    expect(await screen.findByText("Budget deleted.")).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.queryByRole("article", { name: "Food" }),
      ).not.toBeInTheDocument(),
    );
    expect(vi.mocked(fetchBudgets).mock.calls.length).toBeGreaterThan(1);
  });

  it("shows a delete error without removing the budget", async () => {
    vi.mocked(deleteBudgetMutation).mockRejectedValueOnce(
      new ApiError(404, "Budget not found", "NOT_FOUND"),
    );

    const user = userEvent.setup();
    renderPage();

    await findFoodCard();
    await user.click(
      screen.getByRole("button", { name: "Delete Food budget" }),
    );

    const dialog = screen.getByRole("alertdialog", { name: "Delete budget" });
    await user.click(
      within(dialog).getByRole("button", { name: "Delete budget" }),
    );

    expect(
      await within(dialog).findByText("This budget could not be found."),
    ).toBeInTheDocument();
    expect(screen.getByRole("article", { name: "Food" })).toBeInTheDocument();
  });

  it("shows a progress loading state per budget", async () => {
    vi.mocked(fetchBudgetProgress).mockReturnValue(new Promise(() => {}));

    renderPage();

    expect(
      await screen.findByText("Loading budget progress..."),
    ).toBeInTheDocument();
  });

  it("retries a failed progress request", async () => {
    vi.mocked(fetchBudgetProgress)
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce(foodProgress);

    const user = userEvent.setup();
    renderPage();

    const card = await findFoodCard();

    expect(
      await within(card).findByText("Unable to load budget progress"),
    ).toBeInTheDocument();

    await user.click(
      within(card).getByRole("button", { name: "Retry progress" }),
    );

    expect(await within(card).findByText("65% used")).toBeInTheDocument();
    expect(fetchBudgetProgress).toHaveBeenCalledTimes(2);
  });
});
