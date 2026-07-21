/**
 * Error Handler Utilities
 * Safe error message extraction for catch blocks
 */

/**
 * Safely extract error message from unknown error type
 * Handles Error, string, and object error types
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return 'An unexpected error occurred';
}

/**
 * Check if error is a specific error type
 */
export function isErrorType(error: unknown, errorName: string): boolean {
  return error instanceof Error && error.name === errorName;
}

/**
 * Log error with context (maintains existing logging pattern)
 */
export function logError(context: string, error: unknown): void {
  console.error(`[ERROR] ${context}:`, getErrorMessage(error));
}
