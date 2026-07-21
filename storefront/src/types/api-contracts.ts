/**
 * API Contract Type Definitions
 * 
 * Defines standardized types for all API requests and responses
 * This is the source of truth for API communication contracts
 * 
 * Pattern: ApiResponse<T> wraps all responses with consistent structure
 */

// ==========================================
// STANDARD API RESPONSE WRAPPER
// ==========================================

/**
 * Standard API response structure used by all endpoints
 * All API responses must follow this format for consistency
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  pagination?: ApiPagination;
  meta?: {
    timestamp: string;
    version: string;
    [key: string]: unknown;
  };
}

/**
 * Pagination metadata included in list responses
 */
export interface ApiPagination {
  limit: number;
  offset: number;
  total: number;
  has_more: boolean;
}

// ==========================================
// PRODUCT API CONTRACTS
// ==========================================

/**
 * Product as returned from backend API
 * May have different structure than frontend Product type
 */
export interface ApiProductResponse {
  id: string;
  title: string;
  description?: string;
  handle: string;
  thumbnail?: string | null;
  subtitle?: string;
  status: 'draft' | 'published' | 'archived';
  variants?: ApiVariantResponse[];
  options?: ApiOptionResponse[];
  images?: {
    id: string;
    url: string;
    alt?: string;
    alt_text?: string;
    position?: number;
    is_thumbnail?: boolean | null;
    metadata?: {
      media_type?: 'image' | 'video';
      thumbnail_url?: string;
      mime_type?: string;
      file_size?: number;
    } | null;
  }[];
  material?: string;
  origin_country?: string;
  size_guide?: Record<string, unknown> | string;
  care_instructions?: string;
  seo_title?: string;
  seo_description?: string;
  seo?: Record<string, unknown> | null;
  discovery?: Record<string, unknown> | null;
  attributes?: Record<string, unknown>[];
  merchant?: Record<string, unknown>[];
  media_seo?: Record<string, unknown>[];
  artisan?: {
    id?: string;
    name?: string;
    slug?: string;
    craft_specialty?: string | null;
    location?: string | null;
  } | null;
  semantic_related_products?: ApiProductResponse[];
  avg_rating?: number;
  review_count?: number;
  created_at: string;
  updated_at?: string;
  collection?: { id: string; title: string; handle?: string };
  categories?: Array<{
    id?: string;
    name?: string;
    handle?: string;
    slug?: string;
    category?: {
      id: string;
      name: string;
      handle?: string;
      slug?: string;
    };
  }>;
  // Add other API-specific fields here
}

/**
 * Variant as returned from backend API
 */
