// ==========================================
// FRONTEND TYPES
// ==========================================

// Re-export backend types
export * from './backend';

// Additional Frontend-Specific Types

export interface ProductOption {
  id?: string;
  title: string;
  values: { id?: string; value: string }[];
}

// Re-define Product and ProductVariant for extension
export interface Product {
  id: string;
  title: string;
  description: string;
  handle: string;
  thumbnail?: string | null;
  subtitle?: string;
  status: 'draft' | 'published' | 'archived';
  variants?: ProductVariant[];
  options?: ProductOption[];
  images?: ProductImage[];
  videos?: ProductVideo[];
  material?: string;
  origin_country?: string;
  size_guide?: SizeGuide | string; // Can be structured object or plain text
  care_instructions?: string;
  price_type?: 'fixed' | 'on_request';
  seo_title?: string;
  seo_description?: string;
  seo?: ProductSeo | null;
  discovery?: ProductDiscovery | null;
  attributes?: ProductAttributeValue[];
  merchant?: ProductMerchantValue[];
  media_seo?: ProductMediaSeo[];
  artisan?: {
    id?: string;
    name?: string;
    slug?: string;
    craft_specialty?: string | null;
    location?: string | null;
  } | null;
  semantic_related_products?: Product[];
  avg_rating?: number;
  review_count?: number;
  created_at: string;
  collection?: {
    id: string;
    title: string;
    handle?: string;
  };
  categories?: ProductCategory[];
}

export interface SizeGuide {
  type: 'clothing' | 'shoes' | 'accessories';
  measurements: SizeMeasurement[];
}

export interface SizeMeasurement {
  size: string;
  chest?: string;
  waist?: string;
  hips?: string;
  length?: string;
}

export interface ProductVideo {
  id: string;
  url: string;
  thumbnail?: string;
  position?: number;
}

export type ProductMediaType = 'image' | 'video';

export interface ProductMediaMetadata {
  media_type?: ProductMediaType;
  thumbnail_url?: string;
  mime_type?: string;
  file_size?: number;
}

export interface ProductVariant {
  id: string;
  title: string;
  sku?: string | null;
  inventory_quantity: number;
  prices?: MoneyAmount[];
  compare_at_price?: number | null;
  merchant?: ProductMerchantValue | null;
}

export interface MoneyAmount {
  id: string;
  currency_code: string;
  amount: number;
  region_id?: string | null;
}

export interface ProductWithDetails extends Product {
  variants: ProductVariant[];
  options?: ProductOption[];
  images?: ProductImage[];
  categories?: ProductCategory[];
  reviews?: Review[];
}

export interface ProductImage {
  id: string;
  url: string;
  alt?: string;
  alt_text?: string;
  position?: number;
  is_thumbnail?: boolean | null;
  metadata?: ProductMediaMetadata | null;
  media_seo?: ProductMediaSeo | null;
}

export interface ProductCategory {
  id: string;
  name: string;
  handle: string;
  description?: string;
}

export interface ProductSeo {
  product_id: string;
  seo_title?: string | null;
  meta_description?: string | null;
  canonical_url?: string | null;
  robots_index?: boolean | null;
  robots_follow?: boolean | null;
  og_title?: string | null;
  og_description?: string | null;
  og_image_url?: string | null;
  twitter_card?: string | null;
  schema_overrides?: Record<string, unknown> | null;
  localized_metadata?: Record<string, { path?: string; title?: string; description?: string }> | null;
  hreflang_group_id?: string | null;
  seo_score?: number | null;
}

export interface ProductDiscovery {
  product_id: string;
  primary_keyword?: string | null;
  secondary_keywords?: string[] | null;
  long_tail_keywords?: string[] | null;
  search_intents?: string[] | null;
  semantic_entities?: string[] | null;
  negative_keywords?: string[] | null;
  product_document?: string | null;
}

export interface ProductAttributeValue {
  id?: string;
  product_id?: string;
  attribute_id?: string;
  value_id?: string | null;
  raw_value?: string | null;
  attribute_code?: string | null;
  attribute_label?: string | null;
  value_label?: string | null;
  value_slug?: string | null;
  synonyms?: string[] | null;
}

export interface ProductMerchantValue {
  variant_id?: string;
  gtin?: string | null;
  mpn?: string | null;
  item_group_id?: string | null;
  color?: string | null;
  size?: string | null;
  size_system?: string | null;
  size_type?: string | null;
  gender?: string | null;
  age_group?: string | null;
  condition?: string | null;
  google_product_category?: string | null;
  material?: string | null;
  pattern?: string | null;
  shipping_weight?: number | null;
  feed_enabled?: boolean | null;
}

export interface ProductMediaSeo {
  image_id?: string;
  alt_text?: string | null;
  image_role?: string | null;
  view_type?: string | null;
  color?: string | null;
  seo_filename?: string | null;
}

