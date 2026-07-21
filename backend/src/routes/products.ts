import { Hono, type Context } from 'hono';
import { getCookie } from 'hono/cookie';
import { verify } from 'hono/jwt';
import { createHash } from 'crypto';
import {
  productService,
  CreateProductSchema,
  UpdateProductSchema,
} from '../services/product-service';
import { verifyAdminOrMcpService } from '../middleware/auth';
import { z } from 'zod';
import {
  successResponse,
  paginatedResponse,
  HttpStatus,
} from '../utils/api-response';
import {
  asyncHandler,
  NotFoundError,
  ValidationError,
} from '../middleware/error-handler';
import { triggerStorefrontRevalidation } from '../utils/storefront-revalidate';
import { config } from '../config';
import { db } from '../db/client';
import {
  product_options,
  product_option_values,
  product_variants,
  products,
  product_images,
  product_categories,
  money_amounts,
  product_seo,
  product_discovery,
  product_attributes,
  attribute_values,
  product_attribute_values,
  product_variant_merchant,
  product_media_seo,
  product_embeddings,
} from '../db/schema';
import { eq, inArray } from 'drizzle-orm';

const productsRouter = new Hono();

const jsonArray = z.array(z.string()).default([]);

async function isVerifiedAdminRequest(c: Context) {
  const authHeader = c.req.header('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : null;
  const token = bearerToken || getCookie(c, 'admin_token');

  if (!token) return false;

  try {
    const payload = (await verify(token, config.jwt.secret, 'HS256')) as { role?: string };
    return payload.role === 'admin' || payload.role === 'mcp_service';
  } catch {
    return false;
  }
}

async function resolvePublicProductStatus(c: Context, requestedStatus: string) {
  const isAdminRequest = await isVerifiedAdminRequest(c);

  if (isAdminRequest) {
    return requestedStatus === 'all' ? undefined : requestedStatus || undefined;
  }

  return 'published';
}

const ProductSeoSchema = z.object({
  seo_title: z.string().optional().nullable(),
  meta_description: z.string().optional().nullable(),
  canonical_url: z.string().optional().nullable(),
  robots_index: z.boolean().optional(),
  robots_follow: z.boolean().optional(),
  og_title: z.string().optional().nullable(),
  og_description: z.string().optional().nullable(),
  og_image_url: z.string().optional().nullable(),
  twitter_card: z.string().optional().nullable(),
  schema_overrides: z.record(z.unknown()).optional().nullable(),
  localized_metadata: z.record(z.unknown()).optional().nullable(),
  hreflang_group_id: z.string().optional().nullable(),
});

const ProductDiscoverySchema = z.object({
  primary_keyword: z.string().optional().nullable(),
  secondary_keywords: jsonArray.optional(),
  long_tail_keywords: jsonArray.optional(),
  search_intents: jsonArray.optional(),
  semantic_entities: jsonArray.optional(),
  negative_keywords: jsonArray.optional(),
  product_document: z.string().optional().nullable(),
  document_hash: z.string().optional().nullable(),
  metadata: z.record(z.unknown()).optional().nullable(),
});

const ProductAttributeAssignmentSchema = z.object({
  attribute_id: z.string().uuid(),
  value_id: z.string().uuid().optional().nullable(),
  raw_value: z.string().optional().nullable(),
  source: z.string().optional().default('admin'),
  confidence: z.number().int().min(0).max(100).optional().default(100),
  metadata: z.record(z.unknown()).optional().nullable(),
});

const ProductMerchantSchema = z.object({
  variants: z.array(
    z.object({
      variant_id: z.string().uuid(),
      gtin: z.string().optional().nullable(),
      mpn: z.string().optional().nullable(),
      item_group_id: z.string().optional().nullable(),
      color: z.string().optional().nullable(),
      size: z.string().optional().nullable(),
      size_system: z.string().optional().nullable(),
      size_type: z.string().optional().nullable(),
      gender: z.string().optional().nullable(),
      age_group: z.string().optional().nullable(),
      condition: z.string().optional().default('new'),
      google_product_category: z.string().optional().nullable(),
      material: z.string().optional().nullable(),
      pattern: z.string().optional().nullable(),
      shipping_weight: z.number().int().optional().nullable(),
      feed_enabled: z.boolean().optional(),
      metadata: z.record(z.unknown()).optional().nullable(),
    })
  ),
});

const ProductMediaSeoSchema = z.object({
  images: z.array(
    z.object({
      image_id: z.string().uuid(),
      alt_text: z.string().optional().nullable(),
      image_role: z.string().optional().nullable(),
      view_type: z.string().optional().nullable(),
      color: z.string().optional().nullable(),
      seo_filename: z.string().optional().nullable(),
      cloudinary_public_id: z.string().optional().nullable(),
      media_type: z.enum(['image', 'video']).optional(),
      metadata: z.record(z.unknown()).optional().nullable(),
    })
  ),
});

async function calculateProductSeoScore(productId: string) {
  const [product] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
  if (!product) throw new NotFoundError('Product not found');

  const [seo] = await db.select().from(product_seo).where(eq(product_seo.product_id, productId)).limit(1);
  const images = await db.select().from(product_images).where(eq(product_images.product_id, productId));
  const categories = await db
    .select()
    .from(product_categories)
    .where(eq(product_categories.product_id, productId));
  const attrs = await db
    .select()
    .from(product_attribute_values)
    .where(eq(product_attribute_values.product_id, productId));

  const checks = [
    { key: 'title', ok: Boolean(product.title?.trim()), points: 10 },
    { key: 'slug', ok: Boolean(product.handle?.trim()), points: 10 },
    { key: 'description', ok: Boolean(product.description?.trim()), points: 10 },
    { key: 'image', ok: images.length > 0 || Boolean(product.thumbnail), points: 10 },
    { key: 'category', ok: categories.length > 0, points: 10 },
    { key: 'seo_title', ok: Boolean(seo?.seo_title || product.seo_title), points: 10 },
    { key: 'meta_description', ok: Boolean(seo?.meta_description || product.seo_description), points: 10 },
    { key: 'canonical', ok: Boolean(seo?.canonical_url || product.handle), points: 10 },
    { key: 'robots', ok: seo?.robots_index !== false && seo?.robots_follow !== false, points: 10 },
    { key: 'attributes', ok: attrs.length > 0 || Boolean(product.material), points: 10 },
  ];

  const score = checks.reduce((total, check) => total + (check.ok ? check.points : 0), 0);
  const blocking = checks
    .filter((check) => !check.ok && ['title', 'slug', 'image', 'category', 'seo_title', 'meta_description', 'attributes'].includes(check.key))
    .map((check) => check.key);

  await db
    .insert(product_seo)
    .values({
      product_id: productId,
      seo_title: product.seo_title,
      meta_description: product.seo_description,
      canonical_url: `/products/${product.handle}`,
      seo_score: score,
      updated_at: new Date(),
    })
    .onConflictDoUpdate({
      target: product_seo.product_id,
      set: { seo_score: score, updated_at: new Date() },
    });

  return { score, checks, blocking_errors: blocking };
}

// GET /products - List products with advanced filters (Public)
const listProductsHandler = asyncHandler(async (c) => {
  const query = c.req.query();
  const {
    limit = '20',
    offset = '0',
    search = '',
    status = '',
    sort = 'created_at',
    min_price = '',
    max_price = '',
    category_id = '',
    tag_id = '',
    collection_id = '',
    attribute_code = '',
    attribute_value = '',
  } = query;

  const limitNum = Math.min(parseInt(limit) || 20, 100);
  const offsetNum = Math.max(parseInt(offset) || 0, 0);
  const effectiveStatus = await resolvePublicProductStatus(c, status);

  // Only use search service when there's actual text search query
  // For sorting/filtering without text search, use listDetailed
  if (search) {
    let sortBy: 'relevance' | 'price_asc' | 'price_desc' | 'newest' =
      'relevance';
    if (sort === 'price_asc') sortBy = 'price_asc';
    if (sort === 'price_desc') sortBy = 'price_desc';
    if (sort === 'created_at' || sort === 'newest') sortBy = 'newest';

    const results = await productService.search(search, {
      query: search,
      minPrice: min_price ? Number(min_price) : undefined,
      maxPrice: max_price ? Number(max_price) : undefined,
      status: effectiveStatus,
      sortBy,
      categoryId: category_id || undefined,
      tagId: tag_id || undefined,
      collectionId: collection_id || undefined,
      attributeCode: attribute_code || undefined,
      attributeValue: attribute_value || undefined,
    });

    // Manual pagination for search results
    const paginatedResults = results.slice(offsetNum, offsetNum + limitNum);

    return paginatedResponse(
      c,
      paginatedResults,
      {
        offset: offsetNum,
        limit: limitNum,
        total: results.length,
      },
      'Products retrieved successfully'
    );
  }

  // Standard detailed list - handles sorting and all filters
  const result = await productService.listDetailed({
    limit: limitNum,
    offset: offsetNum,
    sort: sort || 'created_at',
    status: effectiveStatus,
    categoryId: category_id || undefined,
    tagId: tag_id || undefined,
    collectionId: collection_id || undefined,
    attributeCode: attribute_code || undefined,
    attributeValue: attribute_value || undefined,
  });

  return paginatedResponse(
    c,
    result.products,
    {
      offset: result.offset || 0,
      limit: result.limit || 20,
      total: result.total || 0,
    },
    'Products retrieved successfully'
  );
});

productsRouter.get('', listProductsHandler);
productsRouter.get('/', listProductsHandler);

// GET /products/search/suggestions - Autocomplete
productsRouter.get(
  '/search/suggestions',
  asyncHandler(async (c) => {
    const { q } = c.req.query();
    if (!q || q.trim().length < 2) {
      return successResponse(c, [], 'Search query too short');
    }

    const suggestions = await productService.getSuggestions(q);
    return successResponse(
      c,
      suggestions,
      'Suggestions retrieved successfully'
    );
  })
);

// GET /products/stats/overview - Get product statistics
productsRouter.get(
  '/stats/overview',
  verifyAdminOrMcpService,
  asyncHandler(async (c) => {
    const stats = await productService.getStats();
    return successResponse(
      c,
      stats,
      'Product statistics retrieved successfully'
    );
  })
);

// GET /products/featured - Get featured products by IDs (Public)
// IMPORTANT: Must be registered BEFORE /:id to avoid being shadowed
productsRouter.get(
  '/featured',
  asyncHandler(async (c) => {
    const query = c.req.query();
    const { ids = '' } = query;

    if (!ids) {
      return successResponse(c, [], 'No featured product IDs provided');
    }

    const productIds = ids
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    if (productIds.length === 0) {
      return successResponse(c, [], 'No valid product IDs provided');
    }

    // 🔧 PERF: Batch fetch all featured products in ONE query instead of N individual queries
    const allProducts = await productService.retrieveMany(productIds);
    const validProducts = allProducts.filter((p) => p.status === 'published');

    return successResponse(
      c,
      validProducts,
      'Featured products retrieved successfully'
    );
  })
);

// GET /products/:id/seo - Product SEO controls
productsRouter.get(
  '/:id/seo',
  verifyAdminOrMcpService,
  asyncHandler(async (c) => {
    const id = c.req.param('id');
    const [seo] = await db.select().from(product_seo).where(eq(product_seo.product_id, id)).limit(1);
    return successResponse(c, { seo: seo || null }, 'Product SEO retrieved successfully');
  })
);

productsRouter.put(
  '/:id/seo',
  verifyAdminOrMcpService,
  asyncHandler(async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json();
    const result = ProductSeoSchema.safeParse(body);
    if (!result.success) throw new ValidationError('Invalid product SEO data', result.error.errors);

    await db
      .insert(product_seo)
      .values({ product_id: id, ...result.data, updated_at: new Date() })
      .onConflictDoUpdate({
        target: product_seo.product_id,
        set: { ...result.data, updated_at: new Date() },
      });

    await db
      .update(products)
      .set({
        seo_title: result.data.seo_title ?? undefined,
        seo_description: result.data.meta_description ?? undefined,
        updated_at: new Date(),
      })
      .where(eq(products.id, id));

    const score = await calculateProductSeoScore(id);
    const [seo] = await db.select().from(product_seo).where(eq(product_seo.product_id, id)).limit(1);
    return successResponse(c, { seo, score }, 'Product SEO updated successfully');
  })
);

