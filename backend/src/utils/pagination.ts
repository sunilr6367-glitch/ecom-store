/**
 * Pagination Utility
 *
 * Provides standardized pagination for API responses.
 */

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

/**
 * Create pagination metadata
 */
export function getPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

/**
 * Calculate offset from page and limit
 */
export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Sanitize pagination params
 */
export function sanitizePaginationParams(params: PaginationParams): {
  page: number;
  limit: number;
  offset: number;
} {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 20));
  const offset = calculateOffset(page, limit);

  return { page, limit, offset };
}

/**
 * Create empty paginated response
 */
export function emptyPaginatedResponse<T>(
  page: number,
  limit: number
): PaginatedResponse<T> {
  return {
    data: [],
    pagination: getPaginationMeta(page, limit, 0),
  };
}

/**
 * Create paginated response from array
 */
export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): PaginatedResponse<T> {
  return {
    data,
    pagination: getPaginationMeta(page, limit, total),
  };
}

/**
 * Parse cursor-based pagination params (alternative to offset-based)
 */
export interface CursorPaginationParams {
  cursor?: string;
  limit?: number;
}

/**
 * Parse cursor from pagination params
 */
export function parseCursor<T>(
  cursor: string | undefined,
  decoder: (encoded: string) => T | null
): {
  cursor: T | null;
  limit: number;
} {
  const limit = Math.min(100, Math.max(1, 20));

  if (!cursor) {
    return { cursor: null, limit };
  }

  return {
    cursor: decoder(cursor),
    limit,
  };
}

/**
 * Encode cursor for pagination
 */
export function encodeCursor<T>(
  value: T,
  encoder: (decoded: T) => string
): string | null {
  if (!value) return null;
  return encoder(value);
}