export interface Review {
  id: string;
  rating: number;
  title: string;
  content: string;
  customer_name: string;
  created_at: string;
}

export interface Customer {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  created_at?: string;
}

export interface Address {
  id?: string;
  first_name?: string;
  last_name?: string;
  address_1?: string;
  address_2?: string;
  city?: string;
  postal_code?: string;
  country_code?: string;
  phone?: string;
}

export interface LineItem {
  id: string;
  title: string;
  quantity: number;
  unit_price: number;
  thumbnail?: string;
  variant_title?: string;
  metadata?: Record<string, unknown>;
}

export interface Order {
  id: string;
  display_id: number;
  email: string;
  total: number;
  currency_code: string;
  status:
    | 'pending'
    | 'processing'
    | 'shipped'
    | 'delivered'
    | 'cancelled'
    | 'canceled'
    | 'completed'
    | 'refunded';
  raw_status?: string;
  payment_status: 'not_paid' | 'paid' | 'awaiting' | 'captured' | 'failed' | 'refunded';
  fulfillment_status:
    | 'not_fulfilled'
    | 'processing'
    | 'partial'
    | 'fulfilled'
    | 'shipped'
    | 'returned';
  created_at: string;
  metadata?: Record<string, unknown> | null;
  workflow?: {
    status:
      | 'pending'
      | 'processing'
      | 'shipped'
      | 'delivered'
      | 'cancelled'
      | 'refunded';
    status_label: string;
    ship_by_date?: string | null;
    estimated_delivery_start?: string | null;
    estimated_delivery_end?: string | null;
    customer_note?: string | null;
    internal_note?: string | null;
    has_tracking: boolean;
    needs_attention?: boolean;
    overdue_ship_by?: boolean;
    overdue_tracking?: boolean;
    primary_package?: {
      id: string;
      sequence: number;
      ship_date?: string | null;
      carrier?: string | null;
      service?: string | null;
      label_provider?: string | null;
      tracking_number?: string | null;
      tracking_url?: string | null;
      label_url?: string | null;
      label_file_name?: string | null;
      label_state?:
        | 'draft'
        | 'created'
        | 'purchased'
        | 'printed'
        | 'voided'
        | 'refunded';
      no_tracking?: boolean;
      no_tracking_reason?: string | null;
      provider_order_id?: string | null;
      provider_shipment_id?: string | null;
      provider_courier_id?: string | null;
      pickup_reference?: string | null;
    } | null;
    packages?: Array<{
      id: string;
      sequence: number;
      ship_date?: string | null;
      carrier?: string | null;
      service?: string | null;
      label_provider?: string | null;
      tracking_number?: string | null;
      tracking_url?: string | null;
      label_url?: string | null;
      label_file_name?: string | null;
      label_state?:
        | 'draft'
        | 'created'
        | 'purchased'
        | 'printed'
        | 'voided'
        | 'refunded';
      no_tracking?: boolean;
      no_tracking_reason?: string | null;
      provider_order_id?: string | null;
      provider_shipment_id?: string | null;
      provider_courier_id?: string | null;
      pickup_reference?: string | null;
    }>;
    timeline: Array<{
      key: string;
      label: string;
      happened_at: string | null;
      description?: string;
      completed: boolean;
      current: boolean;
    }>;
  };
}

export interface OrderWithDetails extends Order {
  items: LineItem[];
  shipping_address?: Address;
  billing_address?: Address;
}

export interface Region {
  id: string;
  name: string;
  currency_code: string;
  tax_rate?: number;
  countries?: string[];
}

export interface Category {
  id: string;
  name: string;
  handle: string;
  description?: string;
  parent_id?: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  image_url: string;
  link?: string;
  button_text?: string;
  section: string;
  position: number;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  cover_image?: string;
  published_at?: string;
  author?: string;
}

export interface Page {
  id: string;
  title: string;
  slug: string;
  content?: string;
  is_visible: boolean;
}

export interface CartItem {
  variant_id: string;
  quantity: number;
  product?: Product;
  variant?: ProductVariant;
}

export interface SearchResult {
  products: Product[];
  total: number;
  suggestions?: string[];
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    total: number;
    limit: number;
    offset: number;
  };
}

// Auth Types
export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

export interface AuthResponse {
  customer: Customer;
  success?: boolean;
}

// Form Types
export interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  message: string;
}

export interface NewsletterSubscribeData {
  email: string;
}

// Checkout Types
export interface CheckoutItem {
  variant_id: string;
  quantity: number;
}

export interface ShippingAddress {
  first_name: string;
  last_name: string;
  address_1: string;
  address_2?: string;
  city: string;
  postal_code: string;
  country_code: string;
  phone?: string;
}

export interface CreateOrderData {
  items: CheckoutItem[];
  shipping_address: ShippingAddress;
  email: string;
  region_id?: string;
}
