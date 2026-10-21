import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createCategory,
  deleteCategory,
  getCategories,
  getCategory,
  updateCategory,
} from "./categories.api";

import { jsonResponse, noContentResponse } from "../../../test/fetch-mock";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("categories api", () => {
  it("getCategories requests /categories with the bearer token", async () => {
    fetchMock.mockResolvedValue(jsonResponse([]));

    const result = await getCategories("access-token");

    expect(result).toEqual([]);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/categories",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer access-token",
        }),
      }),
    );
  });

  it("getCategories sends the type query parameter for filtered requests", async () => {
    fetchMock.mockImplementation(async () => jsonResponse([]));

    await getCategories("access-token", "INCOME");
    await getCategories("access-token", "EXPENSE");

    expect(fetchMock.mock.calls.map((call) => call[0])).toEqual([
      "/api/categories?type=INCOME",
      "/api/categories?type=EXPENSE",
    ]);
  });

  it("getCategory requests the selected category", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: "category-1" }));

    await getCategory("access-token", "category-1");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/categories/category-1",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer access-token",
        }),
      }),
    );
  });

  it("createCategory posts the form data without a userId", async () => {
    const data = { name: "Salary", type: "INCOME" as const };

    fetchMock.mockResolvedValue(jsonResponse({ id: "category-1", ...data }));

    await createCategory("access-token", data);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/categories",
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

  it("updateCategory patches only the editable fields", async () => {
    const data = { name: "Freelance", type: "INCOME" as const };

    fetchMock.mockResolvedValue(jsonResponse({ id: "category-1", ...data }));

    await updateCategory("access-token", "category-1", data);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/categories/category-1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    );

    const body = fetchMock.mock.calls[0][1].body as string;

    expect(body).not.toContain("userId");
    expect(body).not.toContain("normalizedName");
    expect(body).not.toContain("createdAt");
  });

  it("deleteCategory sends DELETE to the category resource", async () => {
    fetchMock.mockResolvedValue(noContentResponse());

    await expect(
      deleteCategory("access-token", "category-1"),
    ).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/categories/category-1",
      expect.objectContaining({
        method: "DELETE",
        headers: expect.objectContaining({
          Authorization: "Bearer access-token",
        }),
      }),
    );
  });
});
