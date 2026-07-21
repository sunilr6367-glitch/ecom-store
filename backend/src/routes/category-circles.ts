import { Hono } from 'hono';
import { asc, eq } from 'drizzle-orm';
import { db } from '../db/client';
import { category_circles } from '../db/schema';
import { isCloudinaryUrl, isStorefrontHref } from '../utils/media-url';

const app = new Hono();

app.get('/', async (c) => {
  try {
    const circles = await db
      .select()
      .from(category_circles)
      .where(eq(category_circles.is_active, true))
      .orderBy(
        asc(category_circles.sort_order),
        asc(category_circles.created_at)
      );

    return c.json({
      circles: circles.filter(
        (circle) =>
          isCloudinaryUrl(circle.image_url) && isStorefrontHref(circle.link_url)
      ),
    });
  } catch (error) {
    console.error('Error fetching category circles:', error);
    return c.json({ error: 'Failed to fetch category circles' }, 500);
  }
});

export default app;
