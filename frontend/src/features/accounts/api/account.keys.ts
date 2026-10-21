/**
 * Stable query keys for account data. Transaction mutations invalidate
 * `accountKeys.all` because the backend changes balances atomically.
 */
export const accountKeys = {
  all: ["accounts"] as const,
  lists: () => [...accountKeys.all, "list"] as const,
  list: () => [...accountKeys.lists()] as const,
  details: () => [...accountKeys.all, "detail"] as const,
  detail: (id: number) => [...accountKeys.details(), id] as const,
};
