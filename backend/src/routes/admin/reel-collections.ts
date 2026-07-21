import { Hono, type Context } from 'hono';
import { z } from 'zod';
import { asc, eq } from 'drizzle-orm';
import { db } from '../../db/client';
import {
  reel_collection_items,
  reel_collections,
  trending_reels,
} from '../../db/schema';
import { verifyAdminOrMcpService } from '../../middleware/auth';
import { uploadImageToCloudinary } from '../../utils/cloudinary';

const app = new Hono();

app.use('*', verifyAdminOrMcpService);

const reelCollectionFieldsSchema = z.object({
  title: z.string().trim().min(1).max(255),
  handle: z.string().trim().min(1).max(255),
  subtitle: z.string().trim().max(500).nullable().optional(),
  description: z.string().trim().max(1200).nullable().optional(),
  hero_image_url: z.string().trim().max(500).nullable().optional(),
  hero_video_url: z.string().trim().max(500).nullable().optional(),
  cta_label: z.string().trim().min(1).max(100).default('Shop Collection'),
  cta_url: z.string().trim().max(500).nullable().optional(),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().min(0).default(0),
  reel_ids: z.array(z.string().uuid()).default([]),
});

function normalizeRequiredString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeOptionalString(value: unknown): string | null {
  if (typeof value !== 'string' || value.trim() === '') {
    return null;
  }
  return value.trim();
}

