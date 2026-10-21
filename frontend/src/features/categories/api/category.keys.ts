import type { CategoryType } from "../types";

/**
 * Stable query keys for category data. The optional type is part of the key
 * because the backend supports filtering categories by transaction type.
 */
export const categoryKeys = {
  all: ["categories"] as const,
  lists: () => [...categoryKeys.all, "list"] as const,
  list: (type?: CategoryType) =>
    [...categoryKeys.lists(), type ?? "ALL"] as const,
  details: () => [...categoryKeys.all, "detail"] as const,
  detail: (id: string) => [...categoryKeys.details(), id] as const,
};
