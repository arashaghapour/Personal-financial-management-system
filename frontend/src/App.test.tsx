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

    fetchMock.mockResolvedValue(jsonResponse(mockUser));

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
