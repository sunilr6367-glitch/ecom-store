/**
 * Unified API Fetch Wrapper
 * 
 * Provides consistent API calling pattern with built-in:
 * - Type safety and validation
 * - Error handling
 * - Response normalization
 * - CSRF token injection (when needed)
 * - Request/response logging in development
 * 
 * Usage:
 *   const products = await apiFetch<Product[]>('/products');
 *   const product = await apiFetch<Product>('/products/handle', { method: 'GET' });
 */

import { getApiBaseUrl } from './api-base-url';

const API_URL = getApiBaseUrl();

const DEFAULT_TIMEOUT_MS = 15000;

/**
 * ApiError - Custom error class for API failures
 */
export class ApiError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Options for apiFetch
 */
export interface ApiFetchOptions extends RequestInit {
  /**
   * Timeout in milliseconds (default: 15000)
   */
  timeout?: number;
  
  /**
   * Validator function to validate response data
   */
  validator?: (data: unknown) => boolean;
  
  /**
   * Whether to throw on non-2xx status (default: true)
   */
  throwOnError?: boolean;
  
  /**
   * Next.js ISR options
   */
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
}

interface ApiErrorBody {
  message?: string;
  code?: string;
  details?: Record<string, unknown>;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : null;
}

/**
 * Main API fetch function with type safety
 * 
 * @param endpoint - API endpoint (without base URL)
 * @param options - Fetch options
 * @returns Typed API response
 * 
 * @example
 *   // GET request
 *   const products = await apiFetch<Product[]>('/products');
 *   
 *   // POST request with body
 *   const order = await apiFetch<Order>('/orders', {
 *     method: 'POST',
 *     body: JSON.stringify(orderData),
 *   });
 *   
 *   // With timeout and custom validator
 *   const product = await apiFetch<Product>('/products/handle', {
 *     timeout: 5000,
 *     validator: isValidProductResponse,
 *   });
 */
