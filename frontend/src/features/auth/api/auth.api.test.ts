import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getCurrentUser,
  login,
  logout,
  refreshTokens,
  register,
} from "./auth.api";

import { jsonResponse, noContentResponse } from "../../../test/fetch-mock";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("auth api", () => {
  it("register posts to /auth/register", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ user: { id: 1 } }));

    const data = {
      firstName: "Arash",
      lastName: "Aghapour",
      email: "user@example.com",
      password: "password123",
    };

    await register(data);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/register",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(data),
      }),
    );
  });

  it("login posts to /auth/login and returns the tokens", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        user: { id: 1 },
        accessToken: "access",
        refreshToken: "refresh",
      }),
    );

    const result = await login({
      email: "user@example.com",
      password: "password123",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/login",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          email: "user@example.com",
          password: "password123",
        }),
      }),
    );

    expect(result.accessToken).toBe("access");
    expect(result.refreshToken).toBe("refresh");
  });

  it("refreshTokens posts to /auth/refresh with the refresh token", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ accessToken: "new-access", refreshToken: "new-refresh" }),
    );

    const result = await refreshTokens({ refreshToken: "refresh" });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/refresh",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ refreshToken: "refresh" }),
      }),
    );

    expect(result).toEqual({
      accessToken: "new-access",
      refreshToken: "new-refresh",
    });
  });

  it("getCurrentUser calls /auth/me with the bearer token", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ id: 1, email: "user@example.com" }),
    );

    await getCurrentUser("access-token");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/me",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer access-token",
        }),
      }),
    );
  });

  it("logout posts to /auth/logout with the bearer token and refresh token", async () => {
    fetchMock.mockResolvedValue(noContentResponse());

    await logout("access-token", { refreshToken: "refresh-token" });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/logout",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ refreshToken: "refresh-token" }),
        headers: expect.objectContaining({
          Authorization: "Bearer access-token",
        }),
      }),
    );
  });
});
