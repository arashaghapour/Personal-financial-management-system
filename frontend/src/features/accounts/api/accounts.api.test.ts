import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createAccount,
  deleteAccount,
  getAccount,
  getAccounts,
  updateAccount,
} from "./accounts.api";

import { jsonResponse, noContentResponse } from "../../../test/fetch-mock";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("accounts api", () => {
  it("getAccounts requests /accounts with the bearer token", async () => {
    fetchMock.mockResolvedValue(jsonResponse([]));

    const result = await getAccounts("access-token");

    expect(result).toEqual([]);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/accounts",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer access-token",
        }),
      }),
    );
  });

  it("getAccount requests the selected account", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 7 }));

    await getAccount("access-token", 7);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/accounts/7",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer access-token",
        }),
      }),
    );
  });

  it("createAccount posts the form data without a userId", async () => {
    const data = {
      name: "Checking",
      type: "BANK" as const,
      initialBalance: 250,
    };

    fetchMock.mockResolvedValue(jsonResponse({ id: 1, ...data }));

    await createAccount("access-token", data);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/accounts",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(data),
        headers: expect.objectContaining({
          Authorization: "Bearer access-token",
        }),
      }),
    );

    expect(fetchMock.mock.calls[0][1].body).not.toContain("userId");
  });

  it("updateAccount patches only the editable fields", async () => {
    const data = { name: "Savings", type: "INVESTMENT" as const };

    fetchMock.mockResolvedValue(jsonResponse({ id: 3, ...data }));

    await updateAccount("access-token", 3, data);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/accounts/3",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    );

    const body = fetchMock.mock.calls[0][1].body as string;

    expect(body).not.toContain("userId");
    expect(body).not.toContain("balance");
    expect(body).not.toContain("createdAt");
  });

  it("deleteAccount sends DELETE to the account resource", async () => {
    fetchMock.mockResolvedValue(noContentResponse());

    await expect(deleteAccount("access-token", 9)).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/accounts/9",
      expect.objectContaining({
        method: "DELETE",
        headers: expect.objectContaining({
          Authorization: "Bearer access-token",
        }),
      }),
    );
  });
});
