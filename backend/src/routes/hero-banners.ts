import { Hono } from 'hono';
import { asc, eq } from 'drizzle-orm';
import { db } from '../db/client';
import { hero_banners } from '../db/schema';
import { isCloudinaryUrl, isStorefrontHref } from '../utils/media-url';

const app = new Hono();

app.get('/', async (c) => {
  try {
    const banners = await db
      .select()
      .from(hero_banners)
      .where(eq(hero_banners.is_active, true))
      .orderBy(asc(hero_banners.sort_order), asc(hero_banners.created_at));

    return c.json({
      banners: banners.filter(
        (banner) =>
          isCloudinaryUrl(banner.image_url) &&
          (!banner.button_link || isStorefrontHref(banner.button_link))
      ),
    });
  } catch (error) {
    console.error('Error fetching active hero banners:', error);
    return c.json({ error: 'Failed to fetch hero banners' }, 500);
  }
});

export default app;
