import { ApiError } from "../../../lib/api/client";

/**
 * Maps backend dashboard error codes to user-friendly messages. Backend error
 * messages never contain credentials, so falling back to them is safe.
 */
const DASHBOARD_ERROR_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: "Please sign in to continue.",
  VALIDATION_ERROR:
    "Please check the selected date range and try again.",
  INTERNAL_SERVER_ERROR: "Something went wrong. Please try again.",
};

export const getDashboardErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return DASHBOARD_ERROR_MESSAGES.UNAUTHORIZED;
    }

    if (error.code && error.code in DASHBOARD_ERROR_MESSAGES) {
      return DASHBOARD_ERROR_MESSAGES[error.code];
    }

    return error.message;
  }

  return "Something went wrong. Please try again.";
};
