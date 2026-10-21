import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import CategoriesPage from "./CategoriesPage";

import * as categoryQueries from "../features/categories/api/categories.queries";
import { ApiError } from "../lib/api/client";
import type { Category } from "../features/categories/types";

vi.mock("../features/categories/api/categories.queries");

const queries = vi.mocked(categoryQueries);

const food: Category = {
  id: "category-food",
  userId: 42,
  name: "Food",
  normalizedName: "food",
  type: "EXPENSE",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const salary: Category = {
  id: "category-salary",
  userId: 42,
  name: "Salary",
  normalizedName: "salary",
  type: "INCOME",
  createdAt: "2026-01-02T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
};

const categories = [food, salary];

beforeEach(() => {
  vi.clearAllMocks();

  queries.fetchCategories.mockResolvedValue(categories);
  queries.fetchCategory.mockResolvedValue(food);
  queries.createCategoryMutation.mockResolvedValue(food);
  queries.updateCategoryMutation.mockResolvedValue(food);
  queries.deleteCategoryMutation.mockResolvedValue(undefined);
});

const renderPage = () => render(<CategoriesPage />);

const waitForList = () =>
  screen.findByRole("heading", { name: "Food" });

describe("CategoriesPage list", () => {
  it("shows a loading state while categories are fetched", () => {
    queries.fetchCategories.mockReturnValue(new Promise(() => {}));

    renderPage();

    expect(screen.getByText("Loading categories…")).toBeInTheDocument();
  });

  it("renders category names and types", async () => {
    renderPage();

    expect(
      await screen.findByRole("heading", { name: "Food" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Salary" }),
    ).toBeInTheDocument();
    expect(screen.getByText("EXPENSE")).toBeInTheDocument();
    expect(screen.getByText("INCOME")).toBeInTheDocument();
  });

  it("shows an empty state when the user has no categories", async () => {
    queries.fetchCategories.mockResolvedValue([]);

    renderPage();

    expect(await screen.findByText("No categories yet")).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: "Add category" }),
    ).toHaveLength(2);
  });

  it("filters by income and expense using the type query parameter", async () => {
    queries.fetchCategories.mockImplementation(async (type) => {
      if (type === "INCOME") {
        return [salary];
      }

      if (type === "EXPENSE") {
        return [food];
      }

      return categories;
    });

    const user = userEvent.setup();

    renderPage();
    await waitForList();

    expect(queries.fetchCategories).toHaveBeenLastCalledWith(undefined);

    await user.click(screen.getByRole("button", { name: "Income" }));

    await waitFor(() =>
      expect(queries.fetchCategories).toHaveBeenLastCalledWith("INCOME"),
    );
    expect(
      await screen.findByRole("heading", { name: "Salary" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Food" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Expense" }));

    await waitFor(() =>
      expect(queries.fetchCategories).toHaveBeenLastCalledWith("EXPENSE"),
    );
    expect(await waitForList()).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Salary" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "All" }));

    await waitFor(() =>
      expect(queries.fetchCategories).toHaveBeenLastCalledWith(undefined),
    );
    expect(
      await screen.findByRole("heading", { name: "Salary" }),
    ).toBeInTheDocument();
  });

  it("exposes accessible, stateful filter controls", async () => {
    const user = userEvent.setup();

    renderPage();
    await waitForList();

    const group = screen.getByRole("group", { name: "Filter categories" });

    expect(within(group).getByRole("button", { name: "All" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await user.click(within(group).getByRole("button", { name: "Income" }));

    expect(
      within(group).getByRole("button", { name: "Income" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(within(group).getByRole("button", { name: "All" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("shows an API error state and retries the request", async () => {
    queries.fetchCategories
      .mockRejectedValueOnce(
        new ApiError(500, "Internal server error", "INTERNAL_SERVER_ERROR"),
      )
      .mockResolvedValueOnce(categories);

    const user = userEvent.setup();

    renderPage();

    expect(
      await screen.findByText("Unable to load categories"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Something went wrong. Please try again."),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(await waitForList()).toBeInTheDocument();
    expect(queries.fetchCategories).toHaveBeenCalledTimes(2);
  });
});

describe("CategoriesPage create", () => {
  const openCreateForm = async (user: ReturnType<typeof userEvent.setup>) => {
    const buttons = screen.getAllByRole("button", { name: "Add category" });

    await user.click(buttons[0]);
  };

  it("creates a category and refreshes the list", async () => {
    const created: Category = {
      ...salary,
      id: "category-freelance",
      name: "Freelance",
      normalizedName: "freelance",
    };

    queries.fetchCategories
      .mockResolvedValueOnce(categories)
      .mockResolvedValueOnce([...categories, created]);
    queries.createCategoryMutation.mockResolvedValue(created);

    const user = userEvent.setup();

    renderPage();
    await waitForList();
    await openCreateForm(user);

    await user.type(screen.getByLabelText("Category name"), "  Freelance  ");
    await user.selectOptions(
      screen.getByLabelText("Category type"),
      "INCOME",
    );
    await user.click(screen.getByRole("button", { name: "Create category" }));

    await waitFor(() =>
      expect(queries.createCategoryMutation).toHaveBeenCalledWith({
        name: "Freelance",
        type: "INCOME",
      }),
    );

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Category created.",
    );
    expect(
      await screen.findByRole("heading", { name: "Freelance" }),
    ).toBeInTheDocument();
    expect(queries.fetchCategories).toHaveBeenCalledTimes(2);
  });

  it("validates that the category name is required", async () => {
    const user = userEvent.setup();

    renderPage();
    await waitForList();
    await openCreateForm(user);

    await user.click(screen.getByRole("button", { name: "Create category" }));

    expect(
      await screen.findByText("Category name is required"),
    ).toBeInTheDocument();
    expect(queries.createCategoryMutation).not.toHaveBeenCalled();
  });

  it("shows the backend duplicate-category response and keeps the form open", async () => {
    queries.createCategoryMutation.mockRejectedValue(
      new ApiError(409, "Category already exists", "CATEGORY_ALREADY_EXISTS"),
    );

    const user = userEvent.setup();

    renderPage();
    await waitForList();
    await openCreateForm(user);

    await user.type(screen.getByLabelText("Category name"), "Food");
    await user.click(screen.getByRole("button", { name: "Create category" }));

    expect(
      await screen.findByText(
        "A category with this name and type already exists.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Add category" }),
    ).toBeInTheDocument();
  });

  it("shows general API errors without closing the form", async () => {
    queries.createCategoryMutation.mockRejectedValue(
      new ApiError(400, "Request validation failed", "VALIDATION_ERROR"),
    );

    const user = userEvent.setup();

    renderPage();
    await waitForList();
    await openCreateForm(user);

    await user.type(screen.getByLabelText("Category name"), "Food");
    await user.click(screen.getByRole("button", { name: "Create category" }));

    expect(
      await screen.findByText("Please check the form and try again."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Add category" }),
    ).toBeInTheDocument();
  });

  it("prevents duplicate submissions while the request is pending", async () => {
    queries.createCategoryMutation.mockReturnValue(new Promise(() => {}));

    const user = userEvent.setup();

    renderPage();
    await waitForList();
    await openCreateForm(user);

    await user.type(screen.getByLabelText("Category name"), "Travel");
    await user.click(screen.getByRole("button", { name: "Create category" }));

    const pendingButton = screen.getByRole("button", {
      name: "Creating category…",
    });

    expect(pendingButton).toBeDisabled();

    await user.click(pendingButton).catch(() => {});

    expect(queries.createCategoryMutation).toHaveBeenCalledTimes(1);
  });
});

describe("CategoriesPage edit", () => {
  it("loads the current values and updates the category", async () => {
    const updated: Category = {
      ...food,
      name: "Groceries",
      normalizedName: "groceries",
      type: "INCOME",
    };

    queries.fetchCategories
      .mockResolvedValueOnce(categories)
      .mockResolvedValueOnce([updated, salary]);
    queries.updateCategoryMutation.mockResolvedValue(updated);

    const user = userEvent.setup();

    renderPage();
    await waitForList();

    await user.click(screen.getByRole("button", { name: "Edit Food" }));

    const name = await screen.findByLabelText("Category name");

    expect(queries.fetchCategory).toHaveBeenCalledWith("category-food");
    expect(name).toHaveValue("Food");
    expect(screen.getByLabelText("Category type")).toHaveValue("EXPENSE");

    await user.clear(name);
    await user.type(name, "Groceries");
    await user.selectOptions(
      screen.getByLabelText("Category type"),
      "INCOME",
    );
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() =>
      expect(queries.updateCategoryMutation).toHaveBeenCalledWith(
        "category-food",
        { name: "Groceries", type: "INCOME" },
      ),
    );

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Category updated.",
    );
    expect(
      await screen.findByRole("heading", { name: "Groceries" }),
    ).toBeInTheDocument();
    expect(queries.fetchCategories).toHaveBeenCalledTimes(2);
  });

  it("shows the backend duplicate-category response", async () => {
    queries.updateCategoryMutation.mockRejectedValue(
      new ApiError(409, "Category already exists", "CATEGORY_ALREADY_EXISTS"),
    );

    const user = userEvent.setup();

    renderPage();
    await waitForList();
    await user.click(screen.getByRole("button", { name: "Edit Food" }));

    const name = await screen.findByLabelText("Category name");

    await user.clear(name);
    await user.type(name, "Salary");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(
      await screen.findByText(
        "A category with this name and type already exists.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Edit category" }),
    ).toBeInTheDocument();
  });

  it("shows backend rejection of a prohibited change and keeps the form open", async () => {
    queries.updateCategoryMutation.mockRejectedValue(
      new ApiError(400, "Request validation failed", "VALIDATION_ERROR"),
    );

    const user = userEvent.setup();

    renderPage();
    await waitForList();
    await user.click(screen.getByRole("button", { name: "Edit Food" }));

    const name = await screen.findByLabelText("Category name");

    await user.clear(name);
    await user.type(name, "Changed");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(
      await screen.findByText("Please check the form and try again."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Edit category" }),
    ).toBeInTheDocument();
    expect(queries.fetchCategories).toHaveBeenCalledTimes(1);
  });

  it("handles a missing category", async () => {
    queries.fetchCategory.mockRejectedValue(
      new ApiError(404, "Category not found", "CATEGORY_NOT_FOUND"),
    );

    const user = userEvent.setup();

    renderPage();
    await waitForList();
    await user.click(screen.getByRole("button", { name: "Edit Food" }));

    expect(
      await screen.findByText("Unable to load category"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("This category could not be found."),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(
      screen.queryByRole("heading", { name: "Edit category" }),
    ).not.toBeInTheDocument();
  });

  it("shows general update API failures without refreshing the list", async () => {
    queries.updateCategoryMutation.mockRejectedValue(
      new ApiError(500, "Internal server error", "INTERNAL_SERVER_ERROR"),
    );

    const user = userEvent.setup();

    renderPage();
    await waitForList();
    await user.click(screen.getByRole("button", { name: "Edit Food" }));

    const name = await screen.findByLabelText("Category name");

    await user.clear(name);
    await user.type(name, "Broken");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(
      await screen.findByText("Something went wrong. Please try again."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Edit category" }),
    ).toBeInTheDocument();
    expect(queries.fetchCategories).toHaveBeenCalledTimes(1);
  });
});

describe("CategoriesPage delete", () => {
  const openDeleteDialog = async (
    user: ReturnType<typeof userEvent.setup>,
  ) => {
    await user.click(screen.getByRole("button", { name: "Delete Food" }));

    return screen.getByRole("alertdialog");
  };

  it("asks for confirmation and allows cancellation", async () => {
    const user = userEvent.setup();

    renderPage();
    await waitForList();

    const dialog = await openDeleteDialog(user);

    expect(
      within(dialog).getByText(/Are you sure you want to delete/),
    ).toBeInTheDocument();
    expect(within(dialog).getByText("Food")).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(queries.deleteCategoryMutation).not.toHaveBeenCalled();
  });

  it("supports closing the confirmation with Escape", async () => {
    const user = userEvent.setup();

    renderPage();
    await waitForList();
    await openDeleteDialog(user);

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(queries.deleteCategoryMutation).not.toHaveBeenCalled();
  });

  it("deletes the category and refreshes the list", async () => {
    queries.fetchCategories
      .mockResolvedValueOnce(categories)
      .mockResolvedValueOnce([salary]);

    const user = userEvent.setup();

    renderPage();
    await waitForList();

    const dialog = await openDeleteDialog(user);

    await user.click(
      within(dialog).getByRole("button", { name: "Delete category" }),
    );

    await waitFor(() =>
      expect(queries.deleteCategoryMutation).toHaveBeenCalledWith(
        "category-food",
      ),
    );

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Category deleted.",
    );
    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: "Food" }),
      ).not.toBeInTheDocument(),
    );
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(queries.fetchCategories).toHaveBeenCalledTimes(2);
  });

  it("shows the backend rejection when deletion is not permitted", async () => {
    queries.deleteCategoryMutation.mockRejectedValue(
      new ApiError(500, "Internal server error", "INTERNAL_SERVER_ERROR"),
    );

    const user = userEvent.setup();

    renderPage();
    await waitForList();

    const dialog = await openDeleteDialog(user);

    await user.click(
      within(dialog).getByRole("button", { name: "Delete category" }),
    );

    expect(
      await screen.findByText(
        "This category cannot be deleted because it is used by existing transactions.",
      ),
    ).toBeInTheDocument();

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Food" }),
    ).toBeInTheDocument();
    expect(queries.fetchCategories).toHaveBeenCalledTimes(1);
  });

  it("removes the category even if the follow-up refresh fails", async () => {
    queries.fetchCategories
      .mockResolvedValueOnce(categories)
      .mockRejectedValueOnce(
        new ApiError(500, "Internal server error", "INTERNAL_SERVER_ERROR"),
      );

    const user = userEvent.setup();

    renderPage();
    await waitForList();

    const dialog = await openDeleteDialog(user);

    await user.click(
      within(dialog).getByRole("button", { name: "Delete category" }),
    );

    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: "Food" }),
      ).not.toBeInTheDocument(),
    );
    expect(screen.getByRole("status")).toHaveTextContent("Category deleted.");
  });

  it("shows a not-found message when the category no longer exists", async () => {
    queries.deleteCategoryMutation.mockRejectedValue(
      new ApiError(404, "Category not found", "CATEGORY_NOT_FOUND"),
    );

    const user = userEvent.setup();

    renderPage();
    await waitForList();

    const dialog = await openDeleteDialog(user);

    await user.click(
      within(dialog).getByRole("button", { name: "Delete category" }),
    );

    expect(
      await screen.findByText("This category could not be found."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Food" }),
    ).toBeInTheDocument();
  });
});
