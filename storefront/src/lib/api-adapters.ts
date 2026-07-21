/**
 * API Response Adapters
 * 
 * Converts API response types (ApiProductResponse, etc) to frontend types
 * This layer ensures type safety and handles any data transformations
 * 
 * Usage:
 *   const apiProduct = ... // from API
 *   const frontendProduct = adaptProduct(apiProduct);
 */

import type { Product, ProductImage, ProductMediaMetadata, ProductVariant } from '@/types';
import type {
  ApiProductResponse,
  ApiVariantResponse,
  ApiPriceResponse,
  ApiCollectionResponse,
} from '@/types/api-contracts';
import { optimizeCloudinaryUrl } from './media';

type AdaptProductOptions = {
  includeRelated?: boolean;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.odhvica.com';

function normalizeMediaUrl<T extends string | null | undefined>(url: T): T {
  if (typeof url !== 'string' || url.trim() === '') return url;
  // Already absolute URL — just optimize if Cloudinary
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return optimizeCloudinaryUrl(url) as T;
  }
  // Relative URL — prepend API base URL
  if (url.startsWith('/')) {
    return `${API_BASE_URL}${url}` as T;
  }
  return url;
}

function normalizeImageMetadata(metadata: unknown): ProductMediaMetadata | null | undefined {
  if (metadata == null) return metadata as null | undefined;
  if (typeof metadata !== 'object') return undefined;
  const normalized = { ...(metadata as Record<string, unknown>) };
  if (typeof normalized.thumbnail_url === 'string') {
    normalized.thumbnail_url = normalizeMediaUrl(normalized.thumbnail_url);
  }
  if (
    typeof normalized.mime_type === 'string' &&
    /^image\/hei[cf]$/i.test(normalized.mime_type)
  ) {
    normalized.mime_type = 'image/jpeg';
  }
  return normalized as ProductMediaMetadata;
}

/**
 * Adapt single API product response to frontend Product type
 * Handles any differences between API and frontend types
 */
export function adaptProduct(apiProduct: ApiProductResponse, options: AdaptProductOptions = {}): Product {
  const includeRelated = options.includeRelated ?? true;

  return {
    id: apiProduct.id,
    title: apiProduct.title,
    description: apiProduct.description ?? '',
    handle: apiProduct.handle,
    thumbnail: normalizeMediaUrl(apiProduct.thumbnail),
    subtitle: apiProduct.subtitle,
    status: apiProduct.status,
    variants: apiProduct.variants ? adaptProductVariants(apiProduct.variants) : undefined,
    options: apiProduct.options,
    images: apiProduct.images?.map((image) => ({
      ...image,
      url: normalizeMediaUrl(image.url),
      alt: image.alt ?? image.alt_text,
      metadata: normalizeImageMetadata(image.metadata),
    })) as ProductImage[] | undefined,
    material: apiProduct.material,
    origin_country: apiProduct.origin_country,
    // size_guide can be a string or object in the API, keep as-is for frontend
    size_guide: apiProduct.size_guide as string | undefined,
    care_instructions: apiProduct.care_instructions,
    seo_title: apiProduct.seo_title,
    seo_description: apiProduct.seo_description,
    seo: apiProduct.seo as Product['seo'],
    discovery: apiProduct.discovery as Product['discovery'],
    attributes: apiProduct.attributes as Product['attributes'],
    merchant: apiProduct.merchant as Product['merchant'],
    media_seo: apiProduct.media_seo as Product['media_seo'],
    artisan: apiProduct.artisan as Product['artisan'],
    semantic_related_products:
      includeRelated && apiProduct.semantic_related_products
        ? adaptProducts(apiProduct.semantic_related_products as ApiProductResponse[], { includeRelated: false })
        : undefined,
    avg_rating: apiProduct.avg_rating,
    review_count: apiProduct.review_count,
    created_at: apiProduct.created_at,
    collection: apiProduct.collection,
    categories: apiProduct.categories
      ? apiProduct.categories.map(c => ({
          id: c.id || c.category?.id || '',
          name: c.name || c.category?.name || 'Category',
          handle:
            c.handle ||
            c.slug ||
            c.category?.handle ||
            c.category?.slug ||
            '',
          description: undefined,
        }))
      : undefined,
  };
}

/**
 * Adapt array of API products to frontend Product array
 */
export function adaptProducts(apiProducts: ApiProductResponse[], options: AdaptProductOptions = {}): Product[] {
  if (!Array.isArray(apiProducts)) {
    console.warn('[adaptProducts] Received non-array:', apiProducts);
    return [];
  }
  return apiProducts.map((product) => adaptProduct(product, options));
}

/**
 * Adapt single API variant to frontend ProductVariant type
 */
export function adaptProductVariant(apiVariant: ApiVariantResponse): ProductVariant {
  return {
    id: apiVariant.id,
    title: apiVariant.title,
    sku: apiVariant.sku,
    inventory_quantity: apiVariant.inventory_quantity,
    prices: apiVariant.prices ? adaptPrices(apiVariant.prices) : undefined,
    compare_at_price: apiVariant.compare_at_price,
    merchant: apiVariant.merchant as ProductVariant['merchant'],
  };
}

/**
 * Adapt array of API variants to frontend ProductVariant array
 */
export function adaptProductVariants(apiVariants: ApiVariantResponse[]): ProductVariant[] {
  if (!Array.isArray(apiVariants)) {
    return [];
  }
  return apiVariants.map(adaptProductVariant);
}