export async function apiFetch<T>(
  endpoint: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const {
    timeout = DEFAULT_TIMEOUT_MS,
    validator,
    throwOnError = true,
    next,
    ...fetchOptions
  } = options;

  const url = `${API_URL}${endpoint}`;
  const method = (fetchOptions.method || 'GET').toUpperCase();

  // Setup timeout
  const controller = typeof AbortController !== 'undefined' 
    ? new AbortController() 
    : null;
  
  let timeoutId: NodeJS.Timeout | undefined;
  
  if (controller && timeout > 0) {
    timeoutId = setTimeout(() => controller.abort(), timeout);
  }

  try {
    // Add headers
    const headers = new Headers(fetchOptions.headers as HeadersInit);
    
    // Add CSRF token for mutations (if available)
    if (method !== 'GET' && method !== 'HEAD') {
      try {
        const { getCsrfToken } = await import('./csrf');
        const token = await getCsrfToken();
        if (token) {
          headers.set('X-CSRF-Token', token);
        }
      } catch {
        // CSRF module not yet ready or error getting token
        // This is not critical - proceed without CSRF token
      }
    }

    // Content-Type for JSON
    if (fetchOptions.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`[API] ${method} ${endpoint}`);
    }

    // Make request
    const response = await fetch(url, {
      ...fetchOptions,
      method,
      headers,
      signal: controller?.signal,
      ...(next && { next }),
    });

    // Handle non-2xx responses
    if (!response.ok) {
      let errorData: unknown;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: response.statusText };
      }

      const errorRecord = asRecord(errorData);
      const nestedError = asRecord(errorRecord?.error) as ApiErrorBody | null;
      const message =
        nestedError?.message ||
        (typeof errorRecord?.message === 'string'
          ? errorRecord.message
          : response.statusText);
      const code = nestedError?.code || `HTTP_${response.status}`;

      if (throwOnError) {
        throw new ApiError(code, response.status, message, nestedError?.details);
      }

      if (process.env.NODE_ENV === 'development') {
        console.error(`[API] Error ${response.status}:`, message);
      }

      return null as T;
    }

    // Parse response
    const data: unknown = await response.json();
    const dataRecord = asRecord(data);

    // Handle ApiResponse wrapped format
    if (dataRecord && dataRecord.success !== undefined) {
      const wrappedError = asRecord(dataRecord.error) as ApiErrorBody | null;

      if (!dataRecord.success) {
        const message = wrappedError?.message || 'API request failed';
        const code = wrappedError?.code || 'API_ERROR';
        
        if (throwOnError) {
          throw new ApiError(code, 200, message, wrappedError?.details);
        }
        return null as T;
      }

      // Validate if validator provided
      if (validator && dataRecord.data !== undefined) {
        if (!validator(dataRecord.data)) {
          console.warn('[API] Response validation failed for:', endpoint);
          if (throwOnError) {
            throw new ApiError('VALIDATION_ERROR', 200, 'Response validation failed');
          }
          return null as T;
        }
      }

      // Return unwrapped data
      return dataRecord.data as T;
    }

    // Handle direct data format (not wrapped in ApiResponse)
    // Try to validate if validator provided
    if (validator) {
      if (!validator(data)) {
        console.warn('[API] Response validation failed for:', endpoint);
        if (throwOnError) {
          throw new ApiError('VALIDATION_ERROR', 200, 'Response validation failed');
        }
        return null as T;
      }
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Handle timeout
    if (error instanceof DOMException && error.name === 'AbortError') {
      const message = `Request timeout after ${timeout}ms`;
      throw new ApiError('TIMEOUT', 408, message);
    }

    // Handle network errors
    if (error instanceof TypeError) {
      throw new ApiError('NETWORK_ERROR', 0, `Network error: ${error.message}`);
    }

    // Unknown error
    throw new ApiError('UNKNOWN_ERROR', 0, `Unknown error: ${String(error)}`);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * Convenience function for GET requests
 */
export async function apiGet<T>(
  endpoint: string,
  options?: Omit<ApiFetchOptions, 'method' | 'body'>
): Promise<T> {
  return apiFetch<T>(endpoint, { ...options, method: 'GET' });
}

/**
 * Convenience function for POST requests
 */
export async function apiPost<T>(
  endpoint: string,
  body?: unknown,
  options?: Omit<ApiFetchOptions, 'method' | 'body'>
): Promise<T> {
  return apiFetch<T>(endpoint, {
    ...options,
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Convenience function for PUT requests
 */
export async function apiPut<T>(
  endpoint: string,
  body?: unknown,
  options?: Omit<ApiFetchOptions, 'method' | 'body'>
): Promise<T> {
  return apiFetch<T>(endpoint, {
    ...options,
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Convenience function for PATCH requests
 */
export async function apiPatch<T>(
  endpoint: string,
  body?: unknown,
  options?: Omit<ApiFetchOptions, 'method' | 'body'>
): Promise<T> {
  return apiFetch<T>(endpoint, {
    ...options,
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Convenience function for DELETE requests
 */
export async function apiDelete<T>(
  endpoint: string,
  options?: Omit<ApiFetchOptions, 'method' | 'body'>
): Promise<T> {
  return apiFetch<T>(endpoint, { ...options, method: 'DELETE' });
}

/**
 * Helper to batch multiple API calls with consistent error handling
 */
export async function apiBatch<T extends Record<string, Promise<unknown>>>(
  calls: T
): Promise<Record<string, unknown>> {
  const results: Record<string, unknown> & {
    errors: Record<string, unknown>;
  } = { errors: {} };

  const entries = Object.entries(calls);
  const promises = entries.map(async ([key, promise]) => {
    try {
      const result = await promise;
      results[key] = result;
    } catch (error) {
      results.errors[key] = error;
      console.error(`[API Batch] Error in ${key}:`, error);
    }
  });

  await Promise.all(promises);

  return results;
}

/**
 * Exports for convenience
 */
export const Api = {
  fetch: apiFetch,
  get: apiGet,
  post: apiPost,
  put: apiPut,
  patch: apiPatch,
  delete: apiDelete,
  batch: apiBatch,
  Error: ApiError,
};
