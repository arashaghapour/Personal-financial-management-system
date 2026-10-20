import { API_BASE_URL } from "./index";

/** Standard backend error envelope: { error: { code, message, details? } }. */
type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

/** Error thrown for any non-2xx API response or transport failure. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string | undefined;
  readonly details: unknown;

  constructor(
    status: number,
    message: string,
    code?: string,
    details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type RequestOptions = {
  method?: string;
  /** JSON-serialized request body. */
  body?: unknown;
  /** Access token sent as `Authorization: Bearer <token>`. */
  accessToken?: string | null;
  signal?: AbortSignal;
};

const isApiErrorBody = (value: unknown): value is ApiErrorBody => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const error = (value as { error?: unknown }).error;

  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error
  );
};

/**
 * Minimal JSON API client built on fetch.
 *
 * - Prefixes the configured API base URL.
 * - Sends `Authorization: Bearer <token>` when an access token is provided.
 * - Throws {@link ApiError} with the backend's error code and message for
 *   non-2xx responses. Error messages never contain tokens or passwords.
 */
export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, accessToken, signal } = options;

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }

    throw new ApiError(0, "Unable to reach the server. Please try again.");
  }

  // 204 No Content (used by POST /auth/logout) has no body to parse.
  if (response.status === 204) {
    return undefined as T;
  }

  let payload: unknown = null;

  const contentType = response.headers.get("Content-Type") ?? "";

  if (contentType.includes("application/json")) {
    payload = await response.json();
  }

  if (!response.ok) {
    if (isApiErrorBody(payload)) {
      throw new ApiError(
        response.status,
        payload.error.message,
        payload.error.code,
        payload.error.details,
      );
    }

    throw new ApiError(response.status, "Request failed. Please try again.");
  }

  return payload as T;
}
