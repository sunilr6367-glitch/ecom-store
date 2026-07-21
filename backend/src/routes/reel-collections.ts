import { Hono } from 'hono';
import { asc, eq } from 'drizzle-orm';
import { db } from '../db/client';
import {
  reel_collection_items,
  reel_collections,
  trending_reels,
} from '../db/schema';
import { isCloudinaryUrl, isStorefrontHref } from '../utils/media-url';

const app = new Hono();

async function loadActiveCollections() {
  const [collections, rows] = await Promise.all([
    db
      .select()
      .from(reel_collections)
      .where(eq(reel_collections.is_active, true))
      .orderBy(asc(reel_collections.sort_order), asc(reel_collections.created_at)),
    db
      .select({
        collection_id: reel_collection_items.collection_id,
        sort_order: reel_collection_items.sort_order,
        reel: trending_reels,
      })
      .from(reel_collection_items)
      .leftJoin(trending_reels, eq(reel_collection_items.reel_id, trending_reels.id))
      .orderBy(
        asc(reel_collection_items.collection_id),
        asc(reel_collection_items.sort_order)
      ),
  ]);

  return collections
    .filter((collection) => !collection.cta_url || isStorefrontHref(collection.cta_url))
    .filter(
      (collection) =>
        (!collection.hero_image_url || isCloudinaryUrl(collection.hero_image_url)) &&
        (!collection.hero_video_url || isCloudinaryUrl(collection.hero_video_url))
    )
    .map((collection) => {
      const reels = rows
        .filter((row) => row.collection_id === collection.id)
        .map((row) => row.reel)
        .filter((reel) => {
          return (
            Boolean(reel) &&
            reel?.is_active === true &&
            isCloudinaryUrl(reel.video_url) &&
            isCloudinaryUrl(reel.thumbnail_url) &&
            isStorefrontHref(reel.link_url)
          );
        });

      return {
        ...collection,
        reel_ids: reels.map((reel) => reel!.id),
        reels,
      };
    });
}

app.get('/', async (c) => {
  try {
    const collections = await loadActiveCollections();
    return c.json({ collections });
  } catch (error) {
    console.error('Error fetching active reel collections:', error);
    return c.json({ error: 'Failed to fetch reel collections' }, 500);
  }
});

app.get('/:handle', async (c) => {
  try {
    const { handle } = c.req.param();
    const collections = await loadActiveCollections();
    const collection = collections.find((item) => item.handle === handle);

    if (!collection) {
      return c.json({ error: 'Reel collection not found' }, 404);
    }

    return c.json({ collection });
  } catch (error) {
    console.error('Error fetching active reel collection:', error);
    return c.json({ error: 'Failed to fetch reel collection' }, 500);
  }
});

export default app;