// GET/PUT /products/:id/discovery - Semantic keyword and intent controls
productsRouter.get(
  '/:id/discovery',
  verifyAdminOrMcpService,
  asyncHandler(async (c) => {
    const id = c.req.param('id');
    const [discovery] = await db
      .select()
      .from(product_discovery)
      .where(eq(product_discovery.product_id, id))
      .limit(1);
    return successResponse(c, { discovery: discovery || null }, 'Product discovery data retrieved successfully');
  })
);

productsRouter.put(
  '/:id/discovery',
  verifyAdminOrMcpService,
  asyncHandler(async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json();
    const result = ProductDiscoverySchema.safeParse(body);
    if (!result.success) throw new ValidationError('Invalid product discovery data', result.error.errors);

    const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);
    if (!product) throw new NotFoundError('Product not found');

    const productDocument =
      result.data.product_document ||
      [
        product.title,
        product.subtitle,
        product.description,
        product.material,
        result.data.primary_keyword,
        ...(result.data.secondary_keywords || []),
        ...(result.data.long_tail_keywords || []),
        ...(result.data.semantic_entities || []),
      ]
        .filter(Boolean)
        .join(' ');
    const documentHash = createHash('sha256').update(productDocument).digest('hex');

    await db
      .insert(product_discovery)
      .values({
        product_id: id,
        ...result.data,
        product_document: productDocument,
        document_hash: documentHash,
        updated_at: new Date(),
      })
      .onConflictDoUpdate({
        target: product_discovery.product_id,
        set: {
          ...result.data,
          product_document: productDocument,
          document_hash: documentHash,
          updated_at: new Date(),
        },
      });

    if (process.env.ENABLE_PRODUCT_EMBEDDINGS === 'true') {
      await db
        .insert(product_embeddings)
        .values({
          product_id: id,
          locale: 'en',
          document: productDocument,
          source_hash: documentHash,
          updated_at: new Date(),
        })
        .onConflictDoUpdate({
          target: product_embeddings.product_id,
          set: {
            document: productDocument,
            source_hash: documentHash,
            updated_at: new Date(),
          },
        });
    }

    const [discovery] = await db
      .select()
      .from(product_discovery)
      .where(eq(product_discovery.product_id, id))
      .limit(1);
    return successResponse(c, { discovery }, 'Product discovery data updated successfully');
  })
);

