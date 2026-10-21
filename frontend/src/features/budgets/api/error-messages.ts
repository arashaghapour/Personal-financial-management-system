import { ApiError } from "../../../lib/api/client";

const FALLBACK_ERROR = "Something went wrong. Please try again.";

/**
 * Maps backend budget error codes to safe, user-facing messages. Unknown
 * errors fall back to a generic message so backend internals are never shown.
 */
export const getBudgetErrorMessage = (error: unknown): string => {
  if (!(error instanceof ApiError)) {
    return FALLBACK_ERROR;
  }

  switch (error.code) {
    case "VALIDATION_ERROR":
      return "Please check the form and try again.";
    case "DUPLICATE_BUDGET":
      return "A budget already exists for this category and month.";
    case "INVALID_BUDGET_CATEGORY":
      return "Select an expense category.";
    case "NOT_FOUND":
      return "This budget could not be found.";
    case "UNAUTHORIZED":
      return "Your session has expired. Please sign in again.";
    default:
      return error.status === 0
        ? "Unable to reach the server. Please try again."
        : FALLBACK_ERROR;
  }
};
