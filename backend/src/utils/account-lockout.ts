/**
 * Shared account lockout utilities used by both admin auth and customer auth.
 * Extracted to avoid duplication between auth-service.ts and customer-auth-service.ts.
 */

export const MAX_FAILED_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Check if account is currently locked
 */
export function isAccountLocked(lockedUntil: Date | null | undefined): boolean {
  if (!lockedUntil) return false;
  return new Date() < new Date(lockedUntil);
}

/**
 * Get lockout error message with remaining time
 */
export function getLockoutMessage(lockedUntil: Date): string {
  const remainingMs = new Date(lockedUntil).getTime() - Date.now();
  const minutesRemaining = Math.ceil(remainingMs / 60000);
  return `Account locked. Try again in ${minutesRemaining} minutes.`;
}
