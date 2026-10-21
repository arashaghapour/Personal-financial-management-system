import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createAccountMutation,
  deleteAccountMutation,
  fetchAccount,
  fetchAccounts,
  updateAccountMutation,
} from "./accounts.queries";

import { tokenStorage } from "../../auth/token-storage";
import { jsonResponse, noContentResponse } from "../../../test/fetch-mock";

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

describe("authenticated account queries", () => {
  it("attaches the stored access token to account requests", async () => {
    fetchMock.mockResolvedValue(jsonResponse([]));

    await fetchAccounts();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/accounts",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer access-token",
        }),
      }),
    );
  });

  it("supports fetching, creating, updating, and deleting accounts", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ id: 4 }))
      .mockResolvedValueOnce(jsonResponse({ id: 5 }))
      .mockResolvedValueOnce(jsonResponse({ id: 5, name: "Updated" }))
      .mockResolvedValueOnce(noContentResponse());

    await fetchAccount(4);
    await createAccountMutation({
      name: "Cash",
      type: "CASH",
      initialBalance: 0,
    });
    await updateAccountMutation(5, { name: "Updated", type: "BANK" });
    await deleteAccountMutation(5);

    expect(fetchMock.mock.calls.map((call) => call[0])).toEqual([
      "/api/accounts/4",
      "/api/accounts",
      "/api/accounts/5",
      "/api/accounts/5",
    ]);
  });
});
