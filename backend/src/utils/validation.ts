/**
 * Validation Utilities
 * Standard validation helpers for API inputs
 */

import { z } from 'zod';

// UUID validation
export const uuidSchema = z.string().uuid('Invalid ID format');

// Pagination params
export const paginationSchema = z.object({
  limit: z
    .string()
    .default('20')
    .transform((val) => {
      const num = parseInt(val);
      return Math.min(Math.max(num, 1), 100); // Min 1, Max 100
    }),
  offset: z
    .string()
    .default('0')
    .transform((val) => {
      const num = parseInt(val);
      return Math.max(num, 0); // Min 0
    }),
});

// Sort params
export const sortSchema = z.object({
  sort: z
    .enum([
      'created_at',
      'updated_at',
      'title',
      'price_asc',
      'price_desc',
      'newest',
    ])
    .default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

// Search params
export const searchSchema = z.object({
  q: z
    .string()
    .min(1, 'Search query is required')
    .max(100, 'Search query too long'),
  filters: z.record(z.string()).optional(),
});

// Validate and parse query params
export function validateQueryParams<T>(
  schema: z.ZodSchema<T>,
  params: Record<string, string>
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(params);

  if (result.success) {
    return { success: true, data: result.data };
  } else {
    const errors = result.error.errors.map(
      (e) => `${e.path.join('.')}: ${e.message}`
    );
    return { success: false, errors };
  }
}

/**
 * Sanitize search input by removing SQL/LIKE special characters.
 * Use when building LIKE patterns - prevents injection and wildcard abuse.
 */
export function sanitizeSearchInput(input: string, maxLen = 100): string {
  return String(input)
    .replace(/[%_\\]/g, '')
    .replace(/[;\-]/g, '')
    .substring(0, maxLen);
}

/**
 * Escape LIKE wildcards so user input is treated as literal text.
 * Use when user search should match literal %, _, \ characters.
 */
export function escapeLikeWildcards(input: string): string {
  return String(input)
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_');
}

// Format Zod errors for API response
export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  error.errors.forEach((err) => {
    const path = err.path.join('.');
    errors[path] = err.message;
  });
  return errors;
}