// GET/PUT /products/:id/attributes - Structured fashion/product facets
productsRouter.get(
  '/:id/attributes',
  verifyAdminOrMcpService,
  asyncHandler(async (c) => {
    const id = c.req.param('id');
    const assignments = await db
      .select({
        id: product_attribute_values.id,
        product_id: product_attribute_values.product_id,
        attribute_id: product_attribute_values.attribute_id,
        value_id: product_attribute_values.value_id,
        raw_value: product_attribute_values.raw_value,
        source: product_attribute_values.source,
        confidence: product_attribute_values.confidence,
        attribute_code: product_attributes.code,
        attribute_label: product_attributes.label,
        value_label: attribute_values.label,
        value_slug: attribute_values.slug,
      })
      .from(product_attribute_values)
      .leftJoin(product_attributes, eq(product_attribute_values.attribute_id, product_attributes.id))
      .leftJoin(attribute_values, eq(product_attribute_values.value_id, attribute_values.id))
      .where(eq(product_attribute_values.product_id, id));

    return successResponse(c, { attributes: assignments }, 'Product attributes retrieved successfully');
  })
);

productsRouter.put(
  '/:id/attributes',
  verifyAdminOrMcpService,
  asyncHandler(async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json();
    const result = z.object({ attributes: z.array(ProductAttributeAssignmentSchema) }).safeParse(body);
    if (!result.success) throw new ValidationError('Invalid product attributes data', result.error.errors);

    await db.delete(product_attribute_values).where(eq(product_attribute_values.product_id, id));
    if (result.data.attributes.length > 0) {
      await db.insert(product_attribute_values).values(
        result.data.attributes.map((attribute) => ({
          product_id: id,
          ...attribute,
          updated_at: new Date(),
        }))
      );
    }

    const score = await calculateProductSeoScore(id);
    return successResponse(c, { score }, 'Product attributes updated successfully');
  })
);

