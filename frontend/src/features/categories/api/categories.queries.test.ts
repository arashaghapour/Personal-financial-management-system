import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createCategoryMutation,
  deleteCategoryMutation,
  fetchCategories,
  fetchCategory,
  updateCategoryMutation,
} from "./categories.queries";

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

describe("authenticated category queries", () => {
  it("attaches the stored access token to category requests", async () => {
    fetchMock.mockResolvedValue(jsonResponse([]));

    await fetchCategories("INCOME");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/categories?type=INCOME",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer access-token",
        }),
      }),
    );
  });

  it("supports fetching, creating, updating, and deleting categories", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse({ id: "category-1" }))
      .mockResolvedValueOnce(jsonResponse({ id: "category-1" }))
      .mockResolvedValueOnce(jsonResponse({ id: "category-1", name: "Updated" }))
      .mockResolvedValueOnce(noContentResponse());

    await fetchCategories();
    await fetchCategory("category-1");
    await createCategoryMutation({ name: "Food", type: "EXPENSE" });
    await updateCategoryMutation("category-1", {
      name: "Updated",
      type: "EXPENSE",
    });
    await deleteCategoryMutation("category-1");

    expect(fetchMock.mock.calls.map((call) => call[0])).toEqual([
      "/api/categories",
      "/api/categories/category-1",
      "/api/categories",
      "/api/categories/category-1",
      "/api/categories/category-1",
    ]);
  });
});
