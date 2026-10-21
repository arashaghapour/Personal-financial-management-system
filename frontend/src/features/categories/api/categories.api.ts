import { apiRequest } from "../../../lib/api/client";

import type {
  Category,
  CategoryType,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from "../types";

/**
 * Categories API functions.
 *
 * Requests go through the shared API client so the configured base URL,
 * authentication header, and error envelope handling stay consistent.
 */

const categoriesPath = (type?: CategoryType): string =>
  type === undefined ? "/categories" : `/categories?type=${type}`;

export const getCategories = (
  accessToken: string,
  type?: CategoryType,
): Promise<Category[]> =>
  apiRequest<Category[]>(categoriesPath(type), { accessToken });

export const getCategory = (
  accessToken: string,
  id: string,
): Promise<Category> =>
  apiRequest<Category>(`/categories/${id}`, { accessToken });

export const createCategory = (
  accessToken: string,
  data: CreateCategoryRequest,
): Promise<Category> =>
  apiRequest<Category>("/categories", {
    method: "POST",
    accessToken,
    body: data,
  });

export const updateCategory = (
  accessToken: string,
  id: string,
  data: UpdateCategoryRequest,
): Promise<Category> =>
  apiRequest<Category>(`/categories/${id}`, {
    method: "PATCH",
    accessToken,
    body: data,
  });

export const deleteCategory = (
  accessToken: string,
  id: string,
): Promise<void> =>
  apiRequest<void>(`/categories/${id}`, {
    method: "DELETE",
    accessToken,
  });