// GET/PUT /products/:id/merchant - Google Merchant apparel fields
productsRouter.get(
  '/:id/merchant',
  verifyAdminOrMcpService,
  asyncHandler(async (c) => {
    const id = c.req.param('id');
    const variants = await db.select().from(product_variants).where(eq(product_variants.product_id, id));
    const variantIds = variants.map((variant) => variant.id);
    const merchant = variantIds.length
      ? await db.select().from(product_variant_merchant).where(inArray(product_variant_merchant.variant_id, variantIds))
      : [];
    return successResponse(c, { merchant }, 'Product merchant data retrieved successfully');
  })
);

productsRouter.put(
  '/:id/merchant',
  verifyAdminOrMcpService,
  asyncHandler(async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json();
    const result = ProductMerchantSchema.safeParse(body);
    if (!result.success) throw new ValidationError('Invalid merchant data', result.error.errors);

    const variants = await db.select().from(product_variants).where(eq(product_variants.product_id, id));
    const validVariantIds = new Set(variants.map((variant) => variant.id));

    for (const row of result.data.variants) {
      if (!validVariantIds.has(row.variant_id)) {
        throw new ValidationError('Variant does not belong to this product');
      }
      await db
        .insert(product_variant_merchant)
        .values({ ...row, updated_at: new Date() })
        .onConflictDoUpdate({
          target: product_variant_merchant.variant_id,
          set: { ...row, updated_at: new Date() },
        });
    }

    return successResponse(c, { updated: result.data.variants.length }, 'Merchant data updated successfully');
  })
);

