import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AuthProvider } from "./AuthProvider";
import { useAuth } from "./auth-context";

import { tokenStorage } from "./token-storage";

import {
  errorResponse,
  jsonResponse,
  noContentResponse,
} from "../../test/fetch-mock";
import { mockUser } from "../../test/auth-mock";

const fetchMock = vi.fn();

function AuthProbe() {
  const { status, user, login, register, logout } = useAuth();

  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="user">{user ? user.email : "none"}</span>
      <button
        type="button"
        onClick={() => {
          void login({
            email: "user@example.com",
            password: "password123",
          }).catch(() => {});
        }}
      >
        login
      </button>
      <button
        type="button"
        onClick={() => {
          void register({
            firstName: "New",
            lastName: "User",
            email: "new@example.com",
            password: "password123",
          }).catch(() => {});
        }}
      >
        register
      </button>
      <button
        type="button"
        onClick={() => {
          void logout();
        }}
      >
        logout
      </button>
    </div>
  );
}

const renderProvider = () =>
  render(
    <AuthProvider>
      <AuthProbe />
    </AuthProvider>,
  );

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  tokenStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  tokenStorage.clear();
});

describe("AuthProvider", () => {
  it("stays loading while a stored session is being restored", () => {
    tokenStorage.setTokens("access-token", "refresh-token");

    fetchMock.mockReturnValue(new Promise(() => {}));

    renderProvider();

    expect(screen.getByTestId("status")).toHaveTextContent("loading");
  });

  it("becomes unauthenticated when no tokens are stored", async () => {
    renderProvider();

    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("unauthenticated"),
    );

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("restores the session with GET /auth/me when tokens are stored", async () => {
    tokenStorage.setTokens("access-token", "refresh-token");

    fetchMock.mockResolvedValue(jsonResponse(mockUser));

    renderProvider();

    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("authenticated"),
    );

    expect(screen.getByTestId("user")).toHaveTextContent(mockUser.email);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/me",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer access-token",
        }),
      }),
    );
  });

  it("restores the session by refreshing an expired access token", async () => {
    tokenStorage.setTokens("expired-access", "old-refresh");

    fetchMock
      .mockResolvedValueOnce(
        errorResponse("INVALID_ACCESS_TOKEN", "Invalid access token", 401),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          accessToken: "new-access",
          refreshToken: "new-refresh",
        }),
      )
      .mockResolvedValueOnce(jsonResponse(mockUser));

    renderProvider();

    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("authenticated"),
    );

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(tokenStorage.getAccessToken()).toBe("new-access");
    expect(tokenStorage.getRefreshToken()).toBe("new-refresh");
  });

  it("ends unauthenticated when the session cannot be restored", async () => {
    tokenStorage.setTokens("expired-access", "old-refresh");

    fetchMock
      .mockResolvedValueOnce(
        errorResponse("INVALID_ACCESS_TOKEN", "Invalid access token", 401),
      )
      .mockResolvedValueOnce(
        errorResponse("INVALID_REFRESH_TOKEN", "Invalid refresh token", 401),
      );

    renderProvider();

    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("unauthenticated"),
    );

    expect(screen.getByTestId("user")).toHaveTextContent("none");
    expect(tokenStorage.getAccessToken()).toBeNull();
    expect(tokenStorage.getRefreshToken()).toBeNull();
  });

  it("stores the tokens and sets the authenticated user after login", async () => {
    const user = userEvent.setup();

    fetchMock.mockResolvedValue(
      jsonResponse({
        user: mockUser,
        accessToken: "access-token",
        refreshToken: "refresh-token",
      }),
    );

    renderProvider();

    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("unauthenticated"),
    );

    await user.click(screen.getByRole("button", { name: "login" }));

    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("authenticated"),
    );

    expect(tokenStorage.getAccessToken()).toBe("access-token");
    expect(tokenStorage.getRefreshToken()).toBe("refresh-token");
  });

  it("keeps the user unauthenticated when login fails", async () => {
    const user = userEvent.setup();

    fetchMock.mockResolvedValue(
      errorResponse("INVALID_CREDENTIALS", "Invalid email or password", 401),
    );

    renderProvider();

    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("unauthenticated"),
    );

    await user.click(screen.getByRole("button", { name: "login" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    expect(screen.getByTestId("status")).toHaveTextContent("unauthenticated");
    expect(tokenStorage.getAccessToken()).toBeNull();
  });

  it("does not establish a session after registration", async () => {
    const user = userEvent.setup();

    fetchMock.mockResolvedValue(jsonResponse({ user: mockUser }));

    renderProvider();

    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("unauthenticated"),
    );

    await user.click(screen.getByRole("button", { name: "register" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/register",
      expect.objectContaining({ method: "POST" }),
    );
    expect(screen.getByTestId("status")).toHaveTextContent("unauthenticated");
    expect(tokenStorage.getAccessToken()).toBeNull();
  });

  it("logs out through the API and clears the local session", async () => {
    const user = userEvent.setup();

    tokenStorage.setTokens("access-token", "refresh-token");

    fetchMock
      .mockResolvedValueOnce(jsonResponse(mockUser))
      .mockResolvedValueOnce(noContentResponse());

    renderProvider();

    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("authenticated"),
    );

    await user.click(screen.getByRole("button", { name: "logout" }));

    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("unauthenticated"),
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/auth/logout",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ refreshToken: "refresh-token" }),
        headers: expect.objectContaining({
          Authorization: "Bearer access-token",
        }),
      }),
    );

    expect(tokenStorage.getAccessToken()).toBeNull();
    expect(tokenStorage.getRefreshToken()).toBeNull();
  });

  it("clears the local session even when the logout API fails", async () => {
    const user = userEvent.setup();

    tokenStorage.setTokens("access-token", "refresh-token");

    fetchMock
      .mockResolvedValueOnce(jsonResponse(mockUser))
      .mockResolvedValueOnce(
        errorResponse("INTERNAL_SERVER_ERROR", "Internal server error", 500),
      );

    renderProvider();

    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("authenticated"),
    );

    await user.click(screen.getByRole("button", { name: "logout" }));

    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("unauthenticated"),
    );

    expect(tokenStorage.getAccessToken()).toBeNull();
    expect(tokenStorage.getRefreshToken()).toBeNull();
  });
});
