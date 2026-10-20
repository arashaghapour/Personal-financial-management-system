/** Helpers for building mocked fetch responses in tests. */

export const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export const noContentResponse = (status = 204): Response =>
  new Response(null, { status });

export const errorResponse = (
  code: string,
  message: string,
  status: number,
  details?: unknown,
): Response =>
  jsonResponse({ error: { code, message, ...(details !== undefined && { details }) } }, status);
