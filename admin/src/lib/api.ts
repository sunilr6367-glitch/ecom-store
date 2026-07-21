const API_BASE_URL = '/api';

// Debug logging helper
const debugLog = (message: string, data?: unknown) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[API DEBUG] ${message}`, data || '');
  }
};

// Debug: Log cookie state before requests
const debugCookieState = async (endpoint: string) => {
  if (typeof window === 'undefined') return;

  // Log cookie presence only — never log raw cookie content to avoid token exposure
  const cookies = document.cookie;
  debugLog(`Cookie state before ${endpoint}:`, {
    hasCookies: !!cookies,
    hasAdminToken: cookies.includes('admin_token='),
  });

  // Check if we're using proxy or direct
  debugLog(`Request target: ${endpoint}`, {
    apiBaseUrl: API_BASE_URL,
    fullUrl: API_BASE_URL + endpoint
  });
};

// Type Definitions
export interface User {
  id: string;
  email: string;
  role: string;
  first_name?: string;
  last_name?: string;
  two_factor_enabled?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AuthResponse {
  user: User;
}

export interface ApiError extends Error {
  response?: {
    error?: string;
    message?: string;
    require2fa?: boolean;
  };
}

interface FetchOptions extends RequestInit {
  timeout?: number;
}

// Helper function to handle API errors with detailed messages
async function handleApiError(
  res: Response,
  defaultMessage: string
): Promise<never> {
  try {
    const errorData = await res.json();
    const details = errorData.errors || errorData.details;
    const detailMessage = Array.isArray(details)
      ? details
          .map((detail) => {
            if (typeof detail === 'string') return detail;
            const field = detail?.field || detail?.path?.join?.('.');
            const message = detail?.message || detail?.code;
            return [field, message].filter(Boolean).join(': ');
          })
          .filter(Boolean)
          .join('; ')
      : typeof details === 'string'
        ? details
        : details?.fieldErrors
          ? Object.entries(details.fieldErrors)
              .flatMap(([field, messages]) =>
                Array.isArray(messages)
                  ? messages.map((message) => `${field}: ${message}`)
                  : []
              )
              .join('; ')
        : '';

    // Try to get the most detailed error message available
    const baseMessage = errorData.message || errorData.error || defaultMessage;
    const errorMessage = detailMessage
      ? `${baseMessage}: ${detailMessage}`
      : baseMessage;
    console.error('API Error:', errorData);
    throw new Error(errorMessage);
  } catch (e) {
    if (e instanceof Error && e.message !== defaultMessage) {
      throw e;
    }
    throw new Error(defaultMessage);
  }
}

// Wrapper for fetch with 60s timeout (increased for Supabase)
async function fetchWithTimeout(
  resource: RequestInfo,
  options: FetchOptions = {}
) {
  const { timeout = 60000, ...fetchOptions } = options; // Increased to 60s

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    debugLog('Fetch request:', {
      url: typeof resource === 'string' ? resource : resource.url,
      method: fetchOptions.method || 'GET',
      hasCredentials: true,
      credentials: fetchOptions.credentials || 'include'
    });

    const response = await fetch(resource, {
      ...fetchOptions,
      credentials: 'include', // Important: send cookies with request
      signal: controller.signal,
    });
    clearTimeout(id);

    debugLog('Fetch response:', {
      url: typeof resource === 'string' ? resource : resource.url,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    return response;
  } catch (error: unknown) {
    clearTimeout(id);
    debugLog('Fetch error:', { error, url: typeof resource === 'string' ? resource : resource.url });
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error(
          'Request timed out. Please check your internet connection or try again.'
        );
      }
      // Provide more helpful error message
      if (error.message === 'Failed to fetch') {
        throw new Error(
          'Cannot connect to server. Please ensure the backend is running on port 4000.'
        );
      }
      throw error;
    }
    throw new Error('An unexpected error occurred');
  }
}

export const api = {
  // Auth endpoints
  login: async (
    email: string,
    password: string,
    twoFactorCode?: string
  ): Promise<AuthResponse> => {
    try {
      debugLog(`Attempting login for ${email} to ${API_BASE_URL}/auth/login`);

      const res = await fetchWithTimeout(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, twoFactorCode }),
      });

      debugLog('Response status:', res.status);

      if (!res.ok) {
        let data: Record<string, unknown> = {};
        let errorText = '';
        try {
          errorText = await res.text();
          debugLog('Raw error response:', errorText);
          data = JSON.parse(errorText);
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError, errorText);
          data = {
            message: errorText || `HTTP ${res.status}: ${res.statusText}`,
          };
        }
        const errorMessage =
          (typeof data.error === 'string' ? data.error : undefined) ||
          (typeof data.message === 'string' ? data.message : undefined) ||
          `Login failed (${res.status})`;
        const error = new Error(errorMessage) as ApiError;
        error.response = data;
        throw error;
      }
      const responseText = await res.text();
      debugLog('Raw success response received');
      let response;
      try {
        response = JSON.parse(responseText);
      } catch (e) {
        debugLog('Failed to parse success response', e);
        throw new Error('Invalid response from server');
      }
      debugLog('Login API response structure:', response);

      // Check if response has the expected structure
      if (!response.data?.user) {
        debugLog('Invalid response structure:', response);
        throw new Error('Invalid response structure from server');
      }

      // Token is now in httpOnly cookie, only user data returned
      debugLog('Login successful - checking cookie state');

      // Debug: Check cookies after login
      if (typeof window !== 'undefined') {
        const cookies = document.cookie;
        debugLog('Cookies after login:', {
          cookieString: cookies,
          hasAdminToken: cookies.includes('admin_token=')
        });
      }

      return response.data as AuthResponse;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  register: async (
    email: string,
    password: string,
    first_name?: string,
    last_name?: string
  ) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, first_name, last_name }),
    });
    if (!res.ok) throw new Error('Registration failed');
    return res.json();
  },

  logout: async () => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Logout failed');
    return res.json();
  },

  // Product endpoints
  getProducts: async (limit = 20, offset = 0, search = '', status = '', categoryId = '', collectionId = '') => {
    let url = `${API_BASE_URL}/products?limit=${limit}&offset=${offset}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (status && status !== 'all') url += `&status=${status}`;
    if (categoryId && categoryId !== 'all') url += `&category_id=${categoryId}`;
    if (collectionId && collectionId !== 'all') url += `&collection_id=${collectionId}`;

    const res = await fetchWithTimeout(url, {
      // No Authorization header needed - cookie is sent automatically
    });
    if (!res.ok) return handleApiError(res, 'Failed to fetch products');
    const response = await res.json();
    return response; // Return full response including pagination
  },

  getProductStats: async () => {
    await debugCookieState('/products/stats/overview');
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/products/stats/overview`,
      {
        // No Authorization header needed - cookie is sent automatically
      }
    );
    debugLog('getProductStats response:', { status: res.status, ok: res.ok });
    if (!res.ok) return handleApiError(res, 'Failed to fetch product stats');
    const response = await res.json();
    return response.data;
  },

  getProduct: async (id: string) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/products/${id}`, {
      // No Authorization header needed - cookie is sent automatically
    });
    if (!res.ok) return handleApiError(res, 'Failed to fetch product');
    const response = await res.json();
    return response.data;
  },

  createProduct: async (data: unknown) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) return handleApiError(res, 'Failed to create product');
    const response = await res.json();
    return response.data;
  },

  updateProduct: async (id: string, data: unknown) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) return handleApiError(res, 'Failed to update product');
    const response = await res.json();
    return response.data;
  },

  updateProductSeo: async (id: string, data: unknown) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/products/${id}/seo`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) return handleApiError(res, 'Failed to update product SEO');
    const response = await res.json();
    return response.data;
  },

  deleteProduct: async (id: string) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/products/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) return handleApiError(res, 'Failed to delete product');
    const response = await res.json();
    return response.data;
  },
  
  duplicateProduct: async (id: string) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/products/${id}/duplicate`, {
      method: 'POST',
    });
    if (!res.ok) return handleApiError(res, 'Failed to duplicate product');
    const response = await res.json();
    return response.data;
  },

  bulkProductsAction: async (action: 'status' | 'delete', productIds: string[], status?: string) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/products/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, productIds, status }),
    });
    if (!res.ok) return handleApiError(res, `Failed to bulk ${action} products`);
    const response = await res.json();
    return response.data;
  },
  getCustomers: async (page = 1, search = '', filter = 'all') => {
    let url = `${API_BASE_URL}/customers?page=${page}&limit=20`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (filter === 'registered') url += `&has_account=true`;
    if (filter === 'guest') url += `&has_account=false`;

    const res = await fetchWithTimeout(url, {
      // No Authorization header needed - cookie is sent automatically
    });
    if (!res.ok) throw new Error('Failed to fetch customers');
    const response = await res.json();
    return {
      customers: response.data || [],
      pagination: response.pagination,
    };
  },

  getCustomer: async (id: string) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/customers/${id}`, {
      // No Authorization header needed - cookie is sent automatically
    });
    if (!res.ok) throw new Error('Failed to fetch customer');
    const response = await res.json();
    return response.data;
  },

  updateCustomer: async (id: string, data: unknown) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/customers/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) return handleApiError(res, 'Failed to update customer');
    const response = await res.json();
    return response.data;
  },

  deleteCustomer: async (id: string) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/customers/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) return handleApiError(res, 'Failed to delete customer');
    const response = await res.json();
    return response.data;
  },

  getCustomerStats: async () => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/customers/stats/overview`,
      {
        // No Authorization header needed - cookie is sent automatically
      }
    );
    if (!res.ok) throw new Error('Failed to fetch customer stats');
    const response = await res.json();
    return response.data;
  },

  downloadInvoice: async (orderId: string) => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/orders/${orderId}/invoice`,
      {
        // No Authorization header needed - cookie is sent automatically
      }
    );
    if (!res.ok) return handleApiError(res, 'Failed to download invoice');
    return res.blob();
  },

  // Region endpoints
  getRegions: async () => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/regions`, {
      // No Authorization header needed - cookie is sent automatically
    });
    if (!res.ok) return handleApiError(res, 'Failed to fetch regions');
    return res.json();
  },

  createRegion: async (data: unknown) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/regions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) return handleApiError(res, 'Failed to create region');
    return res.json();
  },

  deleteRegion: async (id: string) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/regions/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) return handleApiError(res, 'Failed to delete region');
    return res.json();
  },

  updateRegion: async (id: string, data: unknown) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/regions/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) return handleApiError(res, 'Failed to update region');
    return res.json();
  },

  // Variant endpoints
  getVariants: async (productId: string) => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/products/${productId}/variants`,
      {}
    );
    if (!res.ok) throw new Error('Failed to fetch variants');
    const response = await res.json();
    return response.data;
  },

  createVariant: async (productId: string, data: unknown) => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/products/${productId}/variants`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }
    );
    if (!res.ok) return handleApiError(res, 'Failed to create variant');
    return res.json();
  },

  updateVariant: async (
    productId: string,
    variantId: string,
    data: unknown
  ) => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/products/${productId}/variants/${variantId}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }
    );
    if (!res.ok) return handleApiError(res, 'Failed to update variant');
    return res.json();
  },

  createOption: async (productId: string, data: unknown) => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/products/${productId}/options`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );
    if (!res.ok) return handleApiError(res, 'Failed to create option');
    return res.json();
  },

  deleteVariant: async (productId: string, variantId: string) => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/products/${productId}/variants/${variantId}`,
      { method: 'DELETE' }
    );
    if (!res.ok) return handleApiError(res, 'Failed to delete variant');
    return res.json();
  },
  getOrders: async (
    limit = 20,
    offset = 0,
    search?: string,
    status?: string,
    queue?: 'all' | 'open' | 'completed' | 'issues',
    workflowFilter?:
      | 'all'
      | 'new'
      | 'processing'
      | 'due_today'
      | 'ready_to_ship'
      | 'missing_tracking',
    sortBy?: 'newest' | 'oldest' | 'ship_by' | 'destination'
  ) => {
    const page = Math.floor(offset / limit) + 1;
    let url = `${API_BASE_URL}/orders?limit=${limit}&page=${page}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (status && status !== 'all') url += `&status=${status}`;
    if (queue && queue !== 'all') url += `&queue=${queue}`;
    if (workflowFilter && workflowFilter !== 'all') {
      url += `&workflow_filter=${workflowFilter}`;
    }
    if (sortBy) url += `&sort_by=${sortBy}`;

    const res = await fetchWithTimeout(url, {
      // No Authorization header needed - cookie is sent automatically
    });
    if (!res.ok) return handleApiError(res, 'Failed to fetch orders');
    const response = await res.json();
    return {
      orders: response.data || [],
      pagination: response.pagination,
    };
  },
  getOrder: async (id: string) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/orders/${id}`, {
      // No Authorization header needed - cookie is sent automatically
    });
    if (!res.ok) return handleApiError(res, 'Failed to fetch order details');
    const response = await res.json();
    return response.data;
  },

  completeOrder: async (
    id: string,
    data: {
      ship_date?: string | null;
      shipping_carrier?: string | null;
      shipping_service?: string | null;
      tracking_number?: string | null;
      tracking_link?: string | null;
      no_tracking?: boolean;
      no_tracking_reason?: string | null;
      customer_note?: string | null;
      internal_note?: string | null;
      notify_buyer?: boolean;
      send_admin_copy?: boolean;
    }
  ) => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/orders/${id}/complete-order`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );
    if (!res.ok) return handleApiError(res, 'Failed to complete order');
    return res.json();
  },

  updateOrderStatus: async (id: string, status: string) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/orders/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) return handleApiError(res, 'Failed to update status');
    return res.json();
  },

  getOrderStats: async () => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/orders/stats/overview`,
      {
        // No Authorization header needed - cookie is sent automatically
      }
    );
    if (!res.ok) return handleApiError(res, 'Failed to fetch order stats');
    const response = await res.json();
    return response.data;
  },
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetchWithTimeout(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) return handleApiError(res, 'Failed to upload image');
    return res.json();
  },

  uploadMedia: async (
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<{
    url: string;
    publicId?: string;
    filename: string;
    originalName: string;
    size: number;
    type: string;
  }> => {
    const formData = new FormData();
    formData.append('file', file);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE_URL}/upload`);
      xhr.withCredentials = true;

      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable || !onProgress) return;
        onProgress(Math.round((event.loaded / event.total) * 100));
      };

      xhr.onload = () => {
        try {
          const json = JSON.parse(xhr.responseText || '{}');
          if (xhr.status >= 200 && xhr.status < 300) {
            onProgress?.(100);
            resolve(json);
            return;
          }

          reject(new Error(json.error || json.message || 'Failed to upload file'));
        } catch {
          reject(new Error('Failed to upload file'));
        }
      };

      xhr.onerror = () => reject(new Error('Failed to upload file'));
      xhr.ontimeout = () => reject(new Error('Upload timed out'));
      xhr.timeout = 120000;
      xhr.send(formData);
    });
  },

  // Settings endpoints
  getSettings: async () => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/settings`, {
      // No Authorization header needed - cookie is sent automatically
    });
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  // Get footer settings for wholesale page
  getFooterSettings: async () => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/settings/footer`, {
      // No Authorization header needed - cookie is sent automatically
    });
    if (!res.ok) throw new Error('Failed to fetch footer settings');
    return res.json();
  },

  // Get wholesale tiers for public page
  getWholesaleTiersPublic: async () => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/settings/wholesale-tiers`, {
      // Public endpoint - no auth required
    });
    if (!res.ok) throw new Error('Failed to fetch wholesale tiers');
    return res.json();
  },

  updateSetting: async (key: string, value: unknown, category?: string) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/settings/${key}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ value, category }),
    });
    if (!res.ok) return handleApiError(res, `Failed to update setting ${key}`);
    return res.json();
  },

  updateSettingsBulk: async (settings: unknown) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/settings/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ settings }),
    });
    if (!res.ok) return handleApiError(res, 'Failed to update settings');
    return res.json();
  },

  // Coupon endpoints
  getDiscounts: async () => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/marketing/discounts`, {
      // No Authorization header needed - cookie is sent automatically
    });
    if (!res.ok) return handleApiError(res, 'Failed to fetch discounts');
    return res.json();
  },

  createDiscount: async (data: unknown) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/marketing/discounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) return handleApiError(res, 'Failed to create discount');
    return res.json();
  },

  updateDiscount: async (id: string, data: unknown) => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/marketing/discounts/${id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );
    if (!res.ok) return handleApiError(res, 'Failed to update discount');
    return res.json();
  },

  deleteDiscount: async (id: string) => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/marketing/discounts/${id}`,
      {
        method: 'DELETE',
      }
    );
    if (!res.ok) return handleApiError(res, 'Failed to delete discount');
    return res.json();
  },

  // Returns & Refunds
  getReturns: async (status?: string) => {
    let url = `${API_BASE_URL}/admin/returns`;
    if (status) url += `?status=${status}`;
    const res = await fetchWithTimeout(url, {});
    if (!res.ok) throw new Error('Failed to fetch returns');
    return res.json();
  },
  getReviews: async (limit = 50, offset = 0, status?: string) => {
    let url = `${API_BASE_URL}/reviews?limit=${limit}&offset=${offset}`;
    if (status) url += `&status=${status}`;
    const res = await fetchWithTimeout(url, {});
    if (!res.ok) throw new Error('Failed to fetch reviews');
    return res.json();
  },

  updateReviewStatus: async (id: string, status: string) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/reviews/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) return handleApiError(res, 'Failed to update review status');
    return res.json();
  },

  deleteReview: async (id: string) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/reviews/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) return handleApiError(res, 'Failed to delete review');
    return res.json();
  },

  // Generic POST helper for admin
  post: async (path: string, data?: unknown) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data || {}),
    });
    if (!res.ok) return handleApiError(res, `POST ${path} failed`);
    return res.json();
  },
  delete: async (path: string) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}${path}`, {
      method: 'DELETE',
    });
    if (!res.ok) return handleApiError(res, `DELETE ${path} failed`);
    return res.json();
  },

  get: async (path: string) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}${path}`, {});
    if (!res.ok) return handleApiError(res, `GET ${path} failed`);
    return res.json();
  },

  getMe: async () => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/auth/me`, {
      // No Authorization header needed - cookie is sent automatically
    });
    if (!res.ok) throw new Error('Failed to fetch profile');
    const response = await res.json();
    return response.data;
  },

  // 2FA Endpoints
  generate2FA: async () => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/auth/2fa/generate`, {
      method: 'POST',
      // No Authorization header needed - cookie is sent automatically
    });
    if (!res.ok) throw new Error('Failed to generate 2FA');
    return res.json();
  },

  verify2FA: async (otp: string) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/auth/2fa/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: otp }),
    });
    if (!res.ok) throw new Error('Failed to verify OTP');
    return res.json();
  },

  disable2FA: async (otp: string) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/auth/2fa/disable`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: otp }),
    });
    if (!res.ok) throw new Error('Failed to disable 2FA');
    return res.json();
  },

  // Wholesale endpoints
  getWholesaleInquiries: async (
    status?: string,
    search?: string,
    page = 1,
    limit = 20
  ) => {
    let url = `${API_BASE_URL}/wholesale?page=${page}&limit=${limit}`;
    if (status && status !== 'all') url += `&status=${status}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;

    const res = await fetchWithTimeout(url, {
      // No Authorization header needed - cookie is sent automatically
    });
    if (!res.ok)
      return handleApiError(res, 'Failed to fetch wholesale inquiries');
    return res.json();
  },

  getWholesaleInquiry: async (id: string) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/wholesale/${id}`, {
      // No Authorization header needed - cookie is sent automatically
    });
    if (!res.ok)
      return handleApiError(res, 'Failed to fetch wholesale inquiry');
    return res.json();
  },

  updateWholesaleInquiry: async (id: string, data: unknown) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/wholesale/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok)
      return handleApiError(res, 'Failed to update wholesale inquiry');
    return res.json();
  },

  deleteWholesaleInquiry: async (id: string) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/wholesale/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok)
      return handleApiError(res, 'Failed to delete wholesale inquiry');
    return res.json();
  },

  getWholesaleStats: async () => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/wholesale/stats/overview`,
      {
        // No Authorization header needed - cookie is sent automatically
      }
    );
    if (!res.ok) return handleApiError(res, 'Failed to fetch wholesale stats');
    return res.json();
  },

  // Wholesale Customers endpoints
  getWholesaleCustomers: async (
    search?: string,
    tier?: string,
    page = 1,
    limit = 20
  ) => {
    let url = `${API_BASE_URL}/wholesale-customers?page=${page}&limit=${limit}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (tier && tier !== 'all') url += `&tier=${tier}`;

    const res = await fetchWithTimeout(url, {
      // No Authorization header needed - cookie is sent automatically
    });
    if (!res.ok)
      return handleApiError(res, 'Failed to fetch wholesale customers');
    return res.json();
  },

  getWholesaleCustomerStats: async () => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/wholesale-customers/stats`,
      {
        // No Authorization header needed - cookie is sent automatically
      }
    );
    if (!res.ok)
      return handleApiError(res, 'Failed to fetch wholesale customer stats');
    return res.json();
  },

  updateWholesaleCustomerTier: async (id: string, discount_tier: string) => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/wholesale-customers/${id}/tier`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ discount_tier }),
      }
    );
    if (!res.ok) return handleApiError(res, 'Failed to update customer tier');
    return res.json();
  },

  // Wholesale Orders endpoints
  getWholesaleOrders: async (status?: string, page = 1, limit = 20) => {
    let url = `${API_BASE_URL}/admin/wholesale/orders?page=${page}&limit=${limit}`;
    if (status && status !== 'all') url += `&status=${status}`;

    const res = await fetchWithTimeout(url, {
      // No Authorization header needed - cookie is sent automatically
    });
    if (!res.ok) return handleApiError(res, 'Failed to fetch wholesale orders');
    return res.json();
  },

  getWholesaleOrderStats: async () => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/admin/wholesale/orders/stats`,
      {
        // No Authorization header needed - cookie is sent automatically
      }
    );
    if (!res.ok)
      return handleApiError(res, 'Failed to fetch wholesale order stats');
    return res.json();
  },

  getWholesaleOrder: async (id: string) => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/admin/wholesale/orders/${id}`,
      {
        // No Authorization header needed - cookie is sent automatically
      }
    );
    if (!res.ok) return handleApiError(res, 'Failed to fetch wholesale order');
    return res.json();
  },

  updateWholesaleOrder: async (id: string, data: unknown) => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/admin/wholesale/orders/${id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );
    if (!res.ok) return handleApiError(res, 'Failed to update wholesale order');
    return res.json();
  },

  // Tier Management endpoints
  getWholesaleTiers: async (active?: boolean) => {
    let url = `${API_BASE_URL}/admin/tiers`;
    if (active !== undefined) url += `?active=${active}`;

    const res = await fetchWithTimeout(url, {
      // No Authorization header needed - cookie is sent automatically
    });
    if (!res.ok) return handleApiError(res, 'Failed to fetch wholesale tiers');
    return res.json();
  },

  getWholesaleTier: async (id: string) => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/admin/tiers/${id}`,
      {
        // No Authorization header needed - cookie is sent automatically
      }
    );
    if (!res.ok) return handleApiError(res, 'Failed to fetch wholesale tier');
    return res.json();
  },

  createWholesaleTier: async (data: unknown) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/admin/tiers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) return handleApiError(res, 'Failed to create wholesale tier');
    return res.json();
  },

  updateWholesaleTier: async (id: string, data: unknown) => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/admin/tiers/${id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );
    if (!res.ok) return handleApiError(res, 'Failed to update wholesale tier');
    return res.json();
  },

  deleteWholesaleTier: async (id: string) => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/admin/tiers/${id}`,
      {
        method: 'DELETE',
      }
    );
    if (!res.ok) return handleApiError(res, 'Failed to delete wholesale tier');
    return res.json();
  },

  getWholesaleTierStats: async () => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/admin/tiers/stats/overview`,
      {
        // No Authorization header needed - cookie is sent automatically
      }
    );
    if (!res.ok)
      return handleApiError(res, 'Failed to fetch wholesale tier stats');
    return res.json();
  },

  getTrendingReels: async () => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/admin/trending-reels`, {});
    if (!res.ok) return handleApiError(res, 'Failed to fetch trending reels');
    return res.json();
  },

  createTrendingReel: async (formData: FormData) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/admin/trending-reels`, {
      method: 'POST',
      body: formData,
      timeout: 300000, // 5 minutes — Cloudinary video upload can be slow
    });
    if (!res.ok) return handleApiError(res, 'Failed to create trending reel');
    return res.json();
  },

  updateTrendingReel: async (id: string, formData: FormData) => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/admin/trending-reels/${id}`,
      {
        method: 'PUT',
        body: formData,
        timeout: 300000, // 5 minutes — Cloudinary video upload can be slow
      }
    );
    if (!res.ok) return handleApiError(res, 'Failed to update trending reel');
    return res.json();
  },

  deleteTrendingReel: async (id: string) => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/admin/trending-reels/${id}`,
      {
        method: 'DELETE',
      }
    );
    if (!res.ok) return handleApiError(res, 'Failed to delete trending reel');
    return res.json();
  },

  toggleTrendingReel: async (id: string) => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/admin/trending-reels/${id}/toggle`,
      {
        method: 'PATCH',
      }
    );
    if (!res.ok) return handleApiError(res, 'Failed to toggle trending reel');
    return res.json();
  },

  // Reel Collections
  getReelCollections: async () => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/admin/reel-collections`, {});
    if (!res.ok) return handleApiError(res, 'Failed to fetch reel collections');
    return res.json();
  },

  createReelCollection: async (formData: FormData) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/admin/reel-collections`, {
      method: 'POST',
      body: formData,
      timeout: 180000,
    });
    if (!res.ok) return handleApiError(res, 'Failed to create reel collection');
    return res.json();
  },

  updateReelCollection: async (id: string, formData: FormData) => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/admin/reel-collections/${id}`,
      {
        method: 'PUT',
        body: formData,
        timeout: 180000,
      }
    );
    if (!res.ok) return handleApiError(res, 'Failed to update reel collection');
    return res.json();
  },

  deleteReelCollection: async (id: string) => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/admin/reel-collections/${id}`,
      {
        method: 'DELETE',
      }
    );
    if (!res.ok) return handleApiError(res, 'Failed to delete reel collection');
    return res.json();
  },

  toggleReelCollection: async (id: string) => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/admin/reel-collections/${id}/toggle`,
      {
        method: 'PATCH',
      }
    );
    if (!res.ok) return handleApiError(res, 'Failed to toggle reel collection');
    return res.json();
  },

  // Category Circles
  getCategoryCircles: async () => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/admin/category-circles`, {});
    if (!res.ok) return handleApiError(res, 'Failed to fetch category circles');
    return res.json();
  },

  createCategoryCircle: async (formData: FormData) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/admin/category-circles`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) return handleApiError(res, 'Failed to create category circle');
    return res.json();
  },

  updateCategoryCircle: async (id: string, formData: FormData) => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/admin/category-circles/${id}`,
      {
        method: 'PUT',
        body: formData,
      }
    );
    if (!res.ok) return handleApiError(res, 'Failed to update category circle');
    return res.json();
  },

  deleteCategoryCircle: async (id: string) => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/admin/category-circles/${id}`,
      {
        method: 'DELETE',
      }
    );
    if (!res.ok) return handleApiError(res, 'Failed to delete category circle');
    return res.json();
  },

  toggleCategoryCircle: async (id: string) => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/admin/category-circles/${id}/toggle`,
      {
        method: 'PATCH',
      }
    );
    if (!res.ok) return handleApiError(res, 'Failed to toggle category circle');
    return res.json();
  },

  getHomepageSocialPosts: async () => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/admin/homepage-social-posts`, {});
    if (!res.ok) return handleApiError(res, 'Failed to fetch homepage social posts');
    return res.json();
  },

  createHomepageSocialPost: async (formData: FormData) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/admin/homepage-social-posts`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) return handleApiError(res, 'Failed to create homepage social post');
    return res.json();
  },

  updateHomepageSocialPost: async (id: string, formData: FormData) => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/admin/homepage-social-posts/${id}`,
      { method: 'PUT', body: formData }
    );
    if (!res.ok) return handleApiError(res, 'Failed to update homepage social post');
    return res.json();
  },

  toggleHomepageSocialPost: async (id: string) => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/admin/homepage-social-posts/${id}/toggle`,
      { method: 'PATCH' }
    );
    if (!res.ok) return handleApiError(res, 'Failed to toggle homepage social post');
    return res.json();
  },

  deleteHomepageSocialPost: async (id: string) => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/admin/homepage-social-posts/${id}`,
      { method: 'DELETE' }
    );
    if (!res.ok) return handleApiError(res, 'Failed to delete homepage social post');
    return res.json();
  },

  // Product search used by category and collection assignment pickers.
  searchFeaturedProductCandidates: async (query: string) => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/admin/featured-products/product-search?q=${encodeURIComponent(query)}`,
      {}
    );
    if (!res.ok) throw new Error('Failed to search products');
    return res.json();
  },

  getPages: async () => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/pages`, {});
    if (!res.ok) return handleApiError(res, 'Failed to fetch pages');
    return res.json();
  },

  updatePage: async (id: string, data: unknown) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/pages/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) return handleApiError(res, 'Failed to update page');
    return res.json();
  },

  // Categories
  getCategories: async () => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/categories`, {
      // No Authorization header needed - cookie is sent automatically
    });
    if (!res.ok) return handleApiError(res, 'Failed to fetch categories');
    return res.json();
  },

  getCategoriesTree: async () => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/categories/tree`, {
      // No Authorization header needed - cookie is sent automatically
    });
    if (!res.ok) return handleApiError(res, 'Failed to fetch category tree');
    return res.json();
  },

  getCategory: async (id: string) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/categories/${id}`, {
      // No Authorization header needed - cookie is sent automatically
    });
    if (!res.ok) throw new Error('Failed to fetch category');
    return res.json();
  },

  getCategoryProducts: async (id: string) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/categories/${id}/products`, {});
    if (!res.ok) throw new Error('Failed to fetch category products');
    return res.json();
  },

  updateCategoryProducts: async (id: string, productIds: string[]) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/categories/${id}/products`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ product_ids: productIds }),
    });
    if (!res.ok) return handleApiError(res, 'Failed to update category products');
    return res.json();
  },

  createCategory: async (data: unknown) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) return handleApiError(res, 'Failed to create category');
    return res.json();
  },

  updateCategory: async (id: string, data: unknown) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/categories/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) return handleApiError(res, 'Failed to update category');
    return res.json();
  },

  deleteCategory: async (id: string) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/categories/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) return handleApiError(res, 'Failed to delete category');
    return res.json();
  },

  // Collections
  getCollections: async () => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/collections?status=all`, {
      // No Authorization header needed - cookie is sent automatically
    });
    if (!res.ok) return handleApiError(res, 'Failed to fetch collections');
    return res.json();
  },

  getCollection: async (id: string) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/collections/${id}`, {
      // No Authorization header needed - cookie is sent automatically
    });
    if (!res.ok) throw new Error('Failed to fetch collection');
    return res.json();
  },

  getCollectionProducts: async (id: string) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/collections/${id}/products`, {});
    if (!res.ok) throw new Error('Failed to fetch collection products');
    return res.json();
  },

  updateCollectionProducts: async (id: string, productIds: string[]) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/collections/${id}/products`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ product_ids: productIds }),
    });
    if (!res.ok) return handleApiError(res, 'Failed to update collection products');
    return res.json();
  },

  createCollection: async (data: unknown) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/collections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) return handleApiError(res, 'Failed to create collection');
    return res.json();
  },

  updateCollection: async (id: string, data: unknown) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/collections/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) return handleApiError(res, 'Failed to update collection');
    return res.json();
  },

  deleteCollection: async (id: string) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/collections/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) return handleApiError(res, 'Failed to delete collection');
    return res.json();
  },

  // Tags
  getTags: async () => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/tags`, {
      // No Authorization header needed - cookie is sent automatically
    });
    if (!res.ok) throw new Error('Failed to fetch tags');
    return res.json();
  },

  createTag: async (data: unknown) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/tags`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) return handleApiError(res, 'Failed to create tag');
    return res.json();
  },

  deleteTag: async (id: string) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/tags/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) return handleApiError(res, 'Failed to delete tag');
    return res.json();
  },

  // Category Order Management
  updateCategoriesOrder: async (updates: Array<{ id: string; display_order: number; show_in_header?: boolean }>) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/categories/reorder`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ updates }),
    });
    if (!res.ok) return handleApiError(res, 'Failed to update category order');
    return res.json();
  },

  getAnalyticsOverview: async () => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/analytics/overview`, {
      // No Authorization header needed - cookie is sent automatically
    });
    if (!res.ok) throw new Error('Failed to fetch analytics overview');
    return res.json();
  },

  getSalesTrend: async (days = 30) => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/analytics/sales-trend?days=${days}`,
      {
        // No Authorization header needed - cookie is sent automatically
      }
    );
    if (!res.ok) throw new Error('Failed to fetch sales trend');
    return res.json();
  },

  getOrdersByStatus: async () => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/analytics/orders-by-status`,
      {
        // No Authorization header needed - cookie is sent automatically
      }
    );
    if (!res.ok) throw new Error('Failed to fetch orders by status');
    return res.json();
  },

  getTiers: async () => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/admin/tiers`,
      {}
    );
    if (!res.ok) throw new Error('Failed to fetch tiers');
    return res.json();
  },

  createTier: async (data: unknown) => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/admin/tiers`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }
    );
    if (!res.ok) return handleApiError(res, 'Failed to create tier');
    return res.json();
  },

  updateTier: async (id: string, data: unknown) => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/admin/tiers/${id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }
    );
    if (!res.ok) return handleApiError(res, 'Failed to update tier');
    return res.json();
  },

  deleteTier: async (id: string) => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/admin/tiers/${id}`,
      { method: 'DELETE' }
    );
    if (!res.ok) return handleApiError(res, 'Failed to delete tier');
    return res.json();
  },

};
