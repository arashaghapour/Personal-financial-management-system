import { requestWithAuth } from "../../auth/api/auth-client";

import {
  createCategory,
  deleteCategory,
  getCategories,
  getCategory,
  updateCategory,
} from "./categories.api";

import type {
  Category,
  CategoryType,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from "../types";

/**
 * Reusable authenticated category queries and mutations.
 *
 * The filter is part of the request identity: callers pass the selected
 * `CategoryType` (or `undefined` for All) so All, Income, and Expense views
 * each request exactly the data they display. Components never handle the
 * access token themselves.
 */

export const fetchCategories = (
  type?: CategoryType,
): Promise<Category[]> =>
  requestWithAuth((accessToken) => getCategories(accessToken, type));

export const fetchCategory = (id: string): Promise<Category> =>
  requestWithAuth((accessToken) => getCategory(accessToken, id));

export const createCategoryMutation = (
  data: CreateCategoryRequest,
): Promise<Category> =>
  requestWithAuth((accessToken) => createCategory(accessToken, data));

export const updateCategoryMutation = (
  id: string,
  data: UpdateCategoryRequest,
): Promise<Category> =>
  requestWithAuth((accessToken) => updateCategory(accessToken, id, data));

export const deleteCategoryMutation = (id: string): Promise<void> =>
  requestWithAuth((accessToken) => deleteCategory(accessToken, id));