// GET/PUT /products/:id/media-seo - Per-image SEO metadata
productsRouter.get(
  '/:id/media-seo',
  verifyAdminOrMcpService,
  asyncHandler(async (c) => {
    const id = c.req.param('id');
    const images = await db.select().from(product_images).where(eq(product_images.product_id, id));
    const imageIds = images.map((image) => image.id);
    const mediaSeo = imageIds.length
      ? await db.select().from(product_media_seo).where(inArray(product_media_seo.image_id, imageIds))
      : [];
    return successResponse(c, { media_seo: mediaSeo }, 'Product media SEO retrieved successfully');
  })
);

productsRouter.put(
  '/:id/media-seo',
  verifyAdminOrMcpService,
  asyncHandler(async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json();
    const result = ProductMediaSeoSchema.safeParse(body);
    if (!result.success) throw new ValidationError('Invalid product media SEO data', result.error.errors);

    const images = await db.select().from(product_images).where(eq(product_images.product_id, id));
    const validImageIds = new Set(images.map((image) => image.id));

    for (const row of result.data.images) {
      if (!validImageIds.has(row.image_id)) {
        throw new ValidationError('Image does not belong to this product');
      }
      await db
        .insert(product_media_seo)
        .values({ ...row, updated_at: new Date() })
        .onConflictDoUpdate({
          target: product_media_seo.image_id,
          set: { ...row, updated_at: new Date() },
        });

      if (row.alt_text !== undefined) {
        await db
          .update(product_images)
          .set({ alt_text: row.alt_text, updated_at: new Date() })
          .where(eq(product_images.id, row.image_id));
      }
    }

    const score = await calculateProductSeoScore(id);
    return successResponse(c, { updated: result.data.images.length, score }, 'Product media SEO updated successfully');
  })
);

productsRouter.get(
  '/:id/seo-score',
  verifyAdminOrMcpService,
  asyncHandler(async (c) => {
    const id = c.req.param('id');
    const score = await calculateProductSeoScore(id);
    return successResponse(c, score, 'Product SEO score calculated successfully');
  })
);

