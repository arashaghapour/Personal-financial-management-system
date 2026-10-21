import { ApiError } from "../../../lib/api/client";

/**
 * Maps backend category error codes to user-friendly messages. Backend error
 * messages never contain credentials, so falling back to them is safe.
 */
const CATEGORY_ERROR_MESSAGES: Record<string, string> = {
  CATEGORY_ALREADY_EXISTS:
    "A category with this name and type already exists.",
  CATEGORY_NOT_FOUND: "This category could not be found.",
  CATEGORY_TYPE_MISMATCH:
    "The category type does not match. Please choose a different category.",
  VALIDATION_ERROR: "Please check the form and try again.",
  UNAUTHORIZED: "Please sign in to continue.",
  INTERNAL_SERVER_ERROR: "Something went wrong. Please try again.",
};

export const getCategoryErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError) {
    if (error.code && error.code in CATEGORY_ERROR_MESSAGES) {
      return CATEGORY_ERROR_MESSAGES[error.code];
    }

    return error.message;
  }

  return "Something went wrong. Please try again.";
};

/**
 * Deletion-specific error message. The backend enforces the category ->
 * transaction restriction at the database level and reports it as a 409
 * conflict. Transactions must never be modified to work around it.
 */
export const getDeleteCategoryErrorMessage = (error: unknown): string => {
  if (
    error instanceof ApiError &&
    (error.status === 409 ||
      error.status === 500 ||
      error.code === "P2003")
  ) {
    return "This category cannot be deleted because it is used by existing transactions.";
  }

  return getCategoryErrorMessage(error);
};
