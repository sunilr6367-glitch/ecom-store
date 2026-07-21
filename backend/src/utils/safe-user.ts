/**
 * 🔒 FIX-007: Safe User Serialization Utilities
 *
 * Ensures sensitive fields are always excluded from API responses
 * Prevents password hash and other sensitive data leakage
 */

import type { InferSelectModel } from 'drizzle-orm';
import { users, customers } from '../db/schema';

export type SafeUser = Omit<
  InferSelectModel<typeof users>,
  'password_hash' | 'two_factor_secret'
>;
export type SafeCustomer = Omit<
  InferSelectModel<typeof customers>,
  'password_hash'
>;

/**
 * Safely serialize admin user - removes password_hash and two_factor_secret
 * Use this for all /auth/* and /users/* responses
 */
export function serializeUser(user: InferSelectModel<typeof users>): SafeUser {
  const { password_hash, two_factor_secret, ...safeUser } = user;
  return safeUser as SafeUser;
}

/**
 * Safely serialize customer - removes password_hash
 * Use this for all /customers/* and /store/customers/* responses
 */
export function serializeCustomer(
  customer: InferSelectModel<typeof customers>
): SafeCustomer {
  const { password_hash, ...safeCustomer } = customer;
  return safeCustomer as SafeCustomer;
}

/**
 * Safely serialize array of users
 */
export function serializeUsers(
  userRows: InferSelectModel<typeof users>[]
): SafeUser[] {
  return userRows.map(serializeUser);
}

/**
 * Safely serialize array of customers
 */
export function serializeCustomers(
  customerRows: InferSelectModel<typeof customers>[]
): SafeCustomer[] {
  return customerRows.map(serializeCustomer);
}

/**
 * Generic safe serialization - removes common sensitive fields
 * Performs recursive sanitization to handle nested objects
 * Use as fallback for any entity
 */
export function sanitizeEntity<T extends Record<string, any>>(
  entity: T
): Omit<
  T,
  | 'password_hash'
  | 'two_factor_secret'
  | 'refresh_token'
  | 'access_token'
  | 'secret'
  | 'api_key'
> {
  const sensitiveFields = new Set([
    'password_hash',
    'two_factor_secret',
    'refresh_token',
    'access_token',
    'secret',
    'api_key',
  ]);
  const visited = new WeakSet();

  function sanitize(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj !== 'object') {
      return obj;
    }

    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map((item) => sanitize(item));
    }

    // Prevent infinite loops with circular references
    if (visited.has(obj)) {
      return obj;
    }
    visited.add(obj);

    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (sensitiveFields.has(key)) {
        continue; // Skip sensitive fields
      }
      result[key] = sanitize(value);
    }
    return result;
  }

  return sanitize(entity);
}
