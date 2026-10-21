import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fetchDashboard } from "./dashboard.queries";

import { tokenStorage } from "../../auth/token-storage";
import { jsonResponse } from "../../../test/fetch-mock";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  tokenStorage.setTokens("access-token", "refresh-token");
});

afterEach(() => {
  vi.unstubAllGlobals();
  tokenStorage.clear();
});

describe("authenticated dashboard queries", () => {
  it("attaches the stored access token to dashboard requests", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ totalBalance: 0 }));

    await fetchDashboard();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/dashboard",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer access-token",
        }),
      }),
    );
  });

  it("forwards only the selected date filters", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ totalBalance: 0 }));

    await fetchDashboard({
      startDate: "2026-10-01",
      endDate: "2026-10-31",
    });

    expect(fetchMock.mock.calls[0][0]).toBe(
      "/api/dashboard?startDate=2026-10-01&endDate=2026-10-31",
    );

    const requestUrl = String(fetchMock.mock.calls[0][0]);

    expect(requestUrl).not.toContain("userId");
  });
});
