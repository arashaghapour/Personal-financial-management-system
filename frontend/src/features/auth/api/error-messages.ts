import { ApiError } from "../../../lib/api/client";

/**
 * Maps backend authentication error codes to user-friendly messages.
 * Backend error messages never contain tokens or passwords, so falling back
 * to them is safe.
 */
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  EMAIL_ALREADY_EXISTS: "An account with this email already exists.",
  INVALID_CREDENTIALS: "Invalid email or password.",
  INVALID_REFRESH_TOKEN: "Your session has expired. Please sign in again.",
  UNAUTHORIZED: "Please sign in to continue.",
  VALIDATION_ERROR: "Please check the form and try again.",
  INTERNAL_SERVER_ERROR: "Something went wrong. Please try again.",
};

export const getAuthErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError) {
    if (error.code && error.code in AUTH_ERROR_MESSAGES) {
      return AUTH_ERROR_MESSAGES[error.code];
    }

    return error.message;
  }

  return "Something went wrong. Please try again.";
};
