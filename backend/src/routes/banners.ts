import { Hono } from 'hono';
import { asc, eq } from 'drizzle-orm';
import { db } from '../db';
import { homepage_banners } from '../db/schema';
import { isCloudinaryUrl, isStorefrontHref } from '../utils/media-url';

const app = new Hono();

async function getActiveBanners() {
  return db
    .select()
    .from(homepage_banners)
    .where(eq(homepage_banners.is_active, true))
    .orderBy(
      asc(homepage_banners.sort_order),
      asc(homepage_banners.created_at)
    );
}

app.get('/', async (c) => {
  try {
    const banners = await getActiveBanners();
    return c.json({
      banners: banners.filter(
        (banner) =>
          isCloudinaryUrl(banner.image_url) &&
          (!banner.button_url || isStorefrontHref(banner.button_url))
      ),
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.get('/storefront', async (c) => {
  try {
    const banners = await getActiveBanners();
    return c.json({
      banners: banners.filter(
        (banner) =>
          isCloudinaryUrl(banner.image_url) &&
          (!banner.button_url || isStorefrontHref(banner.button_url))
      ),
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

export default app;
