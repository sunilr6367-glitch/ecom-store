import { Hono } from 'hono';
import { type InferSelectModel, and, asc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/client';
import { featured_products } from '../db/schema';
import { productService } from '../services/product-service';
import { cloudinaryUrlOrNull } from '../utils/media-url';

const app = new Hono();
type FeaturedProductRow = InferSelectModel<typeof featured_products>;

const SectionSchema = z.enum(['spotlight', 'new_arrivals', 'bestsellers']);

async function serializeFeaturedProduct(item: FeaturedProductRow) {
  try {
    const product = await productService.retrieve(item.product_id);

    if (!product || product.status !== 'published') {
      return null;
    }

    return {
      ...item,
      custom_image_url: cloudinaryUrlOrNull(item.custom_image_url),
      product,
    };
  } catch {
    return null;
  }
}

app.get('/', async (c) => {
  try {
    const parsedSection = SectionSchema.safeParse(c.req.query('section') || 'spotlight');
    if (!parsedSection.success) {
      return c.json({ error: 'Invalid featured product section' }, 400);
    }

    const section = parsedSection.data;
    const items = await db
      .select()
      .from(featured_products)
      .where(
        and(
          eq(featured_products.section_key, section),
          eq(featured_products.is_active, true)
        )
      )
      .orderBy(
        asc(featured_products.sort_order),
        asc(featured_products.created_at)
      );

    const featuredProducts = (
      await Promise.all(items.map((item) => serializeFeaturedProduct(item)))
    ).filter((item): item is NonNullable<typeof item> => item !== null);

    return c.json({ featuredProducts });
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return c.json({ error: 'Failed to fetch featured products' }, 500);
  }
});

export default app;
