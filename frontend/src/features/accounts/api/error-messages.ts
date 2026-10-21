import { ApiError } from "../../../lib/api/client";

/**
 * Maps backend account error codes to user-friendly messages. Backend error
 * messages never contain credentials, so falling back to them is safe.
 */
const ACCOUNT_ERROR_MESSAGES: Record<string, string> = {
  ACCOUNT_NOT_FOUND: "This account could not be found.",
  VALIDATION_ERROR: "Please check the form and try again.",
  UNAUTHORIZED: "Please sign in to continue.",
  INTERNAL_SERVER_ERROR: "Something went wrong. Please try again.",
};

export const getAccountErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError) {
    if (error.code && error.code in ACCOUNT_ERROR_MESSAGES) {
      return ACCOUNT_ERROR_MESSAGES[error.code];
    }

    return error.message;
  }

  return "Something went wrong. Please try again.";
};

/**
 * Deletion-specific error message. The backend enforces the account ->
 * transaction restriction at the database level, which currently surfaces as
 * a 500 response. Transactions must never be modified to work around it.
 */
export const getDeleteAccountErrorMessage = (error: unknown): string => {
  if (
    error instanceof ApiError &&
    (error.status === 409 ||
      error.status === 500 ||
      error.code === "P2003" ||
      error.code === "ACCOUNT_HAS_TRANSACTIONS")
  ) {
    return "This account cannot be deleted because it is associated with transactions.";
  }

  return getAccountErrorMessage(error);
};
