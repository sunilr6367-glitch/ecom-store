import { Hono } from 'hono';
import { asc, eq } from 'drizzle-orm';
import { db } from '../db/client';
import { homepage_banners } from '../db/schema';
import { isCloudinaryUrl, isStorefrontHref } from '../utils/media-url';

const app = new Hono();

app.get('/', async (c) => {
  try {
    const banners = await db
      .select()
      .from(homepage_banners)
      .where(eq(homepage_banners.is_active, true))
      .orderBy(
        asc(homepage_banners.sort_order),
        asc(homepage_banners.created_at)
      );

    return c.json({
      banners: banners.filter(
        (banner) =>
          isCloudinaryUrl(banner.image_url) &&
          (!banner.button_url || isStorefrontHref(banner.button_url))
      ),
    });
  } catch (error) {
    console.error('Error fetching homepage banners:', error);
    return c.json({ error: 'Failed to fetch banners' }, 500);
  }
});

export default app;
