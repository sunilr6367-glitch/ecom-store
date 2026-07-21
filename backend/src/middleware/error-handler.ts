/**
 * Global Error Handler Middleware
 * Catches and formats all errors consistently
 */

import { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { StatusCode, ContentfulStatusCode } from 'hono/utils/http-status';
import { ZodError } from 'zod';
import {
  errorResponse,
  ErrorMessages,
  HttpStatus,
} from '../utils/api-response';
import { formatZodErrors } from '../utils/validation';

/**
 * Validation error details structure
 */
export interface ValidationErrorDetails {
  field?: string;
  message: string;
}

// Custom API Error class
// Note: We accept number to be backward compatible and generic,
// but internally we treat it as StatusCode for Hono.
export class APIError extends Error {
  public statusCode: StatusCode;

  constructor(
    message: string,
    statusCode: number = 400,
    public errors?: ValidationErrorDetails[]
  ) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode as StatusCode;
  }
}

// Not Found Error
export class NotFoundError extends APIError {
  constructor(message: string = ErrorMessages.NOT_FOUND) {
    super(message, HttpStatus.NOT_FOUND);
    this.name = 'NotFoundError';
  }
}

// Validation Error
export class ValidationError extends APIError {
  constructor(
    message: string = ErrorMessages.VALIDATION_ERROR,
    errors?: ValidationErrorDetails[]
  ) {
    super(message, HttpStatus.UNPROCESSABLE_ENTITY as number, errors);
    this.name = 'ValidationError';
  }
}

// Auth Error
export class AuthError extends APIError {
  constructor(message: string = ErrorMessages.UNAUTHORIZED) {
    super(message, HttpStatus.UNAUTHORIZED);
    this.name = 'AuthError';
  }
}

// Forbidden Error
export class ForbiddenError extends APIError {
  constructor(message: string = ErrorMessages.FORBIDDEN) {
    super(message, HttpStatus.FORBIDDEN);
    this.name = 'ForbiddenError';
  }
}

// Conflict Error
export class ConflictError extends APIError {
  constructor(message: string = ErrorMessages.CONFLICT) {
    super(message, HttpStatus.CONFLICT);
    this.name = 'ConflictError';
  }
}

function isDatabaseError(err: Error): err is Error & {
  code?: string;
  constraint?: string;
  column?: string;
  detail?: string;
} {
  return typeof (err as { code?: unknown }).code === 'string';
}

function getDatabaseErrorResponse(err: Error) {
  if (!isDatabaseError(err)) return null;

  if (err.code === '23505') {
    const target =
      err.constraint === 'products_handle_unique'
        ? 'URL handle'
        : err.constraint === 'product_variants_sku_unique'
          ? 'SKU'
          : 'identifier';

    return {
      message: `${target} already exists. Please use a different ${target.toLowerCase()}.`,
      status: HttpStatus.CONFLICT,
    };
  }

  if (err.code === '23503') {
    return {
      message: 'Related record was not found. Please refresh and try again.',
      status: HttpStatus.UNPROCESSABLE_ENTITY,
    };
  }

  if (err.code === '23502') {
    return {
      message: `Missing required field${err.column ? `: ${err.column}` : ''}.`,
      status: HttpStatus.UNPROCESSABLE_ENTITY,
    };
  }

  if (err.code === '42703') {
    return {
      message: 'Database schema is missing a required column. Please run migrations and try again.',
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    };
  }

  if (err.code === '42P01') {
    return {
      message: 'Database schema is missing a required table. Please run migrations and try again.',
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    };
  }

  return null;
}

// Global error handler middleware
export async function errorHandler(err: Error, c: Context) {
  console.error('[ERROR]', err);

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    return errorResponse(
      c,
      ErrorMessages.VALIDATION_ERROR,
      formatZodErrors(err),
      HttpStatus.UNPROCESSABLE_ENTITY as StatusCode
    );
  }

  // Handle HTTP Exceptions from Hono
  if (err instanceof HTTPException) {
    return errorResponse(c, err.message, null, err.status as StatusCode);
  }

  // Handle custom API errors
  if (err instanceof APIError) {
    return errorResponse(c, err.message, err.errors, err.statusCode);
  }

  const databaseError = getDatabaseErrorResponse(err);
  if (databaseError) {
    return errorResponse(c, databaseError.message, null, databaseError.status);
  }

  // Handle specific error types by message (legacy support)
  const normalizedMessage = err.message?.toLowerCase() || '';

  if (
    normalizedMessage.includes('not found') &&
    !normalizedMessage.includes('tenant or user not found')
  ) {
    return errorResponse(
      c,
      ErrorMessages.NOT_FOUND,
      null,
      HttpStatus.NOT_FOUND
    );
  }

  if (normalizedMessage.includes('unauthorized')) {
    return errorResponse(
      c,
      ErrorMessages.UNAUTHORIZED,
      null,
      HttpStatus.UNAUTHORIZED
    );
  }

  if (
    normalizedMessage.includes('conflict') ||
    err.message?.includes('already exists')
  ) {
    return errorResponse(c, ErrorMessages.CONFLICT, null, HttpStatus.CONFLICT);
  }

  // Default: Internal Server Error
  // 🔒 FIX-006: Never expose stack traces - sanitize error messages
  const isProduction = process.env.NODE_ENV === 'production';

  // Sanitize error message - remove internal paths and sensitive info
  const sanitizeMessage = (msg: string): string => {
    const urlPlaceholder = '___URL_PLACEHOLDER___';
    const urlRegex = /https?:\/\/[^\s'")\]}]+/g;
    const lines = msg.split('\n');
    const sanitizedLines = lines.map((line) => {
      const urls: string[] = [];
      const lineWithPlaceholders = line.replace(urlRegex, (match) => {
        urls.push(match);
        return urlPlaceholder;
      });
      let sanitized = lineWithPlaceholders
        .replace(/[A-Za-z]:\\(?:[^\\]+\\)+/g, '[internal]')
        .replace(/\/(?:[^/]+\/)+/g, '[internal]/')
        .replace(/:\d+:\d+/g, ':line [hidden]:col [hidden]')
        .replace(/:\d+\b/g, ':line [hidden]');
      let index = 0;
      sanitized = sanitized.replace(
        new RegExp(urlPlaceholder, 'g'),
        () => urls[index++] || ''
      );
      return sanitized;
    });
    return sanitizedLines.join('\n');
  };

  // In production: generic message only, no details
  // In development: sanitized message for debugging, but no stack
  const errorDetails = !isProduction
    ? { message: sanitizeMessage(err.message) }
    : null;

  return errorResponse(
    c,
    ErrorMessages.INTERNAL_ERROR,
    errorDetails,
    HttpStatus.INTERNAL_SERVER_ERROR
  );
}

// Async handler wrapper to catch errors automatically
export function asyncHandler(fn: (c: Context) => Promise<Response>) {
  return async (c: Context) => {
    try {
      return await fn(c);
    } catch (error) {
      return errorHandler(error as Error, c);
    }
  };
}
