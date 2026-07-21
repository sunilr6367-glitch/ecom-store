/**
 * Product Validator Schemas
 * Zod schemas for product input validation
 */

import { z } from 'zod';

// --- Price Schema ---
export const PriceSchema = z.object({
  region_id: z.string().uuid().nullable().optional(),
  amount: z.number().int().min(0), // stored in cents
  currency_code: z.string().length(3),
});

// Accepts absolute URLs (https://...) or relative paths (/uploads/...)
const urlOrPath = z.string().refine(
  (v) => {
    try { new URL(v); return true; } catch { return v.startsWith('/'); }
  },
  { message: 'Must be a valid URL or a path starting with /' }
);
const optionalUrlOrPath = urlOrPath
  .optional()
  .or(z.literal(''))
  .transform((v) => (v === '' ? undefined : v));

// --- Image Schema ---
export const ImageSchema = z.object({
  url: urlOrPath,
  alt_text: z.string().optional(),
  is_thumbnail: z.boolean().default(false),
  position: z.number().int().default(0),
  metadata: z
    .object({
      media_type: z.enum(['image', 'video']).default('image'),
      thumbnail_url: optionalUrlOrPath,
      mime_type: z.string().optional(),
      file_size: z.number().int().optional(),
    })
    .optional(),
});

// --- Create Product Schema ---
export const CreateProductSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  handle: z.string().min(1),
  status: z
    .enum(['draft', 'published', 'proposed', 'rejected'])
    .default('draft'),
  is_giftcard: z.boolean().default(false),
  discountable: z.boolean().default(true),
  weight: z.number().int().optional(),
  length: z.number().int().optional(),
  height: z.number().int().optional(),
  width: z.number().int().optional(),
  hs_code: z.string().optional(),
  origin_country: z.string().optional(),
  mid_code: z.string().optional(),
  material: z.string().optional(),
  size_guide: z.string().optional(),
  care_instructions: z.string().optional(),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  inventory_quantity: z.number().int().optional().default(0),
  thumbnail: optionalUrlOrPath,
  sku: z.string().optional(),
  collection_id: z.string().uuid().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  options: z
    .array(
      z.object({
        title: z.string(),
      })
    )
    .optional(),
  prices: z.array(PriceSchema).optional(),
  images: z.array(ImageSchema).optional(),
  category_ids: z.array(z.string().uuid()).optional(),
  tag_ids: z.array(z.string().uuid()).optional(),
  // guide Section 4.3: fixed = price required, on_request = no price
  price_type: z.enum(['fixed', 'on_request']).default('fixed'),
});

// --- Update Product Schema ---
export const UpdateProductSchema = CreateProductSchema.partial();

// --- Filter Options Schema ---
export const ProductFilterSchema = z.object({
  limit: z.number().int().min(1).max(100).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
  status: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  tagId: z.string().uuid().optional(),
  collectionId: z.string().uuid().optional(),
  attributeCode: z.string().optional(),
  attributeValue: z.string().optional(),
  sort: z.string().optional().default('created_at'),
});

// --- Search Options Schema ---
export const ProductSearchSchema = z.object({
  query: z.string().optional().default(''),
  minPrice: z.number().int().min(0).optional(),
  maxPrice: z.number().int().min(0).optional(),
  status: z.string().optional(),
  sortBy: z
    .enum(['relevance', 'price_asc', 'price_desc', 'newest'])
    .optional()
    .default('relevance'),
  categoryId: z.string().uuid().optional(),
  tagId: z.string().uuid().optional(),
  collectionId: z.string().uuid().optional(),
  attributeCode: z.string().optional(),
  attributeValue: z.string().optional(),
});

// --- Type Exports ---
export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
export type ProductFilter = z.infer<typeof ProductFilterSchema>;
export type ProductSearch = z.infer<typeof ProductSearchSchema>;