// GET /products/:id - Get single product (Public)
productsRouter.get(
  '/:id',
  asyncHandler(async (c) => {
    const id = c.req.param('id');
    try {
      const product = await productService.retrieve(id);
      if (!product) throw new NotFoundError('Product not found');

      // Generate dynamic JSON-LD Schema (Google Compliant)
      const prices = (product.variants || [])
        .flatMap((v: any) => v.prices || [])
        .filter((p: any) => p && p.currency_code?.toLowerCase() === 'inr')
        .map((p: any) => Number(p.amount) / 100);
      const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
      const hasStock = (product.variants || []).some((v: any) => (v.inventory_quantity || 0) > 0);

      const schema = {
        '@context': 'https://schema.org/',
        '@type': 'Product',
        'name': product.title,
        'image': product.images?.map((img: any) => img.url) || [product.thumbnail],
        'description': product.description || product.title,
        'sku': product.variants?.[0]?.sku || undefined,
        'offers': {
          '@type': 'Offer',
          'priceCurrency': 'INR',
          'price': minPrice.toFixed(2),
          'availability': hasStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          'url': `${process.env.STOREFRONT_URL || 'https://odhvica.com'}/products/${product.handle}`,
        },
      };

      return successResponse(c, { product, schema }, 'Product retrieved successfully');
    } catch (error: unknown) {
      // Only throw NotFoundError if it's actually a "not found" error
      if (error instanceof Error && error.message.includes('not found')) {
        throw new NotFoundError('Product not found');
      }
      // Re-throw other errors for proper error handling
      console.error('Error fetching product:', error);
      throw error;
    }
  })
);

// POST /products - Create product (Protected)
const createProductHandler = asyncHandler(async (c) => {
  const body = await c.req.json();
  const result = CreateProductSchema.safeParse(body);

  if (!result.success) {
    throw new ValidationError('Invalid product data', result.error.errors);
  }

  // Convert status to correct type if needed, Zod handles validation
  const product = await productService.create(result.data);
  try {
    await triggerStorefrontRevalidation({
      productId: product.id,
      handle: product.handle,
      paths: ['/', '/products'],
      tags: ['products'],
    });
  } catch (err) {
    console.warn(`[StorefrontRevalidate] Revalidation failed for product ${product.id}:`, err);
  }
  return successResponse(
    c,
    { product },
    'Product created successfully',
    HttpStatus.CREATED
  );
});

productsRouter.post('', verifyAdminOrMcpService, createProductHandler);
productsRouter.post('/', verifyAdminOrMcpService, createProductHandler);

// POST /products/bulk - Bulk update or delete
productsRouter.post(
  '/bulk',
  verifyAdminOrMcpService,
  asyncHandler(async (c) => {
    const body = await c.req.json();
    const { action, productIds, status } = body;
    
    if (!Array.isArray(productIds) || productIds.length === 0) {
      throw new ValidationError('productIds must be a non-empty array');
    }

    if (action === 'delete') {
      for (const id of productIds) {
        await productService.delete(id);
      }
      return successResponse(c, { deleted: productIds.length }, 'Products deleted successfully');
    }

    if (action === 'status' && status) {
      for (const id of productIds) {
        await productService.update(id, { status });
        try {
          const p = await productService.retrieve(id);
          await triggerStorefrontRevalidation({
            productId: p.id,
            handle: p.handle,
            paths: ['/', '/products'],
            tags: ['products'],
          });
        } catch (e) {
          console.warn(`Bulk revalidation failed for ${id}:`, e);
        }
      }
      return successResponse(c, { updated: productIds.length }, 'Products status updated successfully');
    }

    throw new ValidationError('Invalid bulk action');
  })
);

// POST /products/:id/duplicate - Duplicate a product
productsRouter.post(
  '/:id/duplicate',
  verifyAdminOrMcpService,
  asyncHandler(async (c) => {
    const id = c.req.param('id');
    const original = await productService.retrieve(id);
    if (!original) throw new NotFoundError('Product not found');

    const suffix = `-${Math.random().toString(36).substring(2, 7)}`;
    
    const duplicateData = {
      title: `${original.title} (Copy)`,
      handle: `${original.handle}${suffix}`,
      status: 'draft' as const,
      subtitle: original.subtitle || undefined,
      description: original.description || undefined,
      is_giftcard: original.is_giftcard,
      discountable: original.discountable,
      weight: original.weight || undefined,
      length: original.length || undefined,
      height: original.height || undefined,
      width: original.width || undefined,
      hs_code: original.hs_code || undefined,
      origin_country: original.origin_country || undefined,
      mid_code: original.mid_code || undefined,
      material: original.material || undefined,
      size_guide: original.size_guide || undefined,
      care_instructions: original.care_instructions || undefined,
      seo_title: original.seo_title || undefined,
      seo_description: original.seo_description || undefined,
      inventory_quantity: original.variants?.[0]?.inventory_quantity || 0,
      thumbnail: original.thumbnail || undefined,
      sku: original.variants?.[0]?.sku ? `${original.variants[0].sku}${suffix}` : undefined,
      collection_id: original.collection_id || undefined,
      category_ids: original.categories?.map((cat: any) => cat.id) || [],
      tag_ids: original.tags?.map((tag: any) => tag.id) || [],
      price_type: original.price_type,
      prices: original.variants?.[0]?.prices?.map((p: any) => ({
        amount: p.amount,
        currency_code: p.currency_code,
        region_id: p.region_id,
      })) || [],
      images: original.images?.map((img: any) => ({
        url: img.url,
        alt_text: img.alt_text,
        is_thumbnail: img.is_thumbnail,
        position: img.position,
      })) || [],
      options: original.options?.map((opt: any) => ({ title: opt.title })) || [],
    };

    const product = await productService.create(duplicateData);
    return successResponse(c, { product }, 'Product duplicated successfully', HttpStatus.CREATED);
  })
);

