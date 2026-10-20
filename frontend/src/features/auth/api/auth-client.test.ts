import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  refreshSession,
  requestWithAuth,
  setSessionExpiredHandler,
} from "./auth-client";

import { getCurrentUser } from "./auth.api";

import { tokenStorage } from "../token-storage";

import { ApiError } from "../../../lib/api/client";

import { errorResponse, jsonResponse } from "../../../test/fetch-mock";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  tokenStorage.clear();
  setSessionExpiredHandler(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  tokenStorage.clear();
  setSessionExpiredHandler(() => {});
});

describe("refreshSession", () => {
  it("refreshes and stores the rotated tokens", async () => {
    tokenStorage.setTokens("old-access", "old-refresh");

    fetchMock.mockResolvedValue(
      jsonResponse({ accessToken: "new-access", refreshToken: "new-refresh" }),
    );

    const result = await refreshSession();

    expect(result).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/refresh",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ refreshToken: "old-refresh" }),
      }),
    );
    expect(tokenStorage.getAccessToken()).toBe("new-access");
    expect(tokenStorage.getRefreshToken()).toBe("new-refresh");
  });

  it("clears the session and notifies the handler when refresh fails", async () => {
    tokenStorage.setTokens("access", "refresh");

    const handler = vi.fn();
    setSessionExpiredHandler(handler);

    fetchMock.mockResolvedValue(
      errorResponse("INVALID_REFRESH_TOKEN", "Invalid refresh token", 401),
    );

    const result = await refreshSession();

    expect(result).toBe(false);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(tokenStorage.getAccessToken()).toBeNull();
    expect(tokenStorage.getRefreshToken()).toBeNull();
  });

  it("clears the session without calling the API when no refresh token exists", async () => {
    tokenStorage.setTokens("stale-access", "");

    const handler = vi.fn();
    setSessionExpiredHandler(handler);

    const result = await refreshSession();

    expect(result).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(handler).toHaveBeenCalledTimes(1);
    expect(tokenStorage.getAccessToken()).toBeNull();
    expect(tokenStorage.getRefreshToken()).toBeNull();
  });

  it("shares a single in-flight refresh between concurrent callers", async () => {
    tokenStorage.setTokens("access", "refresh");

    fetchMock.mockResolvedValue(
      jsonResponse({ accessToken: "new-access", refreshToken: "new-refresh" }),
    );

    const [first, second] = await Promise.all([
      refreshSession(),
      refreshSession(),
    ]);

    expect(first).toBe(true);
    expect(second).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("requestWithAuth", () => {
  it("attaches the current access token to the request", async () => {
    tokenStorage.setTokens("access", "refresh");

    fetchMock.mockResolvedValue(jsonResponse({ id: 42 }));

    const result = await requestWithAuth((accessToken) =>
      getCurrentUser(accessToken),
    );

    expect(result).toEqual({ id: 42 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe(
      "Bearer access",
    );
  });

  it("refreshes once and retries with the new access token after a 401", async () => {
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
      .mockResolvedValueOnce(jsonResponse({ id: 42 }));

    const result = await requestWithAuth((accessToken) =>
      getCurrentUser(accessToken),
    );

    expect(result).toEqual({ id: 42 });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[2][1].headers.Authorization).toBe(
      "Bearer new-access",
    );
  });

  it("clears the session and fails without retrying when refresh fails", async () => {
    tokenStorage.setTokens("expired-access", "old-refresh");

    fetchMock
      .mockResolvedValueOnce(
        errorResponse("INVALID_ACCESS_TOKEN", "Invalid access token", 401),
      )
      .mockResolvedValueOnce(
        errorResponse("INVALID_REFRESH_TOKEN", "Invalid refresh token", 401),
      );

    const error = await requestWithAuth((accessToken) =>
      getCurrentUser(accessToken),
    ).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(401);

    // One request + one refresh attempt: no infinite refresh loop.
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(tokenStorage.getAccessToken()).toBeNull();
    expect(tokenStorage.getRefreshToken()).toBeNull();
  });

  it("refreshes first when there is no access token", async () => {
    tokenStorage.setTokens("", "old-refresh");

    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          accessToken: "new-access",
          refreshToken: "new-refresh",
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ id: 42 }));

    const result = await requestWithAuth((accessToken) =>
      getCurrentUser(accessToken),
    );

    expect(result).toEqual({ id: 42 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe(
      "Bearer new-access",
    );
  });

  it("re-routes other errors to the caller without refreshing", async () => {
    tokenStorage.setTokens("access", "refresh");

    fetchMock.mockResolvedValue(
      errorResponse("INTERNAL_SERVER_ERROR", "Internal server error", 500),
    );

    const error = await requestWithAuth((accessToken) =>
      getCurrentUser(accessToken),
    ).catch((caught: unknown) => caught);

    expect(error).toMatchObject({ status: 500 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(tokenStorage.getAccessToken()).toBe("access");
  });
});
