import { ApiError } from "../../../lib/api/client";

/**
 * Maps backend transaction error codes to user-friendly messages. Backend
 * error messages never contain credentials, so falling back to them is safe.
 */
const TRANSACTION_ERROR_MESSAGES: Record<string, string> = {
  TRANSACTION_NOT_FOUND: "This transaction could not be found.",
  ACCOUNT_NOT_FOUND: "This account could not be found.",
  CATEGORY_NOT_FOUND: "This category could not be found.",
  CATEGORY_TYPE_MISMATCH:
    "The selected category does not match the transaction type.",
  INSUFFICIENT_BALANCE: "Insufficient account balance for this expense.",
  VALIDATION_ERROR: "Please check the form and try again.",
  UNAUTHORIZED: "Please sign in to continue.",
  INTERNAL_SERVER_ERROR: "Something went wrong. Please try again.",
};

export const getTransactionErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return TRANSACTION_ERROR_MESSAGES.UNAUTHORIZED;
    }

    if (error.code && error.code in TRANSACTION_ERROR_MESSAGES) {
      return TRANSACTION_ERROR_MESSAGES[error.code];
    }

    return error.message;
  }

  return "Something went wrong. Please try again.";
};
