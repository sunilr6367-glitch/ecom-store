import { Hono, type Context } from 'hono';
import { z } from 'zod';
import { asc, eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { trending_reels } from '../../db/schema';
import { verifyAdminOrMcpService } from '../../middleware/auth';
import {
  uploadImageToCloudinary,
  uploadVideoToCloudinary,
} from '../../utils/cloudinary';

const app = new Hono();

app.use('*', verifyAdminOrMcpService);

const trendingReelFieldsSchema = z.object({
  category: z.string().trim().max(100).nullable().optional(),
  caption: z.string().trim().max(1000).nullable().optional(),
  product_id: z.string().uuid().nullable().optional(),
  product_name: z.string().trim().min(1).max(255),
  price: z.string().trim().min(1).max(100),
  price_amount: z.number().int().min(0).optional().nullable(),
  link_url: z.string().trim().min(1).max(500),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().min(0).default(0),
});

function normalizeRequiredString(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
}

function normalizeOptionalString(value: unknown): string | null {
  if (typeof value !== 'string' || value.trim() === '') {
    return null;
  }

  return value.trim();
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

function isAcceptedVideo(file: File): boolean {
  const acceptedTypes = ['video/mp4', 'video/quicktime'];
  const lowerName = file.name.toLowerCase();
  return (
    acceptedTypes.includes(file.type) ||
    lowerName.endsWith('.mp4') ||
    lowerName.endsWith('.mov')
  );
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

async function parseTrendingReelForm(
  c: Context,
  defaults?: Partial<z.infer<typeof trendingReelFieldsSchema>>
) {
  const body = await c.req.parseBody();
  const video = body.video;
  const thumbnail = body.thumbnail;
  const videoFile = video instanceof File ? video : undefined;
  const thumbnailFile = thumbnail instanceof File ? thumbnail : undefined;

  const rawPriceAmount = body.price_amount;
  const parsedPriceAmount =
    typeof rawPriceAmount === 'string' && rawPriceAmount.trim() !== ''
      ? parseInt(rawPriceAmount, 10) || null
      : null;

  const fields = trendingReelFieldsSchema.parse({
    product_name: normalizeRequiredString(body.product_name),
    category: normalizeOptionalString(body.category),
    caption: normalizeOptionalString(body.caption),
    product_id: normalizeOptionalString(body.product_id),
    price: normalizeRequiredString(body.price),
    price_amount: parsedPriceAmount,
    link_url: normalizeRequiredString(body.link_url),
    is_active: parseBoolean(body.is_active, defaults?.is_active ?? true),
    sort_order: parseSortOrder(body.sort_order, defaults?.sort_order ?? 0),
  });

  return {
    fields,
    videoFile,
    thumbnailFile,
  };
}

app.get('/', async (c) => {
  try {
    const reels = await db
      .select()
      .from(trending_reels)
      .orderBy(asc(trending_reels.sort_order), asc(trending_reels.created_at));

    return c.json({ reels });
  } catch (error) {
    console.error('Error fetching trending reels:', error);
    return c.json({ error: 'Failed to fetch trending reels' }, 500);
  }
});

app.post('/', async (c) => {
  try {
    const { fields, videoFile, thumbnailFile } = await parseTrendingReelForm(c);

    if (!videoFile) {
      return c.json({ error: 'Video file is required' }, 400);
    }

    if (!thumbnailFile) {
      return c.json({ error: 'Thumbnail image is required' }, 400);
    }

    if (!isAcceptedVideo(videoFile)) {
      return c.json({ error: 'Video must be MP4 or MOV format' }, 400);
    }

    if (!isAcceptedImage(thumbnailFile)) {
      return c.json({ error: 'Thumbnail must be JPG, PNG, or WEBP format' }, 400);
    }

    const [videoUpload, thumbnailUpload] = await Promise.all([
      uploadVideoToCloudinary(videoFile, {
        folder: 'odhvica/trending-reels/videos',
      }),
      uploadImageToCloudinary(thumbnailFile, {
        folder: 'odhvica/trending-reels/thumbnails',
      }),
    ]);

    const [reel] = await db
      .insert(trending_reels)
      .values({
        product_name: fields.product_name,
        category: fields.category ?? null,
        caption: fields.caption ?? null,
        product_id: fields.product_id ?? null,
        price: fields.price,
        price_amount: fields.price_amount ?? null,
        link_url: fields.link_url,
        is_active: fields.is_active,
        sort_order: fields.sort_order,
        video_url: videoUpload.secureUrl,
        thumbnail_url: thumbnailUpload.secureUrl,
      })
      .returning();

    return c.json({ reel }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json(
        {
          error: 'Invalid trending reel data',
          details: error.flatten(),
        },
        400
      );
    }

    console.error('Error creating trending reel:', error);
    return c.json({ error: 'Failed to create trending reel' }, 500);
  }
});

app.put('/:id', async (c) => {
  try {
    const { id } = c.req.param();

    const [existingReel] = await db
      .select()
      .from(trending_reels)
      .where(eq(trending_reels.id, id))
      .limit(1);

    if (!existingReel) {
      return c.json({ error: 'Trending reel not found' }, 404);
    }

    const { fields, videoFile, thumbnailFile } = await parseTrendingReelForm(c, {
      is_active: existingReel.is_active ?? true,
      sort_order: existingReel.sort_order ?? 0,
    });

    let videoUrl = existingReel.video_url;
    let thumbnailUrl = existingReel.thumbnail_url;

    if (videoFile) {
      if (!isAcceptedVideo(videoFile)) {
        return c.json({ error: 'Video must be MP4 or MOV format' }, 400);
      }

      const upload = await uploadVideoToCloudinary(videoFile, {
        folder: 'odhvica/trending-reels/videos',
      });
      videoUrl = upload.secureUrl;
    }

    if (thumbnailFile) {
      if (!isAcceptedImage(thumbnailFile)) {
        return c.json(
          { error: 'Thumbnail must be JPG, PNG, or WEBP format' },
          400
        );
      }

      const upload = await uploadImageToCloudinary(thumbnailFile, {
        folder: 'odhvica/trending-reels/thumbnails',
      });
      thumbnailUrl = upload.secureUrl;
    }

    const [reel] = await db
      .update(trending_reels)
      .set({
        product_name: fields.product_name,
        category: fields.category ?? null,
        caption: fields.caption ?? null,
        product_id: fields.product_id ?? null,
        price: fields.price,
        price_amount: fields.price_amount ?? null,
        link_url: fields.link_url,
        is_active: fields.is_active,
        sort_order: fields.sort_order,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
      })
      .where(eq(trending_reels.id, id))
      .returning();

    return c.json({ reel });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json(
        {
          error: 'Invalid trending reel data',
          details: error.flatten(),
        },
        400
      );
    }

    console.error('Error updating trending reel:', error);
    return c.json({ error: 'Failed to update trending reel' }, 500);
  }
});

app.delete('/:id', async (c) => {
  try {
    const { id } = c.req.param();

    const [existingReel] = await db
      .select()
      .from(trending_reels)
      .where(eq(trending_reels.id, id))
      .limit(1);

    if (!existingReel) {
      return c.json({ error: 'Trending reel not found' }, 404);
    }

    await db.delete(trending_reels).where(eq(trending_reels.id, id));

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting trending reel:', error);
    return c.json({ error: 'Failed to delete trending reel' }, 500);
  }
});

app.patch('/:id/toggle', async (c) => {
  try {
    const { id } = c.req.param();

    const [existingReel] = await db
      .select()
      .from(trending_reels)
      .where(eq(trending_reels.id, id))
      .limit(1);

    if (!existingReel) {
      return c.json({ error: 'Trending reel not found' }, 404);
    }

    const [reel] = await db
      .update(trending_reels)
      .set({
        is_active: !existingReel.is_active,
      })
      .where(eq(trending_reels.id, id))
      .returning();

    return c.json({ reel });
  } catch (error) {
    console.error('Error toggling trending reel:', error);
    return c.json({ error: 'Failed to toggle trending reel' }, 500);
  }
});

export default app;
