import { Hono, type Context } from 'hono';
import { z } from 'zod';
import { asc, eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { homepage_banners } from '../../db/schema';
import { verifyAdminOrMcpService } from '../../middleware/auth';
import { uploadImageToCloudinary } from '../../utils/cloudinary';

const app = new Hono();

app.use('*', verifyAdminOrMcpService);

const homepageBannerFieldsSchema = z.object({
  headline: z.string().trim().max(255).nullable(),
  button_label: z.string().trim().max(100).nullable(),
  button_url: z.string().trim().max(500).nullable(),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().min(0).default(0),
});

function normalizeOptionalString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
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

async function parseHomepageBannerForm(
  c: Context,
  defaults?: Partial<z.infer<typeof homepageBannerFieldsSchema>>
) {
  const body = await c.req.parseBody();
  const image = body.image || body.file;
  const imageFile = image instanceof File ? image : undefined;

  const fields = homepageBannerFieldsSchema.parse({
    headline: normalizeOptionalString(body.headline),
    button_label: normalizeOptionalString(body.button_label),
    button_url: normalizeOptionalString(body.button_url),
    is_active: parseBoolean(body.is_active, defaults?.is_active ?? true),
    sort_order: parseSortOrder(body.sort_order, defaults?.sort_order ?? 0),
  });

  return { fields, imageFile };
}

app.get('/', async (c) => {
  try {
    const banners = await db
      .select()
      .from(homepage_banners)
      .orderBy(
        asc(homepage_banners.sort_order),
        asc(homepage_banners.created_at)
      );

    return c.json({ banners });
  } catch (error) {
    console.error('Error fetching homepage banners:', error);
    return c.json({ error: 'Failed to fetch homepage banners' }, 500);
  }
});

app.post('/', async (c) => {
  try {
    const { fields, imageFile } = await parseHomepageBannerForm(c);

    if (!imageFile) {
      return c.json({ error: 'Image is required' }, 400);
    }

    if (!isAcceptedImage(imageFile)) {
      return c.json({ error: 'Image must be JPG, PNG, or WEBP format' }, 400);
    }

    const upload = await uploadImageToCloudinary(imageFile, {
      folder: 'odhvica/homepage-banners',
    });

    const [banner] = await db
      .insert(homepage_banners)
      .values({
        ...fields,
        image_url: upload.secureUrl,
      })
      .returning();

    return c.json({ banner }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json(
        {
          error: 'Invalid homepage banner data',
          details: error.flatten(),
        },
        400
      );
    }

    console.error('Error creating homepage banner:', error);
    return c.json({ error: 'Failed to create homepage banner' }, 500);
  }
});

app.put('/:id', async (c) => {
  try {
    const { id } = c.req.param();

    const [existingBanner] = await db
      .select()
      .from(homepage_banners)
      .where(eq(homepage_banners.id, id))
      .limit(1);

    if (!existingBanner) {
      return c.json({ error: 'Homepage banner not found' }, 404);
    }

    const { fields, imageFile } = await parseHomepageBannerForm(c, {
      is_active: existingBanner.is_active ?? true,
      sort_order: existingBanner.sort_order ?? 0,
    });

    let imageUrl = existingBanner.image_url;

    if (imageFile) {
      if (!isAcceptedImage(imageFile)) {
        return c.json({ error: 'Image must be JPG, PNG, or WEBP format' }, 400);
      }

      const upload = await uploadImageToCloudinary(imageFile, {
        folder: 'odhvica/homepage-banners',
      });
      imageUrl = upload.secureUrl;
    }

    const [banner] = await db
      .update(homepage_banners)
      .set({
        ...fields,
        image_url: imageUrl,
      })
      .where(eq(homepage_banners.id, id))
      .returning();

    return c.json({ banner });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json(
        {
          error: 'Invalid homepage banner data',
          details: error.flatten(),
        },
        400
      );
    }

    console.error('Error updating homepage banner:', error);
    return c.json({ error: 'Failed to update homepage banner' }, 500);
  }
});

app.delete('/:id', async (c) => {
  try {
    const { id } = c.req.param();

    const [existingBanner] = await db
      .select()
      .from(homepage_banners)
      .where(eq(homepage_banners.id, id))
      .limit(1);

    if (!existingBanner) {
      return c.json({ error: 'Homepage banner not found' }, 404);
    }

    await db.delete(homepage_banners).where(eq(homepage_banners.id, id));
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting homepage banner:', error);
    return c.json({ error: 'Failed to delete homepage banner' }, 500);
  }
});

app.patch('/:id/toggle', async (c) => {
  try {
    const { id } = c.req.param();

    const [existingBanner] = await db
      .select()
      .from(homepage_banners)
      .where(eq(homepage_banners.id, id))
      .limit(1);

    if (!existingBanner) {
      return c.json({ error: 'Homepage banner not found' }, 404);
    }

    const [banner] = await db
      .update(homepage_banners)
      .set({
        is_active: !existingBanner.is_active,
      })
      .where(eq(homepage_banners.id, id))
      .returning();

    return c.json({ banner });
  } catch (error) {
    console.error('Error toggling homepage banner:', error);
    return c.json({ error: 'Failed to toggle homepage banner' }, 500);
  }
});

export default app;
