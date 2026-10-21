import { ApiError } from "../../../lib/api/client";

/**
 * Maps backend report error codes to user-friendly messages. Backend error
 * messages never contain credentials, so falling back to them is safe.
 */
const REPORT_ERROR_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: "Please sign in to continue.",
  VALIDATION_ERROR: "Please check the selected filters and try again.",
  NOT_FOUND:
    "The selected category is no longer available. Clear the category filter and try again.",
  INTERNAL_SERVER_ERROR: "Something went wrong. Please try again.",
};

export const getReportErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return REPORT_ERROR_MESSAGES.UNAUTHORIZED;
    }

    if (error.code && error.code in REPORT_ERROR_MESSAGES) {
      return REPORT_ERROR_MESSAGES[error.code];
    }

    return error.message;
  }

  return "Something went wrong. Please try again.";
};
