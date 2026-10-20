import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError, apiRequest } from "./client";
import { API_BASE_URL } from "./index";

import {
  errorResponse,
  jsonResponse,
  noContentResponse,
} from "../../test/fetch-mock";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("API base URL", () => {
  it("uses the same-origin /api path in development for the Vite proxy", () => {
    expect(API_BASE_URL).toBe("/api");
  });
});

describe("apiRequest", () => {
  it("prefixes the API base URL and parses the JSON response", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 1 }));

    const result = await apiRequest<{ id: number }>("/auth/me");

    expect(result).toEqual({ id: 1 });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/me",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("sends the JSON body with a JSON content type", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}));

    await apiRequest("/auth/login", {
      method: "POST",
      body: { email: "user@example.com", password: "password123" },
    });

    const [, init] = fetchMock.mock.calls[0];

    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(init.body)).toEqual({
      email: "user@example.com",
      password: "password123",
    });
  });

  it("attaches the access token as a bearer header", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}));

    await apiRequest("/auth/me", { accessToken: "access-token" });

    const [, init] = fetchMock.mock.calls[0];

    expect(init.headers.Authorization).toBe("Bearer access-token");
  });

  it("omits the authorization header when no token is provided", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}));

    await apiRequest("/auth/login", { method: "POST", body: {} });

    const [, init] = fetchMock.mock.calls[0];

    expect(init.headers.Authorization).toBeUndefined();
  });

  it("returns undefined for 204 responses", async () => {
    fetchMock.mockResolvedValue(noContentResponse());

    const result = await apiRequest<void>("/auth/logout", { method: "POST" });

    expect(result).toBeUndefined();
  });

  it("throws an ApiError with the backend code and message", async () => {
    fetchMock.mockResolvedValue(
      errorResponse("INVALID_CREDENTIALS", "Invalid email or password", 401),
    );

    const error = await apiRequest("/auth/login", { method: "POST" }).catch(
      (caught: unknown) => caught,
    );

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 401,
      code: "INVALID_CREDENTIALS",
      message: "Invalid email or password",
    });
  });

  it("throws a generic ApiError for non-JSON error responses", async () => {
    fetchMock.mockResolvedValue(new Response("Server Error", { status: 500 }));

    const error = await apiRequest("/auth/login").catch(
      (caught: unknown) => caught,
    );

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(500);
    expect((error as ApiError).message).toBe(
      "Request failed. Please try again.",
    );
  });

  it("throws a network ApiError when the request cannot be sent", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    const error = await apiRequest("/auth/me").catch(
      (caught: unknown) => caught,
    );

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(0);
  });
});
