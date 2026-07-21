/**
 * Standard API Response Helpers
 * Ensures consistent response format and strong typing across all endpoints
 */

import { Context } from 'hono';
import { StatusCode, ContentfulStatusCode } from 'hono/utils/http-status';

// Common HTTP status codes as typed constants
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Standard Error Messages
export const ErrorMessages = {
  UNAUTHORIZED: 'Authentication required. Please log in.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Validation failed. Please check your input.',
  INTERNAL_ERROR: 'An unexpected error occurred. Please try again later.',
  CONFLICT: 'A resource with this identifier already exists.',
  RATE_LIMIT: 'Too many requests. Please try again later.',
  DATABASE_ERROR: 'Database operation failed. Please try again.',
} as const;

// Interface for consistent response shape
export interface APIResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any;
  pagination?: {
    offset: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
  timestamp: string;
}

// ----------------------------------------------------------------------------
// SUCCESS RESPONSES
// ----------------------------------------------------------------------------

export function successResponse<T>(
  c: Context,
  data: T,
  message: string = 'Success',
  status: StatusCode = HttpStatus.OK
) {
  // c.json requires ContentfulStatusCode (excludes 204, 304 etc which have no body)
  return c.json(
    {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    } satisfies APIResponse<T>,
    status as ContentfulStatusCode
  );
}

// ----------------------------------------------------------------------------
// ERROR RESPONSES
// ----------------------------------------------------------------------------

export function errorResponse(
  c: Context,
  message: string,
  errors: any = null,
  status: StatusCode = HttpStatus.BAD_REQUEST
) {
  const response: APIResponse = {
    success: false,
    message,
    timestamp: new Date().toISOString(),
  };

  if (errors && process.env.NODE_ENV === 'development') {
    response.errors = errors;
  }

  return c.json(response, status as ContentfulStatusCode);
}

// ----------------------------------------------------------------------------
// PAGINATED RESPONSES
// ----------------------------------------------------------------------------

export function paginatedResponse<T>(
  c: Context,
  data: T[],
  pagination: {
    offset: number;
    limit: number;
    total: number;
  },
  message: string = 'Success',
  status: StatusCode = HttpStatus.OK
) {
  const total_pages = Math.ceil(
    pagination.total / Math.max(pagination.limit, 1)
  );

  return c.json(
    {
      success: true,
      message,
      data,
      pagination: {
        offset: pagination.offset,
        limit: pagination.limit,
        total: pagination.total,
        total_pages,
        has_next: pagination.offset + pagination.limit < pagination.total,
        has_prev: pagination.offset > 0,
      },
      timestamp: new Date().toISOString(),
    } satisfies APIResponse<T[]>,
    status as ContentfulStatusCode
  );
}
