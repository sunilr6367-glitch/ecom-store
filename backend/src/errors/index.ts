/**
 * Custom Error Classes
 *
 * Provides structured error handling for the application.
 * All custom errors extend the base AppError class.
 */

/**
 * Base error class for application errors
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: unknown
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Authentication related errors
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed', details?: unknown) {
    super(message, 401, 'AUTH_ERROR', details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access', details?: unknown) {
    super(message, 403, 'FORBIDDEN', details);
  }
}

/**
 * Validation related errors
 */
export class ValidationError extends AppError {
  public readonly fieldErrors?: Record<string, string[]>;

  constructor(
    message: string = 'Validation failed',
    fieldErrors?: Record<string, string[]>,
    details?: unknown
  ) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.fieldErrors = fieldErrors;
  }
}

export class ZodValidationError extends ValidationError {
  constructor(errors: Record<string, string[]>) {
    super('Input validation failed', errors);
  }
}

/**
 * Resource not found errors
 */
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      `${resource}${id ? ` with id '${id}'` : ''} not found`,
      404,
      'NOT_FOUND'
    );
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 409, 'CONFLICT', details);
  }
}

/**
 * Business logic errors
 */
export class BusinessLogicError extends AppError {
  constructor(
    message: string,
    code: string = 'BUSINESS_ERROR',
    details?: unknown
  ) {
    super(message, 400, code, details);
  }
}

export class InsufficientStockError extends BusinessLogicError {
  constructor(
    items: { title: string; requested: number; available: number }[]
  ) {
    const message =
      items.length > 0
        ? `Insufficient stock for: ${items.map((i) => i.title).join(', ')}`
        : 'Insufficient stock';
    super(message, 'INSUFFICIENT_STOCK', { items });
  }
}

export class DiscountUsageLimitError extends BusinessLogicError {
  constructor(message: string = 'Discount code usage limit reached') {
    super(message, 'DISCOUNT_LIMIT_REACHED');
  }
}

export class DiscountNotApplicableError extends BusinessLogicError {
  constructor(message: string) {
    super(message, 'DISCOUNT_NOT_APPLICABLE');
  }
}

/**
 * Payment related errors
 */
export class PaymentError extends AppError {
  constructor(
    message: string,
    code: string = 'PAYMENT_ERROR',
    details?: unknown
  ) {
    super(message, 402, code, details);
  }
}

export class PaymentIntentError extends PaymentError {
  constructor(message: string, details?: unknown) {
    super(message, 'PAYMENT_INTENT_FAILED', details);
  }
}

export class WebhookError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, 'WEBHOOK_ERROR', details);
  }
}

/**
 * Rate limiting error
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests', retryAfter?: number) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', { retryAfter });
  }
}

/**
 * Error factory for creating appropriate errors
 */
export class ErrorFactory {
  static createFromError(error: unknown): AppError {
    if (error instanceof AppError) {
      return error;
    }

    if (error instanceof Error) {
      return new AppError(error.message, 500, 'INTERNAL_ERROR');
    }

    return new AppError('An unknown error occurred', 500, 'UNKNOWN_ERROR');
  }

  static isOperationalError(error: unknown): boolean {
    return error instanceof AppError && error.isOperational;
  }
}

/**
 * Helper function to throw validation errors
 */
export function throwValidationError(
  message: string,
  fieldErrors?: Record<string, string[]>
): never {
  throw new ValidationError(message, fieldErrors);
}

/**
 * Helper function to throw not found errors
 */
export function throwNotFound(resource: string, id?: string): never {
  throw new NotFoundError(resource, id);
}

/**
 * Helper function to throw authentication errors
 */
export function throwAuthenticationError(
  message: string = 'Authentication failed'
): never {
  throw new AuthenticationError(message);
}

/**
 * Helper function to throw business logic errors
 */
export function throwBusinessError(message: string, code?: string): never {
  throw new BusinessLogicError(message, code);
}
