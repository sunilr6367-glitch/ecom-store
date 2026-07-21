import { Hono } from 'hono';
import { asc, eq, sql } from 'drizzle-orm';
import { db } from '../db/client';
import { trending_reels } from '../db/schema';
import { isCloudinaryUrl, isStorefrontHref } from '../utils/media-url';

const app = new Hono();

app.get('/', async (c) => {
  try {
    const reels = await db
      .select()
      .from(trending_reels)
      .where(eq(trending_reels.is_active, true))
      .orderBy(asc(trending_reels.sort_order), asc(trending_reels.created_at));

    return c.json({
      reels: reels.filter(
        (reel) =>
          isCloudinaryUrl(reel.video_url) &&
          isCloudinaryUrl(reel.thumbnail_url) &&
          isStorefrontHref(reel.link_url)
      ),
    });
  } catch (error) {
    console.error('Error fetching active trending reels:', error);
    return c.json({ error: 'Failed to fetch trending reels' }, 500);
  }
});

app.post('/:id/view', async (c) => {
  try {
    const { id } = c.req.param();

    const [existingReel] = await db
      .select()
      .from(trending_reels)
      .where(eq(trending_reels.id, id))
      .limit(1);

    if (
      !existingReel ||
      !existingReel.is_active ||
      !isCloudinaryUrl(existingReel.video_url) ||
      !isCloudinaryUrl(existingReel.thumbnail_url) ||
      !isStorefrontHref(existingReel.link_url)
    ) {
      return c.json({ error: 'Trending reel not found' }, 404);
    }

    const [reel] = await db
      .update(trending_reels)
      .set({
        view_count: sql`${trending_reels.view_count} + 1`,
      })
      .where(eq(trending_reels.id, id))
      .returning();

    return c.json({ reel });
  } catch (error) {
    console.error('Error updating trending reel view count:', error);
    return c.json({ error: 'Failed to update trending reel views' }, 500);
  }
});

export default app;