// PUT /products/:id - Update product (Protected)
productsRouter.put(
  '/:id',
  verifyAdminOrMcpService,
  asyncHandler(async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json();
    const result = UpdateProductSchema.safeParse(body);

    if (!result.success) {
      throw new ValidationError('Invalid product data', result.error.errors);
    }

    try {
      const product = await productService.update(id, result.data);
      try {
        await triggerStorefrontRevalidation({
          productId: product.id,
          handle: product.handle,
          paths: ['/', '/products'],
          tags: ['products'],
        });
      } catch (err) {
        console.warn(`[StorefrontRevalidate] Revalidation failed for product ${product.id}:`, err);
      }
      return successResponse(c, { product }, 'Product updated successfully');
    } catch (e: unknown) {
      if (e instanceof Error && e.message.includes('not found'))
        throw new NotFoundError('Product not found');
      throw e;
    }
  })
);

// DELETE /products/:id - Delete product (Protected)
productsRouter.delete(
  '/:id',
  verifyAdminOrMcpService,
  asyncHandler(async (c) => {
    const id = c.req.param('id');
    const product = await productService.retrieve(id);
    if (!product) {
      throw new NotFoundError('Product not found');
    }
    await productService.delete(id);
    try {
      await triggerStorefrontRevalidation({
        productId: id,
        handle: product.handle,
        paths: ['/', '/products'],
        tags: ['products'],
      });
    } catch (err) {
      console.warn(`[StorefrontRevalidate] Revalidation failed for product ${id}:`, err);
    }
    return successResponse(
      c,
      { id, deleted: true },
      'Product deleted successfully'
    );
  })
);

// --- VARIANT MANAGEMENT ---

// GET /products/:id/variants - Get all variants for a product
productsRouter.get(
  '/:id/variants',
  asyncHandler(async (c) => {
    const productId = c.req.param('id');

    const variants = await db
      .select()
      .from(product_variants)
      .where(eq(product_variants.product_id, productId));

    // Get prices for each variant
    const variantIds = variants.map((v) => v.id);
    let prices: (typeof money_amounts.$inferSelect)[] = [];
    if (variantIds.length > 0) {
      prices = await db
        .select()
        .from(money_amounts)
        .where(inArray(money_amounts.variant_id, variantIds));
    }

    // Get options for this product
    const options = await db
      .select()
      .from(product_options)
      .where(eq(product_options.product_id, productId));

    // Get option values for each variant
    let optionValues: (typeof product_option_values.$inferSelect)[] = [];
    if (variantIds.length > 0) {
      optionValues = await db
        .select()
        .from(product_option_values)
        .where(inArray(product_option_values.variant_id, variantIds));
    }

    const variantsWithPrices = variants.map((v) => ({
      ...v,
      prices: prices.filter((p) => p.variant_id === v.id),
      option_values: optionValues.filter((ov) => ov.variant_id === v.id),
    }));

    return successResponse(
      c,
      { variants: variantsWithPrices, options },
      'Variants retrieved successfully'
    );
  })
);

