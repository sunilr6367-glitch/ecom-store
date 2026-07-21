/**
 * 🔒 FIX-012: Sanitized Logging Utility
 *
 * Prevents sensitive data (PII, passwords, tokens) from being logged.
 */

interface SanitizeOptions {
  /** Fields to redact (default: common sensitive field names) */
  fields?: string[];
  /** Maximum depth for recursion */
  maxDepth?: number;
  /** Current recursion depth */
  depth?: number;
}

/**
 * Default sensitive field patterns to redact
 */
const DEFAULT_SENSITIVE_FIELDS = [
  'password',
  'password_hash',
  'token',
  'jwt',
  'authorization',
  'access_token',
  'refresh_token',
  'secret',
  'api_key',
  'apikey',
  'private_key',
  'card_number',
  'cardNumber',
  'cvv',
  'cvc',
  'credit_card',
  'creditCard',
  'ssn',
  'social_security',
  'email', // PII
  'phone', // PII
  'address', // PII
  'first_name', // PII
  'last_name', // PII
  'two_factor_secret',
  '2fa_secret',
];

/**
 * Check if a key matches any sensitive field pattern
 */
function isSensitiveField(key: string): boolean {
  const lowerKey = key.toLowerCase();
  return DEFAULT_SENSITIVE_FIELDS.some((field) =>
    lowerKey.includes(field.toLowerCase())
  );
}

/**
 * Sanitize an object to remove sensitive data
 */
export function sanitizeForLog<T = unknown>(
  data: T,
  options: SanitizeOptions = {}
): T {
  const {
    fields = DEFAULT_SENSITIVE_FIELDS,
    maxDepth = 5,
    depth = 0,
  } = options;

  if (depth > maxDepth) {
    return data as T;
  }

  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'object') {
    if (Array.isArray(data)) {
      return data.map((item) =>
        sanitizeForLog(item, {
          ...options,
          depth: depth + 1,
        })
      ) as T;
    }

    if (Buffer.isBuffer(data)) {
      return '[BUFFER]' as T;
    }

    if (data instanceof Date) {
      return data as T;
    }

    if (data instanceof Error) {
      return {
        name: data.name,
        message: data.message,
        stack: data.stack,
      } as T;
    }

    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(
      data as Record<string, unknown>
    )) {
      if (isSensitiveField(key)) {
        result[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        result[key] = sanitizeForLog(value, {
          ...options,
          depth: depth + 1,
        });
      } else {
        result[key] = value;
      }
    }

    return result as T;
  }

  return data;
}

/**
 * Create a sanitized string representation of data
 */
export function safeStringify(data: unknown): string {
  const sanitized = sanitizeForLog(data);
  try {
    return JSON.stringify(sanitized, null, 2);
  } catch {
    return String(data);
  }
}

/**
 * Log with automatic sanitization
 */
export function safeLog(
  level: 'debug' | 'info' | 'warn' | 'error',
  message: string,
  data?: unknown
): void {
  const sanitizedData = data ? sanitizeForLog(data) : undefined;
  const args = sanitizedData
    ? [message, safeStringify(sanitizedData)]
    : [message];

  switch (level) {
    case 'debug':
      console.debug(...args);
      break;
    case 'info':
      console.info(...args);
      break;
    case 'warn':
      console.warn(...args);
      break;
    case 'error':
      console.error(...args);
      break;
  }
}

/**
 * Convenience functions
 */
export const logDebug = (message: string, data?: unknown) =>
  safeLog('debug', message, data);

export const logInfo = (message: string, data?: unknown) =>
  safeLog('info', message, data);

export const logWarn = (message: string, data?: unknown) =>
  safeLog('warn', message, data);

export const logError = (message: string, error?: unknown) =>
  safeLog('error', message, error);

/**
 * Redact a specific value (useful for individual field sanitization)
 */
export function redact(value: unknown): string {
  const type = typeof value;

  if (value === null || value === undefined) {
    return String(value);
  }

  if (type === 'string') {
    const str = value as string;
    // Keep first/last 2 chars for readability if long enough
    if (str.length > 8) {
      return `${str.substring(0, 2)}***${str.substring(str.length - 2)}`;
    }
    return '***';
  }

  if (type === 'number') {
    return '[NUMBER]';
  }

  if (type === 'boolean') {
    return '[BOOLEAN]';
  }

  return '[REDACTED]';
}