export interface ApiVariantResponse {
  id: string;
  product_id?: string;
  title: string;
  sku?: string | null;
  barcode?: string;
  inventory_quantity: number;
  manage_inventory: boolean;
  prices?: ApiPriceResponse[];
  compare_at_price?: number | null;
  merchant?: Record<string, unknown> | null;
  position?: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Price/MoneyAmount as returned from API
 */
export interface ApiPriceResponse {
  id: string;
  currency_code: string;
  amount: number;
  region_id?: string | null;
}

/**
 * Product option as returned from API
 */
export interface ApiOptionResponse {
  id?: string;
  product_id?: string;
  title: string;
  position?: number;
  values: { id?: string; value: string }[];
}

/**
 * Collection as returned from API
 */
export interface ApiCollectionResponse {
  id: string;
  title: string;
  handle: string;
  description?: string;
  image?: string;
  products?: ApiProductResponse[];
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

// ==========================================
// CUSTOMER & ORDER API CONTRACTS
// ==========================================

/**
 * Customer as returned from API
 */
export interface ApiCustomerResponse {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  billing_address?: ApiAddressResponse;
  shipping_address?: ApiAddressResponse;
  default_billing_address_id?: string;
  default_shipping_address_id?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Address as returned from API
 */
export interface ApiAddressResponse {
  id?: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  address_1?: string;
  address_2?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  country_code?: string;
  phone?: string;
  is_default_billing?: boolean;
  is_default_shipping?: boolean;
}

/**
 * Order as returned from API
 */
export interface ApiOrderResponse {
  id: string;
  display_id: number;
  email: string;
  total: number;
  tax_total: number;
  shipping_total: number;
  discount_total: number;
  subtotal: number;
  currency_code: string;
  status: 'pending' | 'completed' | 'canceled' | 'refunded';
  payment_status: 'not_paid' | 'awaiting' | 'paid' | 'captured' | 'partially_refunded' | 'refunded';
  fulfillment_status: 'not_fulfilled' | 'partially_fulfilled' | 'fulfilled' | 'partially_returned' | 'returned' | 'canceled';
  items: ApiLineItemResponse[];
  shipping_address?: ApiAddressResponse;
  billing_address?: ApiAddressResponse;
  region_id?: string;
  customer_id?: string;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at?: string;
}

/**
 * Line item in order as returned from API
 */
export interface ApiLineItemResponse {
  id: string;
  order_id?: string;
  product_id?: string;
  product_title?: string;
  variant_id?: string;
  variant_title?: string;
  quantity: number;
  unit_price: number;
  total: number;
  tax_total?: number;
  discount_total?: number;
  metadata?: Record<string, unknown>;
}

// ==========================================
// SEARCH & FILTER API CONTRACTS
// ==========================================

/**
 * Search response from API
 */
export interface ApiSearchResponse {
  id: string;
  title: string;
  description?: string;
  handle: string;
  thumbnail?: string;
  type: 'product' | 'collection' | 'page';
  url: string;
}

/**
 * Filter response from API
 */
export interface ApiFilterResponse {
  attribute: string;
  options: ApiFilterOptionResponse[];
}

export interface ApiFilterOptionResponse {
  label: string;
  value: string;
  count: number;
  active?: boolean;
}

// ==========================================
// CART & CHECKOUT API CONTRACTS
// ==========================================

/**
 * Cart as returned from API
 */
export interface ApiCartResponse {
  id: string;
  title?: string;
  items: ApiLineItemResponse[];
  subtotal: number;
  tax_total: number;
  shipping_total: number;
  discount_total: number;
  total: number;
  currency_code: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
  expires_at?: string;
}

// ==========================================
// AUTH API CONTRACTS
// ==========================================

/**
 * Login response from API
 */
export interface ApiLoginResponse {
  customer: ApiCustomerResponse;
  token: string;
  expires_in: number;
}

/**
 * Register response from API
 */
export interface ApiRegisterResponse {
  customer: ApiCustomerResponse;
  token: string;
  expires_in: number;
}

// ==========================================
// TYPE GUARDS & VALIDATORS
// ==========================================

/**
 * Type guard to check if response is ApiProductResponse
 */
export function isApiProductResponse(
  data: unknown
): data is ApiProductResponse {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.handle === 'string' &&
    typeof obj.created_at === 'string'
  );
}

/**
 * Type guard to check if data is an array of ApiProductResponse
 */
export function isProductArray(
  data: unknown
): data is ApiProductResponse[] {
  return (
    Array.isArray(data) &&
    (data.length === 0 || data.every(item => isApiProductResponse(item)))
  );
}

/**
 * Type guard to check if response is ApiCollectionResponse
 */
export function isApiCollectionResponse(
  data: unknown
): data is ApiCollectionResponse {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.handle === 'string'
  );
}

/**
 * Type guard to check if response is ApiOrderResponse
 */
export function isApiOrderResponse(
  data: unknown
): data is ApiOrderResponse {
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
 * Type guard to check if response is ApiCustomerResponse
 */
export function isApiCustomerResponse(
  data: unknown
): data is ApiCustomerResponse {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.email === 'string'
  );
}

/**
 * Type guard to validate generic ApiResponse structure
 */
export function isApiResponse<T>(
  data: unknown,
  validator?: (data: unknown) => data is T
): data is ApiResponse<T> {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  
  // Check success status
  if (typeof obj.success !== 'boolean') return false;
  
  // If validator provided, validate data
  if (validator && obj.data !== undefined && !validator(obj.data)) {
    return false;
  }
  
  return true;
}

// ==========================================
// EXPORT FOR CONVENIENCE
// ==========================================

export type ApiContractProduct = ApiProductResponse;
export type ApiContractVariant = ApiVariantResponse;
export type ApiContractCollection = ApiCollectionResponse;
export type ApiContractCustomer = ApiCustomerResponse;
export type ApiContractOrder = ApiOrderResponse;
export type ApiContractCart = ApiCartResponse;
export type ApiContractResponse<T> = ApiResponse<T>;
export type ApiContractPagination = ApiPagination;
