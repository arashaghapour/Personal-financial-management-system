/**
 * Category types mirroring the backend contract
 * (see docs/OpenAPI.yml and backend/src/modules/category/category.schema.ts).
 */

export const CATEGORY_TYPES = ["INCOME", "EXPENSE"] as const;

export type CategoryType = (typeof CATEGORY_TYPES)[number];

export const CATEGORY_FILTERS = ["ALL", ...CATEGORY_TYPES] as const;

export type CategoryFilter = (typeof CATEGORY_FILTERS)[number];

/** Category returned by the backend for the authenticated user. */
export type Category = {
  id: string;
  userId: number;
  name: string;
  normalizedName: string;
  type: CategoryType;
  createdAt: string;
  updatedAt: string;
};

/** POST /api/categories request body. `userId` is derived from the session. */
export type CreateCategoryRequest = {
  name: string;
  type: CategoryType;
};

/**
 * PATCH /api/categories/:id request body. Only editable fields are sent;
 * `id`, `userId`, `normalizedName`, and timestamps are managed by the backend.
 */
export type UpdateCategoryRequest = {
  name: string;
  type: CategoryType;
};
