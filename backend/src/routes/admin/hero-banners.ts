import { Hono, type Context } from 'hono';
import { z } from 'zod';
import { asc, eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { hero_banners } from '../../db/schema';
import { verifyAdminOrMcpService } from '../../middleware/auth';
import { uploadImageToCloudinary } from '../../utils/cloudinary';

const app = new Hono();

app.use('*', verifyAdminOrMcpService);

const safeDestination = z
  .string()
  .trim()
  .max(500)
  .refine(
    (value) =>
      (value.startsWith('/') && !value.startsWith('//')) ||
      (() => {
        try {
          return new URL(value).protocol === 'https:';
        } catch {
          return false;
        }
      })(),
    'CTA destination must be a local path or an HTTPS URL'
  );

const optionalHttpsUrl = z
  .string()
  .trim()
  .max(500)
  .url()
  .refine((value) => new URL(value).protocol === 'https:', 'Media URL must use HTTPS');

const heroBannerFieldsSchema = z
  .object({
    title: z.string().trim().max(255).nullable(),
    subtitle: z.string().trim().max(500).nullable(),
    button_text: z.string().trim().max(100).nullable(),
    button_link: safeDestination.nullable(),
    mobile_image_url: optionalHttpsUrl.nullable().optional(),
    is_active: z.boolean().default(true),
    sort_order: z.number().int().min(0).default(0),
  })
  .superRefine((banner, context) => {
    if (!banner.is_active) return;

    for (const field of ['title', 'subtitle', 'button_text', 'button_link'] as const) {
      if (!banner[field]) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [field],
          message: 'Active hero banners require complete HTML copy and a valid CTA',
        });
      }
    }
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

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return defaultValue;
}

function parseSortOrder(value: unknown, defaultValue: number): number {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return defaultValue;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

async function parseHeroBannerForm(
  c: Context,
  defaults?: Partial<z.infer<typeof heroBannerFieldsSchema>>
) {
  const body = await c.req.parseBody();
  const image = body.image || body.file;
  const imageFile = image instanceof File ? image : undefined;
  const mobileImage = body.mobile_image || body.mobile_file;
  const mobileImageFile = mobileImage instanceof File ? mobileImage : undefined;

  const fields = heroBannerFieldsSchema.parse({
    title: normalizeOptionalString(body.title),
    subtitle: normalizeOptionalString(body.subtitle),
    button_text: normalizeOptionalString(body.button_text),
    button_link: normalizeOptionalString(body.button_link),
    mobile_image_url: normalizeOptionalString(body.mobile_image_url),
    is_active: parseBoolean(body.is_active, defaults?.is_active ?? true),
    sort_order: parseSortOrder(body.sort_order, defaults?.sort_order ?? 0),
  });

  return {
    fields,
    imageFile,
    mobileImageFile,
  };
}

app.get('/', async (c) => {
  try {
    const banners = await db
      .select()
      .from(hero_banners)
      .orderBy(asc(hero_banners.sort_order), asc(hero_banners.created_at));

    return c.json({ banners });
  } catch (error) {
    console.error('Error fetching hero banners:', error);
    return c.json({ error: 'Failed to fetch hero banners' }, 500);
  }
});

app.post('/', async (c) => {
  try {
    const { fields, imageFile, mobileImageFile } = await parseHeroBannerForm(c);

    if (!imageFile) {
      return c.json({ error: 'Image is required' }, 400);
    }

    const upload = await uploadImageToCloudinary(imageFile);
    const mobileUpload = mobileImageFile
      ? await uploadImageToCloudinary(mobileImageFile)
      : null;

    const [banner] = await db
      .insert(hero_banners)
      .values({
        ...fields,
        image_url: upload.secureUrl,
        mobile_image_url: mobileUpload?.secureUrl || fields.mobile_image_url || null,
      })
      .returning();

    return c.json({ banner }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json(
        {
          error: 'Invalid hero banner data',
          details: error.flatten(),
        },
        400
      );
    }

    console.error('Error creating hero banner:', error);
    return c.json({ error: 'Failed to create hero banner' }, 500);
  }
});

app.put('/:id', async (c) => {
  try {
    const { id } = c.req.param();

    const [existingBanner] = await db
      .select()
      .from(hero_banners)
      .where(eq(hero_banners.id, id))
      .limit(1);

    if (!existingBanner) {
      return c.json({ error: 'Hero banner not found' }, 404);
    }

    const { fields, imageFile, mobileImageFile } = await parseHeroBannerForm(c, {
      is_active: existingBanner.is_active ?? true,
      sort_order: existingBanner.sort_order ?? 0,
    });

    let imageUrl = existingBanner.image_url;
    let mobileImageUrl = existingBanner.mobile_image_url;

    if (imageFile) {
      const upload = await uploadImageToCloudinary(imageFile);
      imageUrl = upload.secureUrl;
    }
    if (mobileImageFile) {
      const upload = await uploadImageToCloudinary(mobileImageFile);
      mobileImageUrl = upload.secureUrl;
    } else if (fields.mobile_image_url !== undefined) {
      mobileImageUrl = fields.mobile_image_url;
    }

    const [banner] = await db
      .update(hero_banners)
      .set({
        ...fields,
        image_url: imageUrl,
        mobile_image_url: mobileImageUrl,
      })
      .where(eq(hero_banners.id, id))
      .returning();

    return c.json({ banner });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json(
        {
          error: 'Invalid hero banner data',
          details: error.flatten(),
        },
        400
      );
    }

    console.error('Error updating hero banner:', error);
    return c.json({ error: 'Failed to update hero banner' }, 500);
  }
});

app.delete('/:id', async (c) => {
  try {
    const { id } = c.req.param();

    const [existingBanner] = await db
      .select()
      .from(hero_banners)
      .where(eq(hero_banners.id, id))
      .limit(1);

    if (!existingBanner) {
      return c.json({ error: 'Hero banner not found' }, 404);
    }

    await db.delete(hero_banners).where(eq(hero_banners.id, id));

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting hero banner:', error);
    return c.json({ error: 'Failed to delete hero banner' }, 500);
  }
});

app.patch('/:id/toggle', async (c) => {
  try {
    const { id } = c.req.param();

    const [existingBanner] = await db
      .select()
      .from(hero_banners)
      .where(eq(hero_banners.id, id))
      .limit(1);

    if (!existingBanner) {
      return c.json({ error: 'Hero banner not found' }, 404);
    }

    const activating = !existingBanner.is_active;
    if (
      activating &&
      (!existingBanner.image_url ||
        !existingBanner.title ||
        !existingBanner.subtitle ||
        !existingBanner.button_text ||
        !existingBanner.button_link)
    ) {
      return c.json(
        {
          error:
            'Complete the desktop image, title, subtitle, CTA label, and CTA destination before publishing.',
        },
        400
      );
    }

    const [banner] = await db
      .update(hero_banners)
      .set({
        is_active: activating,
      })
      .where(eq(hero_banners.id, id))
      .returning();

    return c.json({ banner });
  } catch (error) {
    console.error('Error toggling hero banner:', error);
    return c.json({ error: 'Failed to toggle hero banner' }, 500);
  }
});

export default app;
