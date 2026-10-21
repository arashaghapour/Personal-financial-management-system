import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import App from "./App";

import { tokenStorage } from "./features/auth/token-storage";
import { mockUser } from "./test/auth-mock";
import { jsonResponse } from "./test/fetch-mock";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  tokenStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  tokenStorage.clear();
});

describe("App", () => {
  it("redirects unauthenticated users from the root route to the login page", async () => {
    render(<App />);

    expect(
      await screen.findByRole("heading", { name: "Sign in", level: 1 }),
    ).toBeInTheDocument();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("restores a stored session and renders the application shell", async () => {
    tokenStorage.setTokens("access-token", "refresh-token");

    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);

      if (url.startsWith("/api/dashboard")) {
        return Promise.resolve(
          jsonResponse({
            totalBalance: 0,
            totalIncome: 0,
            totalExpenses: 0,
            netCashFlow: 0,
            expenseByCategory: [],
            incomeByCategory: [],
            recentTransactions: [],
          }),
        );
      }

      if (
        url.startsWith("/api/accounts") ||
        url.startsWith("/api/categories")
      ) {
        return Promise.resolve(jsonResponse([]));
      }

      return Promise.resolve(jsonResponse(mockUser));
    });

    render(<App />);

    expect(
      await screen.findByRole("heading", { name: "Dashboard", level: 1 }),
    ).toBeInTheDocument();

    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Primary" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByText("Finance Manager")).toBeInTheDocument();
  });
});
