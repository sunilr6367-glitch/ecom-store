import { Hono } from 'hono';
import { asc, eq } from 'drizzle-orm';
import { db } from '../db/client';
import { homepage_categories } from '../db/schema';
import { isCloudinaryUrl, isStorefrontHref } from '../utils/media-url';

const app = new Hono();

app.get('/', async (c) => {
  try {
    const categories = await db
      .select()
      .from(homepage_categories)
      .where(eq(homepage_categories.is_active, true))
      .orderBy(
        asc(homepage_categories.sort_order),
        asc(homepage_categories.created_at)
      );

    return c.json({
      categories: categories.filter((category) =>
        isCloudinaryUrl(category.image_url) &&
        isStorefrontHref(category.link_url)
      ),
    });
  } catch (error) {
    console.error('Error fetching active homepage categories:', error);
    return c.json({ error: 'Failed to fetch homepage categories' }, 500);
  }
});

export default app;
