import { Hono, type Context } from 'hono';
import { getCookie } from 'hono/cookie';
import { verify } from 'hono/jwt';
import { zValidator } from '@hono/zod-validator';
import { verifyAdminOrMcpService } from '../middleware/auth';
import { db } from '../db/client';
import { product_collections, products, collection_products } from '../db/schema';
import { eq, desc, sql, and, ne } from 'drizzle-orm';
import { z } from 'zod';
import { triggerStorefrontRevalidation } from '../utils/storefront-revalidate';
import { config } from '../config';
import { productService } from '../services/product-service';

const isUuid = (val: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(val);
};

const collectionsRouter = new Hono();

function sanitizeHandle(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

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

// guide Section 3.2 + 3.5
const CollectionSchema = z.object({
  title: z.string().min(3).max(150).trim(),
  handle: z.string().min(1).optional(),
  image: z.string().optional(),
  type: z.enum(['occasion', 'seasonal', 'price', 'fabric', 'gift', 'style']).optional(),
  rule_type: z.enum(['manual', 'auto']).default('manual'),
  rule_definition: z.record(z.any()).optional(),
  description: z.string().optional(),
  cover_image_url: z.string().optional(),
  status: z.enum(['draft', 'active', 'archived']).default('draft'),
  display_order: z.number().int().default(0),
  show_in_megamenu: z.boolean().default(false),
  homepage_section: z.string().optional(),
  valid_from: z.string().datetime().optional().nullable(),
  valid_until: z.string().datetime().optional().nullable(),
  seo_title: z.string().max(200).optional(),
  seo_desc: z.string().max(300).optional(),
  og_image_url: z.string().optional(),
  is_indexable: z.boolean().default(true),
  robots_policy: z.enum(['index,follow', 'noindex,follow', 'noindex,nofollow']).default('index,follow'),
  canonical_url: z.string().max(500).optional().nullable(),
  seasonal_flag: z.enum(['evergreen', 'seasonal', 'campaign']).default('evergreen'),
  faq_items: z
    .array(
      z.object({
        question: z.string().max(200),
        answer: z.string().max(1000),
      })
    )
    .default([]),
  answer_capsule: z.string().max(1000).optional().nullable(),
  metadata: z.record(z.any()).optional(),
});

const ProductAssignmentSchema = z.object({
  product_ids: z.array(z.string().uuid()).default([]),
});

async function countPublishedProductsForCollection(collectionId: string) {
  const result = await productService.listDetailed({
    collectionId,
    status: 'published',
    limit: 1,
    offset: 0,
  });

  return Number(result.total || 0);
}

// Active status ke liye min 3 products + cover_image check
async function validateActiveStatus(collectionId: string): Promise<{ valid: boolean; count: number }> {
  const count = await countPublishedProductsForCollection(collectionId);
  return { valid: count >= 3, count };
}

// GET /collections
collectionsRouter.get('/', async (c) => {
  try {
    const { status, type, megamenu } = c.req.query();

    // Public requests: default to active only
    // Admin requests: all statuses when explicitly requested
    const isAdminRequest = await isVerifiedAdminRequest(c);
    if (status === 'all' && !isAdminRequest) {
      return c.json({ error: 'Admin access required' }, 403);
    }
    const effectiveStatus = status === 'all'
      ? undefined
      : status || (isAdminRequest ? undefined : 'active');

    const list = await db
      .select({
        id: product_collections.id,
        title: product_collections.title,
        handle: product_collections.handle,
        image: product_collections.image,
        cover_image_url: product_collections.cover_image_url,
        type: product_collections.type,
        rule_type: product_collections.rule_type,
        description: product_collections.description,
        status: product_collections.status,
        display_order: product_collections.display_order,
        show_in_megamenu: product_collections.show_in_megamenu,
        homepage_section: product_collections.homepage_section,
        valid_from: product_collections.valid_from,
        valid_until: product_collections.valid_until,
        seo_title: product_collections.seo_title,
        seo_desc: product_collections.seo_desc,
        og_image_url: product_collections.og_image_url,
        is_indexable: product_collections.is_indexable,
        robots_policy: product_collections.robots_policy,
        canonical_url: product_collections.canonical_url,
        seasonal_flag: product_collections.seasonal_flag,
        faq_items: product_collections.faq_items,
        answer_capsule: product_collections.answer_capsule,
        metadata: product_collections.metadata,
        created_at: product_collections.created_at,
        updated_at: product_collections.updated_at,
      })
      .from(product_collections)
      .where(
        and(
          effectiveStatus ? eq(product_collections.status, effectiveStatus) : undefined,
          type ? eq(product_collections.type, type) : undefined,
          megamenu === 'true' ? eq(product_collections.show_in_megamenu, true) : undefined,
          // Exclude soft-deleted
          sql`${product_collections.deleted_at} IS NULL`
        )
      )
      .orderBy(product_collections.display_order, desc(product_collections.created_at));

    const collectionsWithCounts = await Promise.all(
      list.map(async (collection) => ({
        ...collection,
        product_count: await countPublishedProductsForCollection(collection.id),
      }))
    );

    return c.json({ collections: collectionsWithCounts });
  } catch (error: any) {
    console.error('[Collections] GET / error:', error?.message || error);
    return c.json({ error: 'Failed to fetch collections', details: error?.message }, 500);
  }
});

// GET /collections/:id — by UUID or handle
collectionsRouter.get('/:id', async (c) => {
  const idOrHandle = c.req.param('id');
  try {
    const collection = isUuid(idOrHandle)
      ? await db.query.product_collections.findFirst({
          where: and(
            eq(product_collections.id, idOrHandle),
            sql`${product_collections.deleted_at} IS NULL`
          ),
        })
      : await db.query.product_collections.findFirst({
          where: and(
            eq(product_collections.handle, idOrHandle),
            sql`${product_collections.deleted_at} IS NULL`
          ),
        });

    if (!collection) return c.json({ error: 'Collection not found' }, 404);

    const cnt = await countPublishedProductsForCollection(collection.id);

    return c.json({ collection: { ...collection, product_count: cnt } });
  } catch (error: unknown) {
    console.error('Error fetching collection:', error);
    return c.json({ error: 'Failed to fetch collection' }, 500);
  }
});

// GET /collections/:id/products — junction table se
collectionsRouter.get('/:id/products', verifyAdminOrMcpService, async (c) => {
  const id = c.req.param('id');
  try {
    const rows = await db
      .select({
        id: products.id,
        title: products.title,
        handle: products.handle,
        thumbnail: products.thumbnail,
        status: products.status,
        price_type: products.price_type,
        position: collection_products.position,
      })
      .from(collection_products)
      .innerJoin(products, eq(products.id, collection_products.product_id))
      .where(eq(collection_products.collection_id, id))
      .orderBy(collection_products.position, desc(products.created_at));

    return c.json({ products: rows });
  } catch (error: unknown) {
    console.error('Error fetching collection products:', error);
    return c.json({ error: 'Failed to fetch collection products' }, 500);
  }
});

// PUT /collections/:id/products — M2M junction update
collectionsRouter.put(
  '/:id/products',
  verifyAdminOrMcpService,
  zValidator('json', ProductAssignmentSchema),
  async (c) => {
    const id = c.req.param('id');
    const { product_ids } = c.req.valid('json');

    try {
      await db.transaction(async (tx) => {
        // Remove all current assignments
        await tx
          .delete(collection_products)
          .where(eq(collection_products.collection_id, id));

        // Add new assignments with position
        if (product_ids.length > 0) {
          await tx.insert(collection_products).values(
            product_ids.map((pid, i) => ({
              product_id: pid,
              collection_id: id,
              position: i,
            }))
          );
        }

        // Auto-draft if < 3 active products (guide Rule CO-1)
        const { valid } = await validateActiveStatus(id);
        const [current] = await tx
          .select({ status: product_collections.status })
          .from(product_collections)
          .where(eq(product_collections.id, id));

        if (current?.status === 'active' && !valid) {
          await tx
            .update(product_collections)
            .set({ status: 'draft', updated_at: new Date() })
            .where(eq(product_collections.id, id));
        }
      });

      await triggerStorefrontRevalidation({
        paths: ['/', '/products', '/collections'],
        tags: ['products', 'collections'],
      });

      return c.json({ success: true, product_ids });
    } catch (error: unknown) {
      console.error('Error updating collection products:', error);
      return c.json({ error: 'Failed to update collection products' }, 500);
    }
  }
);

// POST /collections
collectionsRouter.post(
  '/',
  verifyAdminOrMcpService,
  zValidator('json', CollectionSchema),
  async (c) => {
    const data = c.req.valid('json');
    try {
      // Guide Rule CO-2: globally unique name (case-insensitive)
      const existing = await db.query.product_collections.findFirst({
        where: sql`lower(${product_collections.title}) = lower(${data.title})
                   AND ${product_collections.deleted_at} IS NULL`,
      });
      if (existing) {
        return c.json({ error: 'Collection with this name already exists' }, 409);
      }

      // Auto-generate handle if not provided
      const handle = sanitizeHandle(data.handle || data.title);

      // Active requires cover_image — force draft if no image
      let status = data.status;
      if (status === 'active' && !data.cover_image_url && !data.image) {
        status = 'draft';
      }

      const [newCollection] = await db
        .insert(product_collections)
        .values({
          title: data.title,
          handle,
          image: data.image,
          type: data.type,
          rule_type: data.rule_type,
          rule_definition: data.rule_definition,
          description: data.description,
          cover_image_url: data.cover_image_url,
          status,
          display_order: data.display_order,
          show_in_megamenu: data.show_in_megamenu,
          homepage_section: data.homepage_section,
          valid_from: data.valid_from ? new Date(data.valid_from) : null,
          valid_until: data.valid_until ? new Date(data.valid_until) : null,
          seo_title: data.seo_title,
          seo_desc: data.seo_desc,
          og_image_url: data.og_image_url,
          is_indexable: data.is_indexable,
          robots_policy: data.robots_policy,
          canonical_url: data.canonical_url,
          seasonal_flag: data.seasonal_flag || (data.type === 'seasonal' ? 'seasonal' : 'evergreen'),
          faq_items: data.faq_items,
          answer_capsule: data.answer_capsule,
          metadata: data.metadata,
        })
        .returning();

      await triggerStorefrontRevalidation({
        paths: ['/collections', `/collections/${newCollection.handle}`],
        tags: ['collections'],
      });

      return c.json({ collection: newCollection }, 201);
    } catch (error: any) {
      return c.json({ error: error.message || 'Failed to create collection' }, 500);
    }
  }
);

// PUT /collections/:id
collectionsRouter.put(
  '/:id',
  verifyAdminOrMcpService,
  zValidator('json', CollectionSchema.partial()),
  async (c) => {
    const id = c.req.param('id');
    const data = c.req.valid('json');
    try {
      // If setting active: validate product count + image
      if (data.status === 'active') {
        const [current] = await db
          .select({ cover_image_url: product_collections.cover_image_url, image: product_collections.image })
          .from(product_collections)
          .where(eq(product_collections.id, id));

        const hasImage = data.cover_image_url || data.image || current?.cover_image_url || current?.image;
        const { valid, count } = await validateActiveStatus(id);

        if (!valid) {
          return c.json({
            error: `Cannot activate: only ${count} active products (minimum 3 required)`,
          }, 400);
        }
        if (!hasImage) {
          return c.json({ error: 'Cannot activate: cover image required' }, 400);
        }
      }

      // Unique name check (case-insensitive) if title is changing
      if (data.title) {
        const duplicate = await db.query.product_collections.findFirst({
          where: and(
            sql`lower(${product_collections.title}) = lower(${data.title})`,
            ne(product_collections.id, id),
            sql`${product_collections.deleted_at} IS NULL`
          ),
        });
        if (duplicate) {
          return c.json({ error: 'Collection with this name already exists' }, 409);
        }
      }

      const [updatedCollection] = await db
        .update(product_collections)
        .set({
          ...data,
          handle: data.handle ? sanitizeHandle(data.handle) : undefined,
          valid_from: data.valid_from ? new Date(data.valid_from) : undefined,
          valid_until: data.valid_until ? new Date(data.valid_until) : undefined,
          updated_at: new Date(),
        })
        .where(eq(product_collections.id, id))
        .returning();

      await triggerStorefrontRevalidation({
        paths: ['/collections', `/collections/${updatedCollection.handle}`],
        tags: ['collections'],
      });

      return c.json({ collection: updatedCollection });
    } catch (error: any) {
      return c.json({ error: error.message || 'Failed to update collection' }, 500);
    }
  }
);

// DELETE /collections/:id
collectionsRouter.delete('/:id', verifyAdminOrMcpService, async (c) => {
  const id = c.req.param('id');
  try {
    // Soft delete
    const [deletedCollection] = await db
      .update(product_collections)
      .set({ deleted_at: new Date(), updated_at: new Date() })
      .where(eq(product_collections.id, id))
      .returning();

    await triggerStorefrontRevalidation({
      paths: ['/collections', deletedCollection?.handle ? `/collections/${deletedCollection.handle}` : '/collections'],
      tags: ['collections'],
    });

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to delete collection' }, 500);
  }
});

export default collectionsRouter;
