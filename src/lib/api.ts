// ShadowVault - shared API helpers for parsing JSON string fields from Prisma (SQLite)

/**
 * Safely parse a JSON-encoded string field (stored as text in SQLite) into a string array.
 * Returns [] on null/undefined or any parse error.
 */
export function parseJsonArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.map((v) => String(v));
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Standard JSON error response helper.
 */
export function errorResponse(message: string, status = 400): Response {
  return Response.json({ error: message }, { status });
}

/**
 * Standard JSON success response helper.
 */
export function successResponse<T>(data: T, status = 200): Response {
  return Response.json({ data }, { status });
}
