import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import AccountsPage from "./AccountsPage";

import * as accountQueries from "../features/accounts/api/accounts.queries";
import { ApiError } from "../lib/api/client";
import type { Account } from "../features/accounts/types";

vi.mock("../features/accounts/api/accounts.queries");

const queries = vi.mocked(accountQueries);

const checking: Account = {
  id: 1,
  userId: 42,
  name: "Checking",
  type: "BANK",
  balance: "1250.5",
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

beforeEach(() => {
  vi.clearAllMocks();

  queries.fetchAccounts.mockResolvedValue(accounts);
  queries.fetchAccount.mockResolvedValue(checking);
  queries.createAccountMutation.mockResolvedValue(checking);
  queries.updateAccountMutation.mockResolvedValue(checking);
  queries.deleteAccountMutation.mockResolvedValue(undefined);
});

describe("AccountsPage list", () => {
  it("shows a loading state while accounts are fetched", () => {
    queries.fetchAccounts.mockReturnValue(new Promise(() => {}));

    render(<AccountsPage />);

    expect(screen.getByText("Loading accounts…")).toBeInTheDocument();
  });

  it("renders account names, types, and formatted balances", async () => {
    render(<AccountsPage />);

    expect(
      await screen.findByRole("heading", { name: "Checking" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Bank account")).toBeInTheDocument();
    expect(screen.getByText("$1,250.50")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Wallet" })).toBeInTheDocument();
    expect(screen.getByText("Cash")).toBeInTheDocument();
    expect(screen.getByText("$200.00")).toBeInTheDocument();
  });

  it("shows an empty state when the user has no accounts", async () => {
    queries.fetchAccounts.mockResolvedValue([]);

    render(<AccountsPage />);

    expect(await screen.findByText("No accounts yet")).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: "Add account" }),
    ).toHaveLength(2);
  });

  it("shows an API error state and retries the request", async () => {
    queries.fetchAccounts
      .mockRejectedValueOnce(
        new ApiError(500, "Internal server error", "INTERNAL_SERVER_ERROR"),
      )
      .mockResolvedValueOnce(accounts);

    render(<AccountsPage />);

    expect(
      await screen.findByText("Unable to load accounts"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Something went wrong. Please try again."),
    ).toBeInTheDocument();

    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(
      await screen.findByRole("heading", { name: "Checking" }),
    ).toBeInTheDocument();
    expect(queries.fetchAccounts).toHaveBeenCalledTimes(2);
  });
});

describe("AccountsPage create", () => {
  const openCreateForm = async (user: ReturnType<typeof userEvent.setup>) => {
    const buttons = screen.getAllByRole("button", { name: "Add account" });

    await user.click(buttons[0]);
  };

  it("creates an account and refreshes the list", async () => {
    const created: Account = {
      ...checking,
      id: 3,
      name: "Brokerage",
      type: "INVESTMENT",
      balance: 250,
    };

    queries.fetchAccounts
      .mockResolvedValueOnce(accounts)
      .mockResolvedValueOnce([...accounts, created]);
    queries.createAccountMutation.mockResolvedValue(created);

    const user = userEvent.setup();

    render(<AccountsPage />);
    await screen.findByRole("heading", { name: "Checking" });
    await openCreateForm(user);

    await user.type(screen.getByLabelText("Account name"), "Brokerage");
    await user.selectOptions(screen.getByLabelText("Account type"), "INVESTMENT");

    const balance = screen.getByLabelText("Initial balance");

    await user.clear(balance);
    await user.type(balance, "250");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() =>
      expect(queries.createAccountMutation).toHaveBeenCalledWith({
        name: "Brokerage",
        type: "INVESTMENT",
        initialBalance: 250,
      }),
    );

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Account created.",
    );
    expect(
      await screen.findByRole("heading", { name: "Brokerage" }),
    ).toBeInTheDocument();
    expect(queries.fetchAccounts).toHaveBeenCalledTimes(2);
  });

  it("validates that the account name is required", async () => {
    const user = userEvent.setup();

    render(<AccountsPage />);
    await screen.findByRole("heading", { name: "Checking" });
    await openCreateForm(user);

    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(
      await screen.findByText("Account name is required"),
    ).toBeInTheDocument();
    expect(queries.createAccountMutation).not.toHaveBeenCalled();
  });

  it("rejects an invalid initial balance", async () => {
    const user = userEvent.setup();

    render(<AccountsPage />);
    await screen.findByRole("heading", { name: "Checking" });
    await openCreateForm(user);

    await user.type(screen.getByLabelText("Account name"), "Cash");

    const balance = screen.getByLabelText("Initial balance");

    await user.clear(balance);
    await user.type(balance, "-5");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(
      await screen.findByText("Initial balance cannot be negative"),
    ).toBeInTheDocument();
    expect(queries.createAccountMutation).not.toHaveBeenCalled();
  });

  it("shows backend validation errors without closing the form", async () => {
    queries.createAccountMutation.mockRejectedValue(
      new ApiError(400, "Request validation failed", "VALIDATION_ERROR"),
    );

    const user = userEvent.setup();

    render(<AccountsPage />);
    await screen.findByRole("heading", { name: "Checking" });
    await openCreateForm(user);

    await user.type(screen.getByLabelText("Account name"), "Cash");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(
      await screen.findByText("Please check the form and try again."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Add account" }),
    ).toBeInTheDocument();
  });

  it("prevents duplicate submissions while the request is pending", async () => {
    queries.createAccountMutation.mockReturnValue(new Promise(() => {}));

    const user = userEvent.setup();

    render(<AccountsPage />);
    await screen.findByRole("heading", { name: "Checking" });
    await openCreateForm(user);

    await user.type(screen.getByLabelText("Account name"), "Cash");

    await user.click(screen.getByRole("button", { name: "Create account" }));

    const pendingButton = screen.getByRole("button", {
      name: "Creating account…",
    });

    expect(pendingButton).toBeDisabled();

    await user.click(pendingButton).catch(() => {});

    expect(queries.createAccountMutation).toHaveBeenCalledTimes(1);
  });
});

describe("AccountsPage edit", () => {
  it("loads the current values and updates the account", async () => {
    const updated: Account = { ...checking, name: "Main Checking", type: "INVESTMENT" };

    queries.fetchAccounts
      .mockResolvedValueOnce(accounts)
      .mockResolvedValueOnce([updated, wallet]);
    queries.updateAccountMutation.mockResolvedValue(updated);

    const user = userEvent.setup();

    render(<AccountsPage />);
    await screen.findByRole("heading", { name: "Checking" });

    await user.click(screen.getByRole("button", { name: "Edit Checking" }));

    const name = await screen.findByLabelText("Account name");

    expect(name).toHaveValue("Checking");
    expect(screen.getByLabelText("Account type")).toHaveValue("BANK");

    await user.clear(name);
    await user.type(name, "Main Checking");
    await user.selectOptions(
      screen.getByLabelText("Account type"),
      "INVESTMENT",
    );
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() =>
      expect(queries.updateAccountMutation).toHaveBeenCalledWith(1, {
        name: "Main Checking",
        type: "INVESTMENT",
      }),
    );

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Account updated.",
    );
    expect(
      await screen.findByRole("heading", { name: "Main Checking" }),
    ).toBeInTheDocument();
  });

  it("does not expose an editable balance field", async () => {
    const user = userEvent.setup();

    render(<AccountsPage />);
    await screen.findByRole("heading", { name: "Checking" });
    await user.click(screen.getByRole("button", { name: "Edit Checking" }));

    await screen.findByLabelText("Account name");

    expect(screen.queryByLabelText(/initial balance/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^balance$/i)).not.toBeInTheDocument();
  });

  it("shows API failures and keeps the edit form open", async () => {
    queries.updateAccountMutation.mockRejectedValue(
      new ApiError(500, "Internal server error", "INTERNAL_SERVER_ERROR"),
    );

    const user = userEvent.setup();

    render(<AccountsPage />);
    await screen.findByRole("heading", { name: "Checking" });
    await user.click(screen.getByRole("button", { name: "Edit Checking" }));

    const name = await screen.findByLabelText("Account name");

    await user.clear(name);
    await user.type(name, "Broken");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(
      await screen.findByText("Something went wrong. Please try again."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Edit account" }),
    ).toBeInTheDocument();
    expect(queries.fetchAccounts).toHaveBeenCalledTimes(1);
  });
});

describe("AccountsPage delete", () => {
  const openDeleteDialog = async (
    user: ReturnType<typeof userEvent.setup>,
  ) => {
    await user.click(screen.getByRole("button", { name: "Delete Checking" }));

    return screen.getByRole("alertdialog");
  };

  it("asks for confirmation and allows cancellation", async () => {
    const user = userEvent.setup();

    render(<AccountsPage />);
    await screen.findByRole("heading", { name: "Checking" });

    const dialog = await openDeleteDialog(user);

    expect(
      within(dialog).getByText(/Are you sure you want to delete/),
    ).toBeInTheDocument();
    expect(within(dialog).getByText("Checking")).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(queries.deleteAccountMutation).not.toHaveBeenCalled();
  });

  it("deletes the account and refreshes the list", async () => {
    queries.fetchAccounts
      .mockResolvedValueOnce(accounts)
      .mockResolvedValueOnce([wallet]);

    const user = userEvent.setup();

    render(<AccountsPage />);
    await screen.findByRole("heading", { name: "Checking" });

    const dialog = await openDeleteDialog(user);

    await user.click(
      within(dialog).getByRole("button", { name: "Delete account" }),
    );

    await waitFor(() =>
      expect(queries.deleteAccountMutation).toHaveBeenCalledWith(1),
    );

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Account deleted.",
    );
    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: "Checking" }),
      ).not.toBeInTheDocument(),
    );
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("removes the account even if the follow-up refresh fails", async () => {
    queries.fetchAccounts
      .mockResolvedValueOnce(accounts)
      .mockRejectedValueOnce(
        new ApiError(500, "Internal server error", "INTERNAL_SERVER_ERROR"),
      );

    const user = userEvent.setup();

    render(<AccountsPage />);
    await screen.findByRole("heading", { name: "Checking" });

    const dialog = await openDeleteDialog(user);

    await user.click(
      within(dialog).getByRole("button", { name: "Delete account" }),
    );

    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: "Checking" }),
      ).not.toBeInTheDocument(),
    );
    expect(screen.getByRole("status")).toHaveTextContent("Account deleted.");
  });

  it("shows the backend rejection when deletion is not permitted", async () => {
    queries.deleteAccountMutation.mockRejectedValue(
      new ApiError(500, "Internal server error", "INTERNAL_SERVER_ERROR"),
    );

    const user = userEvent.setup();

    render(<AccountsPage />);
    await screen.findByRole("heading", { name: "Checking" });

    const dialog = await openDeleteDialog(user);

    await user.click(
      within(dialog).getByRole("button", { name: "Delete account" }),
    );

    expect(
      await screen.findByText(
        "This account cannot be deleted because it is associated with transactions.",
      ),
    ).toBeInTheDocument();

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Checking" }),
    ).toBeInTheDocument();
    expect(queries.fetchAccounts).toHaveBeenCalledTimes(1);
  });
});