/**
 * Adapt API prices to MoneyAmount type
 */
export function adaptPrices(apiPrices: ApiPriceResponse[]) {
  if (!Array.isArray(apiPrices)) {
    return undefined;
  }
  return apiPrices;
}

/**
 * Adapt API collection to frontend Collection type
 */
export function adaptCollection(apiCollection: ApiCollectionResponse) {
  return {
    id: apiCollection.id,
    title: apiCollection.title,
    handle: apiCollection.handle,
    description: apiCollection.description,
    image: apiCollection.image,
    products: apiCollection.products ? adaptProducts(apiCollection.products) : undefined,
  };
}

/**
 * Adapt array of API collections
 */
export function adaptCollections(apiCollections: ApiCollectionResponse[]) {
  if (!Array.isArray(apiCollections)) {
    return [];
  }
  return apiCollections.map(adaptCollection);
}

// ==========================================
// LEGACY NORMALIZATION FUNCTIONS
// Keep for existing callers, but prefer new adapt* functions.
// ==========================================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit?: number;
  offset?: number;
}

export interface SingleResponse<T> {
  data: T;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : null;
}

// Normalize product from various API response formats
export function normalizeProduct(json: unknown): Product | null {
  const root = asRecord(json);
  if (!root) return null;

  let productObj: Record<string, unknown> | null = null;
  const data = asRecord(root.data);

  // Handle wrapped format: { data: { product: {...} } }
  if (data && asRecord(data.product)) {
    productObj = asRecord(data.product);
  } // Handle wrapped format: { data: {...} }
  else if (data) {
    productObj = data;
  } // Handle direct product object
  else if (typeof root.id === 'string' && typeof root.title === 'string') {
    productObj = root;
  }

  // Validate required fields
  if (
    productObj &&
    productObj.id &&
    productObj.title &&
    typeof productObj.id === 'string' &&
    typeof productObj.title === 'string'
  ) {
    return productObj as unknown as Product;
  }

  return null;
}

// Normalize products list from various API response formats
export function normalizeProductsList(json: unknown): {
  products: Product[];
  total: number;
  limit?: number;
  offset?: number;
} {
  // Guard against null/undefined
  if (json == null) {
    return { products: [], total: 0 };
  }

  const root = asRecord(json);

  // Handle wrapped format: { data: [...], pagination: {...} }
  if (root && Array.isArray(root.data)) {
    const pagination = asRecord(root.pagination);
    return {
      products: root.data as Product[],
      total:
        typeof pagination?.total === 'number'
          ? pagination.total
          : root.data.length,
      limit:
        typeof pagination?.limit === 'number' ? pagination.limit : undefined,
      offset:
        typeof pagination?.offset === 'number' ? pagination.offset : undefined,
    };
  }

  // Handle direct array format: [...]
  if (Array.isArray(json)) {
    return {
      products: json,
      total: json.length,
    };
  }

  // Handle wrapped format: { products: [...] }
  if (root && Array.isArray(root.products)) {
    return {
      products: root.products as Product[],
      total:
        typeof root.total === 'number' ? root.total : root.products.length,
    };
  }

  return { products: [], total: 0 };
}

// Normalize single item from various API response formats
export function normalizeSingleItem<T>(json: unknown, key?: string): T | null {
  const root = asRecord(json);
  if (!root) return null;

  // Handle wrapped format: { data: {...} }
  if (
    Object.prototype.hasOwnProperty.call(root, 'data') &&
    root.data !== undefined
  ) {
    return root.data as T;
  }

  // Handle keyed format: { products: {...} }
  if (key && Object.prototype.hasOwnProperty.call(root, key)) {
    return root[key] as T;
  }

  // Return null if neither property exists (avoid returning raw json)
  return null;
}

// Normalize array from various API response formats
export function normalizeArray<T>(json: unknown): T[] {
  if (!json) return [];

  const root = asRecord(json);

  // Handle wrapped format: { data: [...] }
  if (root && Array.isArray(root.data)) {
    return root.data as T[];
  }

  // Handle direct array format
  if (Array.isArray(json)) {
    return json;
  }

  return [];
}

// Extract featured products from API response
export function normalizeFeaturedProducts(json: unknown): Product[] {
  const root = asRecord(json);
  const data = root ? asRecord(root.data) : null;

  // Handle format: { data: { data: [...] } }
  if (data && Array.isArray(data.data)) {
    return data.data as Product[];
  }

  // Handle format: { data: [...] }
  if (root && Array.isArray(root.data)) {
    return root.data as Product[];
  }

  // Handle format: { products: [...] }
  if (root && Array.isArray(root.products)) {
    return root.products as Product[];
  }

  // Handle direct array
  if (Array.isArray(json)) {
    return json;
  }

  return [];
}

// Search result normalization
export function normalizeSearchResults(
  json: unknown
): { products: Product[]; total: number } {
  const root = asRecord(json);

  // Handle format: { data: [...] }
  if (root && Array.isArray(root.data)) {
    return {
      products: root.data as Product[],
      total: typeof root.total === 'number' ? root.total : root.data.length,
    };
  }

  // Handle direct array
  if (Array.isArray(json)) {
    return {
      products: json,
      total: json.length,
    };
  }

  return { products: [], total: 0 };
}
