/**
 * API Integration Layer - Task 2 Standardization
 * 
 * This file provides centralized API communication with:
 * ✅ Type-safe request/response handling (api-contracts.ts)
 * ✅ Response validation guards (api-guards.ts)
 * ✅ Unified request wrapper (api-fetch.ts)
 * ✅ Adapter patterns for response transformation
 * 
 * Pattern for adding new endpoints:
 * 1. Define types in /types/api-contracts.ts
 * 2. Use adaptProduct/adaptProducts for transformations
 * 3. Add validation guards to ensure type safety
 * 4. Use try/catch with proper error handling
 * 5. Return standardized response format
 */

// Import adapter functions for API response conversion
import { adaptProduct, adaptProducts } from './api-adapters';
import { getApiBaseUrl } from './api-base-url';

import type { Product } from '@/types';
import type { HomepagePayload } from '@/types/homepage';

const API_URL = getApiBaseUrl();

const DEFAULT_API_TIMEOUT_MS = 15000;
const DEFAULT_CLIENT_TIMEOUT_MS = 15000;

// Environment-aware timeout: longer for SSR, shorter for client
// Note: API_TIMEOUT only applies to SSR (server-side). For client-side overrides,
// use NEXT_PUBLIC_API_TIMEOUT (process.env.NEXT_PUBLIC_API_TIMEOUT)
function getApiTimeout(): number {
  // Server-side: check API_TIMEOUT environment variable
  if (globalThis.window === undefined) {
    const envTimeout = process.env.API_TIMEOUT;
    if (envTimeout) {
      const parsed = Number.parseInt(envTimeout, 10);
      if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
        return parsed;
      }
    }
    return DEFAULT_API_TIMEOUT_MS;
  }

  // Client-side: check NEXT_PUBLIC_API_TIMEOUT for runtime configurability
  const publicEnvTimeout = process.env.NEXT_PUBLIC_API_TIMEOUT;
  if (publicEnvTimeout) {
    const parsed = Number.parseInt(publicEnvTimeout, 10);
    if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return DEFAULT_CLIENT_TIMEOUT_MS;
}
const API_TIMEOUT = getApiTimeout();

export interface StudioInquiryData {
  product_id?: string;
  product_title: string;
  product_handle?: string;
  product_url?: string;
  inquiry_type: 'question' | 'custom_size' | 'shipping';
  customer_name: string;
  email?: string;
  phone?: string;
  message: string;
  measurements?: {
    height?: string;
    bust?: string;
    waist?: string;
    hips?: string;
    preferredLength?: string;
  };
}

function getTime(): number {
  return typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now();
}

function getUrlString(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.href;
  if (input instanceof Request) return input.url;
  return String(input);
}