function parseBoolean(value: unknown, defaultValue: boolean): boolean {
  if (typeof value !== 'string') return defaultValue;
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

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function parseReelIds(value: unknown): string[] {
  if (typeof value !== 'string' || !value.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string')
      : [];
  } catch {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
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

async function parseReelCollectionForm(
  c: Context,
  defaults?: Partial<z.infer<typeof reelCollectionFieldsSchema>>
) {
  const body = await c.req.parseBody();
  const image = body.hero_image || body.image || body.file;
  const imageFile = image instanceof File ? image : undefined;
  const title = normalizeRequiredString(body.title);
  const handle = normalizeRequiredString(body.handle) || slugify(title);

  const fields = reelCollectionFieldsSchema.parse({
    title,
    handle,
    subtitle: normalizeOptionalString(body.subtitle),
    description: normalizeOptionalString(body.description),
    hero_image_url: normalizeOptionalString(body.hero_image_url),
    hero_video_url: normalizeOptionalString(body.hero_video_url),
    cta_label: normalizeRequiredString(body.cta_label) || 'Shop Collection',
    cta_url: normalizeOptionalString(body.cta_url),
    is_active: parseBoolean(body.is_active, defaults?.is_active ?? true),
    sort_order: parseSortOrder(body.sort_order, defaults?.sort_order ?? 0),
    reel_ids: parseReelIds(body.reel_ids),
  });

  return { fields, imageFile };
}

async function loadCollectionsWithItems() {
  const [collections, rows] = await Promise.all([
    db
      .select()
      .from(reel_collections)
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

  return collections.map((collection) => {
    const collectionRows = rows.filter((row) => row.collection_id === collection.id);
    const reels = collectionRows
      .map((row) => row.reel)
      .filter((reel): reel is NonNullable<typeof reel> => Boolean(reel));

    return {
      ...collection,
      reel_ids: reels.map((reel) => reel.id),
      reels,
    };
  });
}

async function replaceCollectionItems(collectionId: string, reelIds: string[]) {
  await db.delete(reel_collection_items).where(
    eq(reel_collection_items.collection_id, collectionId)
  );

  const uniqueReelIds = Array.from(new Set(reelIds));
  if (uniqueReelIds.length === 0) return;

  await db.insert(reel_collection_items).values(
    uniqueReelIds.map((reelId, index) => ({
      collection_id: collectionId,
      reel_id: reelId,
      sort_order: index,
    }))
  );
}

app.get('/', async (c) => {
  try {
    const collections = await loadCollectionsWithItems();
    return c.json({ collections });
  } catch (error) {
    console.error('Error fetching reel collections:', error);
    return c.json({ error: 'Failed to fetch reel collections' }, 500);
  }
});

app.post('/', async (c) => {
  try {
    const { fields, imageFile } = await parseReelCollectionForm(c);

    if (imageFile && !isAcceptedImage(imageFile)) {
      return c.json({ error: 'Hero image must be JPG, PNG, or WEBP format' }, 400);
    }

    const heroImageUrl = imageFile
      ? (await uploadImageToCloudinary(imageFile, {
          folder: 'odhvica/reel-collections',
        })).secureUrl
      : fields.hero_image_url ?? null;

    const [collection] = await db
      .insert(reel_collections)
      .values({
        title: fields.title,
        handle: fields.handle,
        subtitle: fields.subtitle ?? null,
        description: fields.description ?? null,
        hero_image_url: heroImageUrl,
        hero_video_url: fields.hero_video_url ?? null,
        cta_label: fields.cta_label,
        cta_url: fields.cta_url ?? null,
        is_active: fields.is_active,
        sort_order: fields.sort_order,
      })
      .returning();

    await replaceCollectionItems(collection.id, fields.reel_ids);

    return c.json({ collection }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json(
        {
          error: 'Invalid reel collection data',
          details: error.flatten(),
        },
        400
      );
    }

    console.error('Error creating reel collection:', error);
    return c.json({ error: 'Failed to create reel collection' }, 500);
  }
});

app.put('/:id', async (c) => {
  try {
    const { id } = c.req.param();

    const [existingCollection] = await db
      .select()
      .from(reel_collections)
      .where(eq(reel_collections.id, id))
      .limit(1);

    if (!existingCollection) {
      return c.json({ error: 'Reel collection not found' }, 404);
    }

    const { fields, imageFile } = await parseReelCollectionForm(c, {
      is_active: existingCollection.is_active ?? true,
      sort_order: existingCollection.sort_order ?? 0,
    });

    if (imageFile && !isAcceptedImage(imageFile)) {
      return c.json({ error: 'Hero image must be JPG, PNG, or WEBP format' }, 400);
    }

    let heroImageUrl = existingCollection.hero_image_url;
    if (imageFile) {
      const upload = await uploadImageToCloudinary(imageFile, {
        folder: 'odhvica/reel-collections',
      });
      heroImageUrl = upload.secureUrl;
    } else if (fields.hero_image_url !== undefined) {
      heroImageUrl = fields.hero_image_url;
    }

    const [collection] = await db
      .update(reel_collections)
      .set({
        title: fields.title,
        handle: fields.handle,
        subtitle: fields.subtitle ?? null,
        description: fields.description ?? null,
        hero_image_url: heroImageUrl,
        hero_video_url: fields.hero_video_url ?? null,
        cta_label: fields.cta_label,
        cta_url: fields.cta_url ?? null,
        is_active: fields.is_active,
        sort_order: fields.sort_order,
        updated_at: new Date(),
      })
      .where(eq(reel_collections.id, id))
      .returning();

    await replaceCollectionItems(id, fields.reel_ids);

    return c.json({ collection });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json(
        {
          error: 'Invalid reel collection data',
          details: error.flatten(),
        },
        400
      );
    }

    console.error('Error updating reel collection:', error);
    return c.json({ error: 'Failed to update reel collection' }, 500);
  }
});

app.delete('/:id', async (c) => {
  try {
    const { id } = c.req.param();

    const [existingCollection] = await db
      .select()
      .from(reel_collections)
      .where(eq(reel_collections.id, id))
      .limit(1);

    if (!existingCollection) {
      return c.json({ error: 'Reel collection not found' }, 404);
    }

    await db.delete(reel_collections).where(eq(reel_collections.id, id));

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting reel collection:', error);
    return c.json({ error: 'Failed to delete reel collection' }, 500);
  }
});

app.patch('/:id/toggle', async (c) => {
  try {
    const { id } = c.req.param();

    const [existingCollection] = await db
      .select()
      .from(reel_collections)
      .where(eq(reel_collections.id, id))
      .limit(1);

    if (!existingCollection) {
      return c.json({ error: 'Reel collection not found' }, 404);
    }

    const [collection] = await db
      .update(reel_collections)
      .set({
        is_active: !existingCollection.is_active,
        updated_at: new Date(),
      })
      .where(eq(reel_collections.id, id))
      .returning();

    return c.json({ collection });
  } catch (error) {
    console.error('Error toggling reel collection:', error);
    return c.json({ error: 'Failed to toggle reel collection' }, 500);
  }
});

export default app;
