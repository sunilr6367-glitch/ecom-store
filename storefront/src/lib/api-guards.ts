/**
 * API Response Validation Guards
 * 
 * Type guard functions to validate API responses at runtime
 * These ensure data matches expected types before using in components
 * 
 * Usage:
 *   const data = await api.getProducts();
 *   if (isValidProductResponse(data)) {
 *     // data is guaranteed to be Product[]
 *   }
 */

import type {
  ApiResponse,
  ApiProductResponse,
  ApiCollectionResponse,
  ApiCustomerResponse,
  ApiOrderResponse,
  ApiCartResponse,
  ApiVariantResponse,
  ApiAddressResponse,
} from '@/types/api-contracts';

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : null;
}

/**
 * Validates that a value is a valid ApiResponse structure
 */
export function isValidApiResponse(data: unknown): data is ApiResponse<unknown> {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  return typeof obj.success === 'boolean';
}

/**
 * Validates ApiResponse with specific data type
 */
export function isApiResponseOf<T>(
  data: unknown,
  validator: (val: unknown) => val is T
): data is ApiResponse<T> {
  if (!isValidApiResponse(data)) {
    return false;
  }

  const payload = (data as ApiResponse<unknown>).data;
  return payload === undefined || validator(payload);
}

/**
 * Validates Product response from API
 */
export function isValidProductResponse(data: unknown): data is ApiProductResponse {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  
  return (
    typeof obj.id === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.handle === 'string' &&
    typeof obj.created_at === 'string' &&
    typeof obj.status === 'string' &&
    (obj.status === 'draft' || obj.status === 'published' || obj.status === 'archived')
  );
}

/**
 * Validates array of products
 */
export function isValidProductArray(data: unknown): data is ApiProductResponse[] {
  return (
    Array.isArray(data) &&
    (data.length === 0 || data.every(item => isValidProductResponse(item)))
  );
}

/**
 * Validates Collection response
 */
export function isValidCollectionResponse(data: unknown): data is ApiCollectionResponse {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  
  return (
    typeof obj.id === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.handle === 'string'
  );
}

/**
 * Validates array of collections
 */
export function isValidCollectionArray(data: unknown): data is ApiCollectionResponse[] {
  return (
    Array.isArray(data) &&
    (data.length === 0 || data.every(item => isValidCollectionResponse(item)))
  );
}

/**
 * Validates Customer response
 */
export function isValidCustomerResponse(data: unknown): data is ApiCustomerResponse {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  
  return (
    typeof obj.id === 'string' &&
    typeof obj.email === 'string'
  );
}

/**
 * Validates Order response
 */
export function isValidOrderResponse(data: unknown): data is ApiOrderResponse {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  
  return (
    typeof obj.id === 'string' &&
    typeof obj.display_id === 'number' &&
    typeof obj.email === 'string' &&
    typeof obj.total === 'number' &&
    Array.isArray(obj.items)
  );
}

/**
 * Validates array of orders
 */
export function isValidOrderArray(data: unknown): data is ApiOrderResponse[] {
  return (
    Array.isArray(data) &&
    (data.length === 0 || data.every(item => isValidOrderResponse(item)))
  );
}

/**
 * Validates Cart response
 */
export function isValidCartResponse(data: unknown): data is ApiCartResponse {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  
  return (
    typeof obj.id === 'string' &&
    typeof obj.total === 'number' &&
    Array.isArray(obj.items)
  );
}

/**
 * Validates Variant response
 */
export function isValidVariantResponse(data: unknown): data is ApiVariantResponse {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  
  return (
    typeof obj.id === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.inventory_quantity === 'number'
  );
}

/**
 * Validates array of variants
 */
export function isValidVariantArray(data: unknown): data is ApiVariantResponse[] {
  return (
    Array.isArray(data) &&
    (data.length === 0 || data.every(item => isValidVariantResponse(item)))
  );
}

/**
 * Validates Address response
 */
export function isValidAddressResponse(data: unknown): data is ApiAddressResponse {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  
  // Address might be minimal, just check it's an object
  return typeof obj.address_1 === 'string' || typeof obj.city === 'string';
}

/**
 * Validates Pagination metadata
 */
export function isValidPagination(data: unknown): data is { limit: number; offset: number; total: number; has_more: boolean } {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  
  return (
    typeof obj.limit === 'number' &&
    typeof obj.offset === 'number' &&
    typeof obj.total === 'number' &&
    typeof obj.has_more === 'boolean'
  );
}

/**
 * Validates API error response
 */
export function isValidErrorResponse(data: unknown): data is { success: false; error: { code: string; message: string } } {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  const error = obj.error as Record<string, unknown> | undefined;
  
  return (
    obj.success === false &&
    obj.error !== undefined &&
    typeof error?.code === 'string' &&
    typeof error?.message === 'string'
  );
}

/**
 * Safe JSON parser with validation
 */
export function parseApiResponse<T>(
  json: unknown,
  validator: (val: unknown) => val is T
): T | null {
  try {
    if (validator(json)) {
      return json as T;
    }
    return null;
  } catch {
    console.error('[GuardValidator] Failed to validate response');
    return null;
  }
}

/**
 * Validates response structure before processing
 */
export function validateApiResponse<T>(
  response: ApiResponse<unknown>,
  validator: (val: unknown) => val is T
): response is ApiResponse<T> {
  if (!response.success) {
    console.error('[API Error]', response.error?.message);
    return false;
  }
  
  if (!validator(response.data)) {
    console.error('[Type Validation Failed] Data does not match expected type');
    return false;
  }
  
  return true;
}

/**
 * Helper to safely extract and validate list from response
 */
export function extractAndValidateList<T>(
  response: unknown,
  validator: (val: unknown) => val is T[]
): T[] {
  try {
    const record = asRecord(response);

    // Handle ApiResponse wrapped format
    if (record?.success && record.data && validator(record.data)) {
      return record.data;
    }
    
    // Handle direct array format
    if (validator(response)) {
      return response;
    }
    
    // Handle data-wrapped format
    if (record?.data && validator(record.data)) {
      return record.data;
    }
    
    console.warn('[extractAndValidateList] Could not extract valid list from response');
    return [];
  } catch (error) {
    console.error('[extractAndValidateList] Error:', error);
    return [];
  }
}

/**
 * Helper to safely extract and validate single item from response
 */
export function extractAndValidateItem<T>(
  response: unknown,
  validator: (val: unknown) => val is T
): T | null {
  try {
    const record = asRecord(response);

    // Handle ApiResponse wrapped format
    if (record?.success && record.data && validator(record.data)) {
      return record.data;
    }
    
    // Handle direct item format
    if (validator(response)) {
      return response;
    }
    
    // Handle data-wrapped format
    if (record?.data && validator(record.data)) {
      return record.data;
    }
    
    console.warn('[extractAndValidateItem] Could not extract valid item from response');
    return null;
  } catch (error) {
    console.error('[extractAndValidateItem] Error:', error);
    return null;
  }
}

/**
 * Exports all validators as namespace for convenience
 */
export const ApiValidators = {
  isValidApiResponse,
  isValidProductResponse,
  isValidProductArray,
  isValidCollectionResponse,
  isValidCollectionArray,
  isValidCustomerResponse,
  isValidOrderResponse,
  isValidOrderArray,
  isValidCartResponse,
  isValidVariantResponse,
  isValidVariantArray,
  isValidAddressResponse,
  isValidPagination,
  isValidErrorResponse,
  parseApiResponse,
  validateApiResponse,
  extractAndValidateList,
  extractAndValidateItem,
};