// Helper function for API requests with basic timing and timeout
async function fetchWithTrace(
  input: RequestInfo | URL,
  init?: RequestInit & { next?: object }
) {
  const startTime = getTime();
  const controller = typeof AbortController === 'undefined' ? null : new AbortController();
  const timeoutId = controller ? setTimeout(() => controller.abort(), API_TIMEOUT) : null;

  try {
    const response = await fetch(input, { ...init, signal: controller?.signal });
    const duration = Math.round(getTime() - startTime);

    if (process.env.NODE_ENV === 'development' && globalThis.window !== undefined) {
      console.log(`[API ${response.status}] ${getUrlString(input)} (${duration}ms)`);
    }
    return response;
  } catch (error) {
    const duration = Math.round(getTime() - startTime);
    if (process.env.NODE_ENV === 'development' && globalThis.window !== undefined) {
      console.error(`[API ERROR] ${getUrlString(input)} (${duration}ms):`, error);
    }
    // If the request was aborted due to timeout, return a 504-like response
    if (error instanceof DOMException && error.name === 'AbortError') {
      return new Response(null, { status: 504, statusText: 'Request timed out' });
    }

    // For connection failures or other network errors, return a generic 502
    return new Response(null, { status: 502, statusText: 'Bad Gateway' });
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

// Type definitions for API requests/responses
interface OrderCreateData {
  region_id: string;
  currency_code: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  shipping_address: {
    first_name?: string;
    last_name?: string;
    address_1: string;
    address_2?: string;
    city: string;
    postal_code: string;
    province?: string;
    country_code: string;
  };
  items: Array<{
    variant_id: string;
    quantity: number;
  }>;
  shipping_method: string;
  discount_code?: string;
  gift_wrapping?: boolean;
  gift_message?: string;
}

interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface CustomerUpdateData {
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
}

interface CustomerAddressInput {
  first_name?: string;
  last_name?: string;
  company?: string;
  address_1: string;
  address_2?: string;
  city: string;
  province?: string;
  postal_code: string;
  country_code: string;
  phone?: string;
}

interface CustomerAddressRecord extends CustomerAddressInput {
  id: string;
  created_at?: string;
  updated_at?: string;
}

interface ReviewCreateData {
  rating: number;
  title?: string;
  content: string;
  author_name?: string;
  customer_id?: string;
  images?: string[];
}

interface TaxRate {
  country_code: string;
  rate: number;
  name: string;
}

interface StoreSettings {
  free_shipping_threshold?: number;
  currency_code?: string;
  store_name?: string;
  tax_rates?: TaxRate[];
  default_tax_rate?: number;
}

interface CartItem {
  id: string;
  variantId: string;
  quantity: number;
  title: string;
  price: number;
  currency: string;
  thumbnail?: string;
  material?: string;
  origin?: string;
  sku?: string;
  description?: string;
}

// CSRF is handled by backend origin-based validation
async function getCsrfHeader(): Promise<Record<string, string>> {
  return {};
}

interface ZodIssue {
  path: string[];
  message: string;
}

export const api = {
  async getHomepage(): Promise<HomepagePayload> {
    const res = await fetchWithTrace(`${API_URL}/homepage`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      throw new Error(`Homepage API failed with ${res.status}`);
    }
    return res.json();
  },
  async sendCheckoutOtp(email: string) {
    const res = await fetchWithTrace(`${API_URL}/store/checkout/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
    return data;
  },
  async verifyCheckoutOtp(email: string, otp: string) {
    const res = await fetchWithTrace(`${API_URL}/store/checkout/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
      credentials: 'include',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to verify OTP');
    return data;
  },
  // Generic methods for untyped calls (fixes compilation errors and enables tracing)
  async get(endpoint: string) {
    const res = await fetchWithTrace(`${API_URL}${endpoint}`, {
      credentials: 'include',
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const message = data.message || data.error || 'Request failed';
      const error = new Error(message) as Error & { status: number; data: unknown };
      error.status = res.status;
      error.data = data;
      throw error;
    }
    return res.json();
  },

  async post<TResponse = unknown, TBody = unknown>(
    endpoint: string,
    body: TBody
  ) {
    const csrfHeader = await getCsrfHeader();
    const res = await fetchWithTrace(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...csrfHeader,
      },
      body: JSON.stringify(body),
      credentials: 'include',
    });
    if (!res.ok) {
      // Try to parse error response
      const data = await res.json().catch(() => ({}));
      const message = data.message || data.error || 'Request failed';
      const error = new Error(message) as Error & { status: number; data: unknown };
      error.status = res.status;
      error.data = data;
      throw error;
    }
    return res.json() as Promise<TResponse>;
  },

  async put<TResponse = unknown, TBody = unknown>(
    endpoint: string,
    body: TBody
  ) {
    const csrfHeader = await getCsrfHeader();
    const res = await fetchWithTrace(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...csrfHeader,
      },
      body: JSON.stringify(body),
      credentials: 'include',
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const message = data.message || data.error || 'Request failed';
      const error = new Error(message) as Error & { status: number; data: unknown };
      error.status = res.status;
      error.data = data;
      throw error;
    }
    return res.json() as Promise<TResponse>;
  },

  async delete(endpoint: string) {
    const csrfHeader = await getCsrfHeader();
    const res = await fetchWithTrace(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        ...csrfHeader,
      },
      credentials: 'include',
    });
    if (res.status === 204) {
      return null;
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const message = data.message || data.error || 'Request failed';
      const error = new Error(message) as Error & { status: number; data: unknown };
      error.status = res.status;
      error.data = data;
      throw error;
    }
    return res.json();
  },

  async getRegions() {
    try {
      const res = await fetchWithTrace(`${API_URL}/regions`);
      if (!res.ok) throw new Error('Failed to fetch regions');
      return res.json();
    } catch {
      // Return fallback structure found in regions response
      return { regions: [] };
    }
  },

  async getCategories() {
    try {
      // Cache for 1 hour
      const res = await fetchWithTrace(`${API_URL}/categories/tree`, {
        next: { revalidate: 3600 },
      });
      if (!res.ok) {
        // Silently return fallback when backend not available
        return { categories: [] };
      }
      return res.json();
    } catch {
      // Silently return fallback when backend not available
      return { categories: [] };
    }
  },

  async getCategoriesTree() {
    return this.getCategories();
  },

  async getCollections() {
    try {
      const res = await fetchWithTrace(`${API_URL}/collections`, {
        cache: 'no-store',
      });
      if (!res.ok) {
        // Silently return fallback when backend not available
        return { collections: [] };
      }
      return res.json();
    } catch {
      // Silently return fallback when backend not available
      return { collections: [] };
    }
  },

  async getCollection(handle: string) {
    try {
      const res = await fetchWithTrace(`${API_URL}/collections/${encodeURIComponent(handle)}`, {
        cache: 'no-store',
      });
      if (!res.ok) {
        return { collection: null };
      }
      return res.json();
    } catch {
      return { collection: null };
    }
  },

  async getHomepageSettings() {
    try {
      const res = await fetchWithTrace(`${API_URL}/settings/homepage`, {
        next: { revalidate: 3600 },
      });
      if (!res.ok) {
        // Silently return fallback when backend not available
        return { settings: {} };
      }
      return res.json();
    } catch {
      // Silently return fallback when backend not available
      return { settings: {} };
    }
  },

  async getStoreSettings() {
    try {
      const res = await fetchWithTrace(`${API_URL}/store/settings`, {
        next: { revalidate: 3600 },
      });
      if (!res.ok) {
        // Silently return fallback when backend not available
        return null;
      }
      return res.json();
    } catch {
      // Silently return fallback when backend not available
      return null;
    }
  },

  // Get footer settings for wholesale page
  async getFooterSettings() {
    try {
      const res = await fetchWithTrace(`${API_URL}/settings/footer`, {
        next: { revalidate: 3600 },
      });
      if (!res.ok) {
        // Silently return fallback when backend not available
        return { settings: {} };
      }
      return res.json();
    } catch {
      // Silently return fallback when backend not available
      return { settings: {} };
    }
  },

  // Get wholesale tiers for public page
  async getWholesaleTiers() {
    try {
      const res = await fetchWithTrace(`${API_URL}/settings/wholesale-tiers`, {
        next: { revalidate: 3600 },
      });
      if (!res.ok) {
        // Silently return fallback when backend not available
        return { tiers: [] };
      }
      return res.json();
    } catch {
      // Silently return fallback when backend not available
      return { tiers: [] };
    }
  },

  async getPages() {
    try {
      const res = await fetchWithTrace(`${API_URL}/pages/storefront`, {
        next: { revalidate: 3600 },
      });
      if (!res.ok) {
        // Silently return fallback when backend not available
        return { pages: [] };
      }
      return res.json();
    } catch {
      // Silently return fallback when backend not available
      return { pages: [] };
    }
  },

  async getTags() {
    try {
      const res = await fetchWithTrace(`${API_URL}/tags`, {
        next: { revalidate: 3600 },
      });
      if (!res.ok) {
        // Silently return fallback when backend not available
        return { tags: [] };
      }
      return res.json();
    } catch {
      // Silently return fallback when backend not available
      return { tags: [] };
    }
  },

  async getTestimonials() {
    try {
      const res = await fetchWithTrace(`${API_URL}/testimonials/store`, {
        next: { revalidate: 3600 },
      });
      if (!res.ok) {
        // Silently return fallback when backend not available
        return { testimonials: [] };
      }
      return res.json();
    } catch {
      // Silently return fallback when backend not available
      return { testimonials: [] };
    }
  },

  async getFeaturedProducts(ids: string[]) {
    if (!ids || ids.length === 0) return { products: [] };
    try {
      const idsString = ids.join(',');
      const res = await fetchWithTrace(
        `${API_URL}/products/featured?ids=${encodeURIComponent(idsString)}`,
        { next: { revalidate: 3600 } }
      );
      if (!res.ok) {
        // Silently return fallback when backend not available
        return { products: [] };
      }
      const data = await res.json();
      return { products: data.data || [] };
    } catch {
      // Silently return fallback when backend not available
      return { products: [] };
    }
  },

  async getProducts(
    params: {
      region_id?: string;
      search?: string;
      min_price?: number;
      max_price?: number;
      sort?: string;
      limit?: number;
      offset?: number;
      category_id?: string;
      tag_id?: string;
      collection_id?: string;
      attribute_code?: string;
      attribute_value?: string;
      cache?: boolean;
    } = {}
  ): Promise<{ products: Product[]; total: number; limit?: number; offset?: number }> {
    const searchParams = new URLSearchParams();
    searchParams.set('status', 'published');

    Object.entries(params).forEach(([key, value]) => {
      if (value != null && key !== 'cache') {
        searchParams.set(key, value.toString());
      }
    });

      const url = `${API_URL}/products?${searchParams.toString()}`;

    try {
      // Cache for 60 seconds (ISR), but allow bypassing cache via params
      const cacheOptions = params.cache === false
        ? { cache: 'no-store' as RequestCache }
        : { next: { revalidate: 60, tags: ['products'] } };

      const res = await fetchWithTrace(url, cacheOptions);
      if (!res.ok) {
        return { products: [], total: 0 };
      }
      const json = await res.json();

      // Adapter for standardized backend response
      if (json.data && Array.isArray(json.data)) {
        // Use the adapter to convert API response to frontend types
        const products = adaptProducts(json.data);

        return {
          products,
          total: json.pagination?.total || products.length,
          limit: json.pagination?.limit,
          offset: json.pagination?.offset,
        };
      }
      return { products: [], total: 0 }; // Return empty if format unexpected
    } catch (error) {
      console.error('[API] getProducts error:', error);
      // Fallback for build time
      return { products: [], total: 0 };
    }
  },

  async getSuggestions(query: string) {
    if (!query || query.length < 2) return { suggestions: [] };
    try {
      const res = await fetchWithTrace(
        `${API_URL}/products/search/suggestions?q=${encodeURIComponent(query)}`
      );
      if (!res.ok) return { suggestions: [] };
      return res.json();
    } catch {
      return { suggestions: [] };
    }
  },

  async getSeoLandingPages() {
    try {
      const res = await fetchWithTrace(`${API_URL}/seo/landing-pages?status=active`, {
        next: { revalidate: 300, tags: ['seo-landing-pages'] },
      });
      if (!res.ok) return { landing_pages: [] };
      const json = await res.json();
      return json.data || { landing_pages: [] };
    } catch {
      return { landing_pages: [] };
    }
  },

  async getSeoLandingPage(slug: string) {
    try {
      const res = await fetchWithTrace(`${API_URL}/seo/landing-pages/${encodeURIComponent(slug)}`, {
        next: { revalidate: 300, tags: [`seo-landing-page-${slug}`] },
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data?.landing_page || null;
    } catch {
      return null;
    }
  },

  async getArtisans() {
    try {
      const res = await fetchWithTrace(`${API_URL}/artisans`, {
        next: { revalidate: 3600, tags: ['artisans'] },
      });
      if (!res.ok) return { artisans: [] };
      const json = await res.json();
      return json.data || { artisans: [] };
    } catch {
      return { artisans: [] };
    }
  },

  async getArtisan(slug: string) {
    try {
      const res = await fetchWithTrace(`${API_URL}/artisans/${encodeURIComponent(slug)}`, {
        next: { revalidate: 3600, tags: [`artisan-${slug}`] },
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || null;
    } catch {
      return null;
    }
  },

  getProduct: async (id: string): Promise<Product> => {
    try {
      const res = await fetchWithTrace(`${API_URL}/products/${id}`, {
        next: { revalidate: 60, tags: [`product-${id}`] },
      });
      if (!res.ok) throw new Error('Failed to fetch product');
      const json = await res.json();

      // Check most specific format first: { data: { product: {...} } }
      if (json.data?.product) {
        return adaptProduct(json.data.product);
      }

      // Handle direct data with id: { data: {...with id field...} }
      if (json.data?.id) {
        return adaptProduct(json.data);
      }

      // Fallback: direct product response shape
      if (json.success && json.data) {
        return adaptProduct(json.data);
      }

      throw new Error('Invalid API response format');
    } catch (error) {
      console.error('[API] getProduct failed', error);
      throw error; // Rethrow because page depends on it (dynamic params usually handled by notFound())
    }
  },

  // Search product by title (for reorder functionality)
  async searchProductsByTitle(title: string) {
    try {
      const res = await fetchWithTrace(
        `${API_URL}/products?search=${encodeURIComponent(title)}&status=published&limit=1`,
        {
          next: { revalidate: 60 },
        }
      );
      if (!res.ok) return null;
      const json = await res.json();
      return json.data?.[0] || null;
    } catch (error) {
      console.error('[API] searchProductsByTitle failed', error);
      return null;
    }
  },

  createOrder: async (data: OrderCreateData) => {
    const csrfHeader = await getCsrfHeader();
    const res = await fetchWithTrace(`${API_URL}/store/checkout/place-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...csrfHeader,
      },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    if (!res.ok) {
      const error = await res.json();
      const errorMessage =
        typeof error.details === 'string' ? error.details :
        typeof error.error === 'string' ? error.error :
        Array.isArray(error.error?.issues) ? error.error.issues.map((e: ZodIssue) => `${e.path.join('.')}: ${e.message}`).join(', ') :
        Array.isArray(error.details) ? error.details.map((e: ZodIssue) => e.message).join(', ') :
        'Failed to place order';
      throw new Error(errorMessage);
    }
    return res.json();
  },

  validateCoupon: async (code: string, cartTotal: number) => {
    const csrfHeader = await getCsrfHeader();
    const res = await fetchWithTrace(
      `${API_URL}/store/checkout/validate-coupon`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...csrfHeader,
        },
        body: JSON.stringify({ code, cart_total: cartTotal }),
        credentials: 'include',
      }
    );
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Invalid coupon');
    }
    return res.json();
  },

  // --- Shipping Options (PHASE 1.3) ---
  async getShippingOptions(
    countryCode: string,
    regionId?: string,
    postalCode?: string
  ) {
    try {
      const params = new URLSearchParams({ country_code: countryCode });
      if (regionId) params.append('region_id', regionId);
      if (postalCode?.trim()) params.append('postal_code', postalCode.trim());

      const res = await fetchWithTrace(
        `${API_URL}/store/checkout/shipping-options?${params}`,
        {
          credentials: 'include',
        }
      );
      if (!res.ok) {
        // Return default options if endpoint doesn't exist
        return getDefaultShippingOptions(countryCode);
      }
      return res.json();
    } catch {
      // Return default options on error
      return getDefaultShippingOptions(countryCode);
    }
  },

  // --- Tax Calculation (PHASE 1.4) ---
  async calculateTax(
    countryCode: string,
    subtotal: number,
    regionId?: string,
    settings?: StoreSettings
  ) {
    try {
      const csrfHeader = await getCsrfHeader();
      const res = await fetchWithTrace(`${API_URL}/store/checkout/tax`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...csrfHeader,
        },
        body: JSON.stringify({
          country_code: countryCode,
          subtotal,
          region_id: regionId,
        }),
        credentials: 'include',
      });
      if (!res.ok) {
        // Return default tax if endpoint doesn't exist
        return getDefaultTax(countryCode, subtotal, settings);
      }
      return res.json();
    } catch {
      // Return default tax on error
      return getDefaultTax(countryCode, subtotal, settings);
    }
  },

  // --- Auth ---
  async register(data: RegisterData) {
    const url = `${API_URL}/store/auth/register`;
    const res = await fetchWithTrace(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });

    if (!res.ok) {
      let errorMessage = `HTTP ${res.status}: Request failed`;

      try {
        const errorData = await res.json();

        // Handle Zod validation errors from backend (errorData.errors)
        if (errorData.success === false && errorData.errors) {
          const errors = errorData.errors;
          const firstError = Object.values(errors)[0];
          errorMessage =
            typeof firstError === 'string' ? firstError : 'Validation failed';
        } else if (errorData.success === false && errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.message || errorData.error) {
          errorMessage = errorData.message || errorData.error;
        }
      } catch {
        // Response body was empty or not JSON, keep the default errorMessage
      }

      const error = new Error(errorMessage) as Error & { status?: number };
      error.status = res.status;
      throw error;
    }

    const jsonData = await res.json();
    return jsonData;
  },

  // --- Resend Verification Email ---
  async resendVerification(email: string) {
    const csrfHeader = await getCsrfHeader();
    const res = await fetchWithTrace(
      `${API_URL}/store/auth/resend-verification`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...csrfHeader,
        },
        body: JSON.stringify({ email }),
        credentials: 'include',
      }
    );
    if (!res.ok) {
      let errorMessage = 'Failed to resend verification email';
      try {
        const error = await res.json();
        errorMessage = error.error || error.message || errorMessage;
      } catch {
        try {
          const errorText = await res.text();
          if (errorText) errorMessage = errorText;
        } catch {
          // Keep default error message
        }
      }
      throw new Error(errorMessage);
    }
    return res.json();
  },

  // --- Verify OTP ---
  async verifyOtp(data: { email: string; otp: string }) {
    const csrfHeader = await getCsrfHeader();
    const res = await fetchWithTrace(
      `${API_URL}/store/auth/verify-otp`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...csrfHeader,
        },
        body: JSON.stringify(data),
        credentials: 'include',
      }
    );
    if (!res.ok) {
      let errorMessage = 'Verification failed';
      try {
        const error = await res.json();
        errorMessage = error.error || error.message || errorMessage;
      } catch {
        // Keep default error message
      }
      throw new Error(errorMessage);
    }
    return res.json();
  },

  async login(data: LoginData) {
    const url = `${API_URL}/store/auth/login`;
    const res = await fetchWithTrace(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw errorData;
    }
    const jsonData = await res.json();
    return jsonData;
  },

  async socialLogin(
    provider: 'google' | 'facebook',
    data: {
      id_token?: string;
      access_token?: string;
      email: string;
      name?: string;
      avatar?: string;
    }
  ) {
    const res = await fetchWithTrace(
      `${API_URL}/store/auth/social/${provider}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',
      }
    );
    if (!res.ok) throw await res.json();
    return res.json();
  },

  async getCustomer() {
    const res = await fetchWithTrace(`${API_URL}/store/auth/me`, {
      credentials: 'include', // Cookies are sent automatically
    });
    if (!res.ok) throw new Error('Failed to fetch profile');
    return res.json();
  },

  async updateCustomer(data: CustomerUpdateData) {
    const csrfHeader = await getCsrfHeader();
    const res = await fetchWithTrace(`${API_URL}/store/customers/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...csrfHeader,
      },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to update profile');
    return res.json();
  },

  async getCustomerOrders() {
    const res = await fetchWithTrace(`${API_URL}/store/customers/me/orders`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch orders');
    return res.json();
  },

  async getCustomerAddresses(): Promise<{ addresses: CustomerAddressRecord[] }> {
    const res = await fetchWithTrace(
      `${API_URL}/store/customers/me/addresses`,
      {
        credentials: 'include',
      }
    );
    if (!res.ok) throw new Error('Failed to fetch addresses');
    return res.json();
  },

  async createCustomerAddress(
    data: CustomerAddressInput
  ): Promise<{ address: CustomerAddressRecord }> {
    return api.post('/store/customers/me/addresses', data);
  },

  async updateCustomerAddress(
    id: string,
    data: Partial<CustomerAddressInput>
  ): Promise<{ address: CustomerAddressRecord }> {
    return api.put(`/store/customers/me/addresses/${id}`, data);
  },

  async deleteCustomerAddress(id: string): Promise<{ success: boolean }> {
    return api.delete(`/store/customers/me/addresses/${id}`);
  },

  async getOrder(id: string) {
    const res = await fetchWithTrace(
      `${API_URL}/store/customers/me/orders/${id}`,
      {
        credentials: 'include',
      }
    );
    if (!res.ok) throw new Error('Failed to fetch order');
    return res.json();
  },

  async trackOrder(orderNumber: string, email: string) {
    const query = new URLSearchParams({
      order_number: orderNumber,
      email,
    });
    const res = await fetchWithTrace(
      `${API_URL}/store/orders/track?${query.toString()}`
    );
    if (!res.ok) {
      const error = await res.json().catch(() => null);
      throw new Error(error?.message || error?.error || 'Failed to track order');
    }
    const payload = await res.json();
    return payload.data;
  },

  // --- Cart Persistence (Cart Abandonment Recovery) ---
  async saveCart(items: CartItem[]) {
    try {
      const csrfHeader = await getCsrfHeader();
      const res = await fetchWithTrace(`${API_URL}/store/cart/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...csrfHeader,
        },
        body: JSON.stringify({ items }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to save cart');
      return res.json();
    } catch (error) {
      console.error('[API] saveCart error:', error);
      throw error;
    }
  },

  async getSavedCart() {
    try {
      const res = await fetchWithTrace(`${API_URL}/store/cart`, {
        credentials: 'include',
      });
      if (!res.ok) {
        // Return empty cart if not found
        return { items: [] };
      }
      return res.json();
    } catch (error) {
      console.error('[API] getSavedCart error:', error);
      return { items: [] };
    }
  },

  async clearSavedCart() {
    try {
      const csrfHeader = await getCsrfHeader();
      const res = await fetchWithTrace(`${API_URL}/store/cart/clear`, {
        method: 'POST',
        headers: {
          ...csrfHeader,
        },
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to clear saved cart');
      return res.json();
    } catch (error) {
      console.error('[API] clearSavedCart error:', error);
      throw error;
    }
  },

  async getBanners() {
    try {
      const res = await fetchWithTrace(`${API_URL}/banners`, {
        cache: 'no-store',
      });
      if (!res.ok) return { banners: [] }; // Return empty if fails, don't crash
      return res.json();
    } catch {
      return { banners: [] };
    }
  },

  async getHeroBanners() {
    try {
      const res = await fetchWithTrace(`${API_URL}/hero-banners`, {
        cache: 'no-store',
      });
      if (!res.ok) return { banners: [] };
      return res.json();
    } catch {
      return { banners: [] };
    }
  },

  async getTrustItems() {
    try {
      const res = await fetchWithTrace(`${API_URL}/trust-items`, {
        cache: 'no-store',
      });
      if (!res.ok) return { items: [] };
      return res.json();
    } catch {
      return { items: [] };
    }
  },

  async getTrendingReels() {
    try {
      const res = await fetchWithTrace(`${API_URL}/trending-reels`, {
        cache: 'no-store',
      });
      if (!res.ok) return { reels: [] };
      return res.json();
    } catch {
      return { reels: [] };
    }
  },

  async getReelCollections() {
    try {
      const res = await fetchWithTrace(`${API_URL}/reel-collections`, {
        cache: 'no-store',
      });
      if (!res.ok) return { collections: [] };
      return res.json();
    } catch {
      return { collections: [] };
    }
  },

  async recordTrendingReelView(id: string) {
    try {
      const res = await fetchWithTrace(`${API_URL}/trending-reels/${id}/view`, {
        method: 'POST',
      });
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  },

  async getHomepageCategories() {
    try {
      const res = await fetchWithTrace(`${API_URL}/homepage-categories`, {
        cache: 'no-store',
      });
      if (!res.ok) return { categories: [] };
      return res.json();
    } catch {
      return { categories: [] };
    }
  },

  async getCategoryCircles() {
    try {
      const res = await fetchWithTrace(`${API_URL}/category-circles`, {
        cache: 'no-store',
      });
      if (!res.ok) return { circles: [] };
      return res.json();
    } catch {
      return { circles: [] };
    }
  },

  async getSpotlightProducts(section = 'spotlight') {
    try {
      const suffix = section ? `?section=${encodeURIComponent(section)}` : '';
      const res = await fetchWithTrace(`${API_URL}/featured-products${suffix}`, {
        cache: 'no-store',
      });
      if (!res.ok) return { featuredProducts: [] };
      const json = await res.json();
      type SpotlightApiItem = Record<string, unknown> & {
        product?: Parameters<typeof adaptProduct>[0] | null;
      };

      return {
        featuredProducts: Array.isArray(json.featuredProducts)
          ? json.featuredProducts.map((item: SpotlightApiItem) => ({
              ...item,
              product: item.product ? adaptProduct(item.product) : null,
            }))
          : [],
      };
    } catch {
      return { featuredProducts: [] };
    }
  },

  async getHomepageMerchandising(slot?: string) {
    try {
      const suffix = slot ? `?slot=${encodeURIComponent(slot)}` : '';
      const res = await fetchWithTrace(`${API_URL}/homepage-merchandising${suffix}`, {
        cache: 'no-store',
      });
      if (!res.ok) return { slots: [] };
      return res.json();
    } catch {
      return { slots: [] };
    }
  },
  async getPosts() {
    try {
      // Cache for 60 seconds
      const res = await fetchWithTrace(`${API_URL}/posts/storefront`, {
        next: { revalidate: 60 },
      });
      if (!res.ok) return { posts: [] };
      return res.json();
    } catch {
      return { posts: [] };
    }
  },

  async getPost(slug: string) {
    // Cache for 60 seconds
    const res = await fetchWithTrace(`${API_URL}/posts/storefront/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error('Post not found');
    return res.json();
  },

  async getPage(slug: string) {
    // Cache for 60 mins
    const res = await fetchWithTrace(`${API_URL}/pages/storefront/${slug}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error('Page not found');
    return res.json();
  },

  async getReviews(productId: string) {
    const res = await fetchWithTrace(
      `${API_URL}/reviews/store/products/${productId}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) {
      throw new Error(`Failed to load reviews (${res.status})`);
    }
    return res.json();
  },

  async createReview(productId: string, data: ReviewCreateData) {
    const csrfHeader = await getCsrfHeader();
    const res = await fetchWithTrace(`${API_URL}/reviews/store`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...csrfHeader,
      },
      body: JSON.stringify({ ...data, product_id: productId }),
      credentials: 'include',
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  // --- Back in Stock Notifications ---
  async subscribeBackInStock(data: {
    product_id: string;
    email: string;
    variant_id?: string;
  }) {
    const csrfHeader = await getCsrfHeader();
    const res = await fetchWithTrace(`${API_URL}/store/back-in-stock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...csrfHeader,
      },
      body: JSON.stringify({
        product_id: data.product_id,
        variant_id: data.variant_id,
        email: data.email,
      }),
      credentials: 'include',
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  async submitStudioInquiry(data: StudioInquiryData) {
    const csrfHeader = await getCsrfHeader();
    const res = await fetchWithTrace(`${API_URL}/store/studio-inquiries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...csrfHeader,
      },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  async getStudioInquiryConversation(id: string, token: string) {
    const res = await fetchWithTrace(
      `${API_URL}/store/studio-inquiries/${id}?token=${encodeURIComponent(token)}`,
      {
        credentials: 'include',
      }
    );
    if (!res.ok) throw await res.json();
    return res.json();
  },

  async sendStudioInquiryMessage(data: {
    id: string;
    token: string;
    customer_name?: string;
    email?: string;
    message: string;
  }) {
    const csrfHeader = await getCsrfHeader();
    const res = await fetchWithTrace(`${API_URL}/store/studio-inquiries/${data.id}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...csrfHeader,
      },
      body: JSON.stringify({
        token: data.token,
        customer_name: data.customer_name,
        email: data.email,
        message: data.message,
      }),
      credentials: 'include',
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  async getCustomerStudioInquiries() {
    return api.get('/store/customers/me/studio-inquiries');
  },

  async getCustomerStudioInquiry(id: string) {
    return api.get(`/store/customers/me/studio-inquiries/${id}`);
  },

  async sendCustomerStudioMessage(id: string, message: string) {
    const csrfHeader = await getCsrfHeader();
    const res = await fetchWithTrace(`${API_URL}/store/customers/me/studio-inquiries/${id}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...csrfHeader,
      },
      body: JSON.stringify({ message }),
      credentials: 'include',
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  // --- Returns (Customer-initiated) ---
  async requestReturn(data: {
    order_id: string;
    reason: string;
    items: Array<{ line_item_id: string; quantity: number; restock?: boolean }>;
  }) {
    const csrfHeader = await getCsrfHeader();
    const res = await fetchWithTrace(`${API_URL}/store/returns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...csrfHeader,
      },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || error.error || 'Failed to submit return request');
    }
    return res.json();
  },

  async getCustomerReturns() {
    const res = await fetchWithTrace(`${API_URL}/store/returns`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch returns');
    return res.json();
  },

  // --- Payments ---
  async createPaymentIntent(orderId: string, checkoutToken: string) {
    const csrfHeader = await getCsrfHeader();
    const res = await fetchWithTrace(
      `${API_URL}/store/payments/create-intent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...csrfHeader,
        },
        body: JSON.stringify({
          order_id: orderId,
          checkout_token: checkoutToken,
        }),
        credentials: 'include',
      }
    );
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to create payment intent');
    }
    return res.json();
  },

  async checkPaymentStatus(orderId: string) {
    const res = await fetchWithTrace(
      `${API_URL}/store/payments/status/${orderId}`
    );
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to check payment status');
    }
    return res.json();
  },

  // --- Wholesale Pricing ---
  async getWholesalePricing() {
    try {
      const res = await fetchWithTrace(`${API_URL}/store/wholesale/prices`, {
        credentials: 'include',
      });
      if (!res.ok) return { hasWholesaleAccess: false, tier: null };
      return res.json();
    } catch {
      return { hasWholesaleAccess: false, tier: null };
    }
  },

  async getWholesalePrices(variantIds: string[]) {
    try {
      const res = await fetchWithTrace(
        `${API_URL}/store/wholesale/prices/bulk`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ variantIds }),
          credentials: 'include',
        }
      );
      if (!res.ok) return { prices: [] };
      return res.json();
    } catch {
      return { prices: [] };
    }
  },

  async getWholesaleMOQ(variantId: string) {
    try {
      const res = await fetchWithTrace(
        `${API_URL}/store/wholesale/moq/${variantId}`,
        {
          credentials: 'include',
        }
      );
      if (!res.ok) return { moq: 1 };
      return res.json();
    } catch {
      return { moq: 1 };
    }
  },

  async getWholesaleBulkDiscounts(variantId: string) {
    try {
      const res = await fetchWithTrace(
        `${API_URL}/store/wholesale/bulk-discounts/${variantId}`,
        {
          credentials: 'include',
        }
      );
      if (!res.ok) return { discounts: [] };
      return res.json();
    } catch {
      return { discounts: [] };
    }
  },

  async calculateWholesalePrice(variantId: string, quantity: number) {
    try {
      const res = await fetchWithTrace(`${API_URL}/store/wholesale/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId, quantity }),
        credentials: 'include',
      });
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  },

  async createWholesaleOrder(data: {
    items: Array<{ variant_id: string; quantity: number }>;
    shipping_address: Record<string, unknown>;
    email: string;
  }) {
    const csrfHeader = await getCsrfHeader();
    const res = await fetchWithTrace(`${API_URL}/store/wholesale/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...csrfHeader,
      },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Failed to create wholesale order' }));
      throw new Error(error.message || 'Failed to create wholesale order');
    }
    return res.json();
  },

  // --- Wishlist ---
  async getWishlist() {
    try {
      const res = await fetchWithTrace(`${API_URL}/store/wishlist`, {
        credentials: 'include',
      });
      if (!res.ok) return { wishlist: [] };
      return res.json();
    } catch {
      return { wishlist: [] };
    }
  },

  async addToWishlist(product_id: string, variant_id?: string) {
    const res = await fetchWithTrace(`${API_URL}/store/wishlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id, variant_id }),
      credentials: 'include',
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to add to wishlist');
    }
    return res.json();
  },

  async removeFromWishlist(product_id: string) {
    const res = await fetchWithTrace(`${API_URL}/store/wishlist/${product_id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to remove from wishlist');
    }
    return res.json();
  },

  // --- Campaigns ---
  async getActiveCampaigns() {
    try {
      const res = await fetchWithTrace(`${API_URL}/marketing/campaigns/active`, {
        next: { revalidate: 300 },
      });
      if (!res.ok) return { campaigns: [] };
      return res.json();
    } catch {
      return { campaigns: [] };
    }
  },
};


// Default shipping options fallback (PHASE 1.3)
function getDefaultShippingOptions(countryCode: string) {
  const isInternational = countryCode !== 'US';

  const options = [
    {
      id: 'standard',
      name: isInternational
        ? 'Standard International Shipping'
        : 'Standard Shipping',
      description: isInternational ? '7-14 business days' : '5-7 business days',
      price: isInternational ? 2500 : 0, // $25 or free
      estimated_days: isInternational ? '7-14' : '5-7',
      currency_code: 'USD',
    },
    {
      id: 'express',
      name: isInternational
        ? 'Express International Shipping'
        : 'Express Shipping',
      description: isInternational ? '3-5 business days' : '2-3 business days',
      price: isInternational ? 4500 : 1500, // $45 or $15
      estimated_days: isInternational ? '3-5' : '2-3',
      currency_code: 'USD',
    },
  ];

  // Free shipping threshold (mock - should come from backend)
  const freeShippingThreshold = 25000; // $250

  return {
    options,
    free_shipping_threshold: freeShippingThreshold,
    currency_code: 'USD',
  };
}

// Default tax calculation fallback (PHASE 1.4)
function getDefaultTax(
  countryCode: string,
  subtotal: number,
  settings?: StoreSettings
) {
  // Use dynamic tax rates from settings if available, otherwise use hardcoded defaults
  const defaultTaxRates: Record<string, { rate: number; name: string }> = {
    US: { rate: 0.08, name: 'Sales Tax' },
    GB: { rate: 0.2, name: 'VAT' },
    CA: { rate: 0.13, name: 'HST' },
    AU: { rate: 0.1, name: 'GST' },
    DE: { rate: 0.19, name: 'VAT' },
    FR: { rate: 0.2, name: 'VAT' },
    IN: { rate: 0.18, name: 'GST' },
    JP: { rate: 0.1, name: 'Consumption Tax' },
  };

  // Try to get rate from settings first
  let rate: number;
  let taxName: string;

  if (settings?.tax_rates) {
    const settingRate = settings.tax_rates.find(
      (tr) => tr.country_code === countryCode
    );
    if (settingRate) {
      rate = settingRate.rate;
      taxName = settingRate.name;
    } else {
      rate = settings.default_tax_rate ?? 0.1;
      taxName = countryCode === 'US' ? 'Sales Tax' : 'VAT';
    }
  } else {
    // Fall back to hardcoded defaults
    const defaultRate = defaultTaxRates[countryCode] ?? {
      rate: 0.1,
      name: countryCode === 'US' ? 'Sales Tax' : 'VAT',
    };
    rate = defaultRate.rate;
    taxName = defaultRate.name;
  }

  const taxAmount = Math.round(subtotal * rate);

  return {
    tax_amount: taxAmount,
    tax_rate: rate,
    tax_name: taxName,
    currency_code: settings?.currency_code || 'USD',
  };
}