// POST /products/:id/variants - Create a new variant
productsRouter.post(
  '/:id/variants',
  verifyAdminOrMcpService,
  asyncHandler(async (c) => {
    const productId = c.req.param('id');
    const body = await c.req.json();

    const {
      title,
      sku,
      inventory_quantity = 0,
      compare_at_price,
      prices: variantPrices = [],
      option_values: optValues = [],
    } = body;

    if (!title) {
      throw new ValidationError('Variant title is required');
    }

    const result = await db.transaction(async (tx) => {
      // Create variant
      const [newVariant] = await tx
        .insert(product_variants)
        .values({
          product_id: productId,
          title,
          sku: sku || undefined,
          inventory_quantity,
          compare_at_price: compare_at_price ? parseInt(compare_at_price) : undefined,
          manage_inventory: true,
        })
        .returning();

      // Create prices
      if (variantPrices.length > 0) {
        for (const price of variantPrices) {
          await tx.insert(money_amounts).values({
            variant_id: newVariant.id,
            region_id: price.region_id,
            currency_code: price.currency_code,
            amount: price.amount,
            min_quantity: 1,
          });
        }
      }

      // Create option values (e.g., Size: "XL")
      if (optValues.length > 0) {
        for (const ov of optValues) {
          await tx.insert(product_option_values).values({
            variant_id: newVariant.id,
            option_id: ov.option_id,
            value: ov.value,
          });
        }
      }

      return newVariant;
    });

    return successResponse(
      c,
      { variant: result },
      'Variant created successfully',
      HttpStatus.CREATED
    );
  })
);

// PUT /products/:productId/variants/:variantId - Update a variant
productsRouter.put(
  '/:productId/variants/:variantId',
  verifyAdminOrMcpService,
  asyncHandler(async (c) => {
    const variantId = c.req.param('variantId');
    const body = await c.req.json();

    const { title, sku, inventory_quantity, compare_at_price, prices: variantPrices } = body;

    await db.transaction(async (tx) => {
      // Update variant
      const updateData: Partial<typeof product_variants.$inferInsert> = {};
      if (title !== undefined) updateData.title = title;
      if (sku !== undefined) updateData.sku = sku;
      if (inventory_quantity !== undefined)
        updateData.inventory_quantity = inventory_quantity;
      if (compare_at_price !== undefined)
        updateData.compare_at_price = compare_at_price === '' ? null : parseInt(compare_at_price);

      if (Object.keys(updateData).length > 0) {
        await tx
          .update(product_variants)
          .set(updateData)
          .where(eq(product_variants.id, variantId));
      }

      // Update prices if provided
      if (variantPrices) {
        // Delete existing prices
        await tx
          .delete(money_amounts)
          .where(eq(money_amounts.variant_id, variantId));

        // Insert new prices
        for (const price of variantPrices) {
          await tx.insert(money_amounts).values({
            variant_id: variantId,
            region_id: price.region_id,
            currency_code: price.currency_code,
            amount: price.amount,
            min_quantity: 1,
          });
        }
      }
    });

    return successResponse(c, { id: variantId }, 'Variant updated successfully');
  })
);

// DELETE /products/:productId/variants/:variantId - Delete a variant
productsRouter.delete(
  '/:productId/variants/:variantId',
  verifyAdminOrMcpService,
  asyncHandler(async (c) => {
    const variantId = c.req.param('variantId');

    await db.transaction(async (tx) => {
      // Delete option values
      await tx
        .delete(product_option_values)
        .where(eq(product_option_values.variant_id, variantId));

      // Delete prices
      await tx
        .delete(money_amounts)
        .where(eq(money_amounts.variant_id, variantId));

      // Delete variant
      await tx
        .delete(product_variants)
        .where(eq(product_variants.id, variantId));
    });

    return successResponse(
      c,
      { id: variantId, deleted: true },
      'Variant deleted successfully'
    );
  })
);

// POST /products/:id/options - Create a product option (e.g., "Size")
productsRouter.post(
  '/:id/options',
  verifyAdminOrMcpService,
  asyncHandler(async (c) => {
    const productId = c.req.param('id');
    const body = await c.req.json();
    const { title } = body;

    if (!title) {
      throw new ValidationError('Option title is required');
    }

    const [option] = await db
      .insert(product_options)
      .values({
        product_id: productId,
        title,
      })
      .returning();

    return successResponse(
      c,
      { option },
      'Option created successfully',
      HttpStatus.CREATED
    );
  })
);

export default productsRouter;
