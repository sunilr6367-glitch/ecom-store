import { Hono, type Context } from 'hono';
import { z } from 'zod';
import { type InferSelectModel, and, asc, eq, inArray, or, sql } from 'drizzle-orm';
import { db } from '../../db/client';
import {
  featured_products,
  product_variants,
  products,
} from '../../db/schema';
import { verifyAdmin } from '../../middleware/auth';
import { uploadImageToCloudinary } from '../../utils/cloudinary';
import { productService } from '../../services/product-service';
import { sanitizeSearchInput } from '../../utils/validation';

const app = new Hono();
type FeaturedProductRow = InferSelectModel<typeof featured_products>;

app.use('*', verifyAdmin);

const featuredProductFieldsSchema = z.object({
  section_key: z
    .enum(['spotlight', 'new_arrivals', 'bestsellers'])
    .default('spotlight'),
  product_id: z.string().uuid(),
  badge_text: z.string().trim().max(100).nullable(),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().min(0).default(0),
});

function normalizeOptionalString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseBoolean(value: unknown, defaultValue: boolean): boolean {
  if (typeof value !== 'string') {
    return defaultValue;
  }

  if (value === 'true') return true;
  if (value === 'false') return false;
  return defaultValue;
}

function parseSortOrder(value: unknown, defaultValue: number): number {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return defaultValue;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

function isAcceptedImage(file: File): boolean {
  const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  const lowerName = file.name.toLowerCase();
  return (
    acceptedTypes.includes(file.type) ||
    lowerName.endsWith('.jpg') ||
    lowerName.endsWith('.jpeg') ||
    lowerName.endsWith('.png') ||
    lowerName.endsWith('.webp')
  );
}

async function parseFeaturedProductForm(
  c: Context,
  defaults?: Partial<z.infer<typeof featuredProductFieldsSchema>>
) {
  const body = await c.req.parseBody();
  const image = body.custom_image || body.image || body.file;
  const imageFile = image instanceof File ? image : undefined;

  const fields = featuredProductFieldsSchema.parse({
    section_key:
      typeof body.section_key === 'string' ? body.section_key.trim() : 'spotlight',
    product_id:
      typeof body.product_id === 'string' ? body.product_id.trim() : '',
    badge_text: normalizeOptionalString(body.badge_text),
    is_active: parseBoolean(body.is_active, defaults?.is_active ?? true),
    sort_order: parseSortOrder(body.sort_order, defaults?.sort_order ?? 0),
  });

  return { fields, imageFile };
}

async function serializeFeaturedProduct(item: FeaturedProductRow) {
  try {
    const product = await productService.retrieve(item.product_id);
    return {
      ...item,
      product,
    };
  } catch {
    return {
      ...item,
      product: null,
    };
  }
}

app.get('/', async (c) => {
  try {
    const section = c.req.query('section');
    const items = section
      ? await db
          .select()
          .from(featured_products)
          .where(eq(featured_products.section_key, section))
          .orderBy(
            asc(featured_products.sort_order),
            asc(featured_products.created_at)
          )
      : await db
          .select()
          .from(featured_products)
          .orderBy(
            asc(featured_products.sort_order),
            asc(featured_products.created_at)
          );

    const featuredProducts = await Promise.all(
      items.map((item) => serializeFeaturedProduct(item))
    );

    return c.json({ featuredProducts });
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return c.json({ error: 'Failed to fetch featured products' }, 500);
  }
});

app.get('/product-search', async (c) => {
  try {
    const q = sanitizeSearchInput(c.req.query('q') || '');

    if (!q || q.length < 2) {
      return c.json({ products: [] });
    }

    const pattern = `%${q.toLowerCase()}%`;

    const rows = await db
      .select({
        id: products.id,
        title: products.title,
        handle: products.handle,
        thumbnail: products.thumbnail,
        sku: product_variants.sku,
      })
      .from(products)
      .leftJoin(product_variants, eq(product_variants.product_id, products.id))
      .where(
        and(
          eq(products.status, 'published'),
          or(
            sql`lower(${products.title}) like ${pattern}`,
            sql`lower(${products.handle}) like ${pattern}`,
            sql`lower(coalesce(${product_variants.sku}, '')) like ${pattern}`
          )
        )
      )
      .orderBy(asc(products.title))
      .limit(25);

    const uniqueProducts = new Map<
      string,
      {
        id: string;
        title: string;
        handle: string;
        thumbnail: string | null;
        skus: string[];
      }
    >();

    rows.forEach((row) => {
      const existing = uniqueProducts.get(row.id);
      if (!existing) {
        uniqueProducts.set(row.id, {
          id: row.id,
          title: row.title,
          handle: row.handle,
          thumbnail: row.thumbnail,
          skus: row.sku ? [row.sku] : [],
        });
        return;
      }

      if (row.sku && !existing.skus.includes(row.sku)) {
        existing.skus.push(row.sku);
      }
    });

    return c.json({ products: Array.from(uniqueProducts.values()) });
  } catch (error) {
    console.error('Error searching products for featured products:', error);
    return c.json({ error: 'Failed to search products' }, 500);
  }
});

app.post('/', async (c) => {
  try {
    const { fields, imageFile } = await parseFeaturedProductForm(c);

    if (imageFile && !isAcceptedImage(imageFile)) {
      return c.json({ error: 'Image must be JPG, PNG, or WEBP format' }, 400);
    }

    let customImageUrl: string | null = null;
    if (imageFile) {
      const upload = await uploadImageToCloudinary(imageFile, {
        folder: 'odhvica/featured-products',
      });
      customImageUrl = upload.secureUrl;
    }

    const [featuredProduct] = await db
      .insert(featured_products)
      .values({
        ...fields,
        custom_image_url: customImageUrl,
      })
      .returning();

    return c.json(
      {
        featuredProduct: await serializeFeaturedProduct(featuredProduct),
      },
      201
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json(
        {
          error: 'Invalid featured product data',
          details: error.flatten(),
        },
        400
      );
    }

    console.error('Error creating featured product:', error);
    return c.json({ error: 'Failed to create featured product' }, 500);
  }
});

app.put('/:id', async (c) => {
  try {
    const { id } = c.req.param();

    const [existingItem] = await db
      .select()
      .from(featured_products)
      .where(eq(featured_products.id, id))
      .limit(1);

    if (!existingItem) {
      return c.json({ error: 'Featured product not found' }, 404);
    }

    const { fields, imageFile } = await parseFeaturedProductForm(c, {
      is_active: existingItem.is_active ?? true,
      sort_order: existingItem.sort_order ?? 0,
    });

    if (imageFile && !isAcceptedImage(imageFile)) {
      return c.json({ error: 'Image must be JPG, PNG, or WEBP format' }, 400);
    }

    let customImageUrl = existingItem.custom_image_url;
    if (imageFile) {
      const upload = await uploadImageToCloudinary(imageFile, {
        folder: 'odhvica/featured-products',
      });
      customImageUrl = upload.secureUrl;
    }

    const [featuredProduct] = await db
      .update(featured_products)
      .set({
        ...fields,
        custom_image_url: customImageUrl,
      })
      .where(eq(featured_products.id, id))
      .returning();

    return c.json({
      featuredProduct: await serializeFeaturedProduct(featuredProduct),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json(
        {
          error: 'Invalid featured product data',
          details: error.flatten(),
        },
        400
      );
    }

    console.error('Error updating featured product:', error);
    return c.json({ error: 'Failed to update featured product' }, 500);
  }
});

app.delete('/:id', async (c) => {
  try {
    const { id } = c.req.param();

    const [existingItem] = await db
      .select()
      .from(featured_products)
      .where(eq(featured_products.id, id))
      .limit(1);

    if (!existingItem) {
      return c.json({ error: 'Featured product not found' }, 404);
    }

    await db.delete(featured_products).where(eq(featured_products.id, id));
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting featured product:', error);
    return c.json({ error: 'Failed to delete featured product' }, 500);
  }
});

app.patch('/:id/toggle', async (c) => {
  try {
    const { id } = c.req.param();

    const [existingItem] = await db
      .select()
      .from(featured_products)
      .where(eq(featured_products.id, id))
      .limit(1);

    if (!existingItem) {
      return c.json({ error: 'Featured product not found' }, 404);
    }

    const [featuredProduct] = await db
      .update(featured_products)
      .set({
        is_active: !existingItem.is_active,
      })
      .where(eq(featured_products.id, id))
      .returning();

    return c.json({
      featuredProduct: await serializeFeaturedProduct(featuredProduct),
    });
  } catch (error) {
    console.error('Error toggling featured product:', error);
    return c.json({ error: 'Failed to toggle featured product' }, 500);
  }
});

const ProductPlacementSchema = z.object({
  placements: z
    .array(
      z.object({
        section_key: z.enum(['new_arrivals', 'bestsellers']),
        is_active: z.boolean().default(true),
        sort_order: z.number().int().min(0).default(0),
        badge_text: z.string().trim().max(100).optional().nullable(),
      })
    )
    .default([]),
});

app.get('/product/:productId/placements', async (c) => {
  try {
    const { productId } = c.req.param();
    const placements = await db
      .select()
      .from(featured_products)
      .where(eq(featured_products.product_id, productId))
      .orderBy(asc(featured_products.sort_order));

    return c.json({ placements });
  } catch (error) {
    console.error('Error fetching product placements:', error);
    return c.json({ error: 'Failed to fetch product placements' }, 500);
  }
});

app.put('/product/:productId/placements', async (c) => {
  try {
    const { productId } = c.req.param();
    const body = await c.req.json();
    const result = ProductPlacementSchema.safeParse(body);

    if (!result.success) {
      return c.json(
        { error: 'Invalid product placement data', details: result.error.flatten() },
        400
      );
    }

    const allowedSections = ['new_arrivals', 'bestsellers'];
    const desired = new Map(
      result.data.placements.map((placement) => [
        placement.section_key,
        placement,
      ])
    );

    await db.transaction(async (tx) => {
      await tx
        .delete(featured_products)
        .where(
          and(
            eq(featured_products.product_id, productId),
            inArray(featured_products.section_key, allowedSections)
          )
        );

      const nextPlacements = Array.from(desired.values());
      if (nextPlacements.length > 0) {
        await tx.insert(featured_products).values(
          nextPlacements.map((next) => ({
            product_id: productId,
            section_key: next.section_key,
            is_active: next.is_active,
            sort_order: next.sort_order,
            badge_text: next.badge_text || null,
          }))
        );
      }
    });

    const placements = await db
      .select()
      .from(featured_products)
      .where(eq(featured_products.product_id, productId));

    return c.json({ placements });
  } catch (error) {
    console.error('Error updating product placements:', error);
    return c.json({ error: 'Failed to update product placements' }, 500);
  }
});

export default app;
