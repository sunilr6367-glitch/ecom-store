import { Hono, type Context } from 'hono';
import { asc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../db/client';
import { homepage_social_posts } from '../../db/schema';
import { verifyAdminOrMcpService } from '../../middleware/auth';
import { uploadImageToCloudinary } from '../../utils/cloudinary';
import { isStorefrontHref } from '../../utils/media-url';
import { triggerStorefrontRevalidation } from '../../utils/storefront-revalidate';

const app = new Hono();
app.use('*', verifyAdminOrMcpService);

const fieldsSchema = z.object({
  alt_text: z.string().trim().min(1).max(255),
  caption: z.string().trim().max(1000).nullable(),
  destination_url: z
    .string()
    .trim()
    .min(1)
    .max(500)
    .refine(isStorefrontHref, 'Destination must be a local path or HTTPS URL'),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().min(0).default(0),
});

function stringValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function optionalString(value: unknown) {
  const normalized = stringValue(value);
  return normalized || null;
}

function booleanValue(value: unknown, fallback: boolean) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return fallback;
}

function numberValue(value: unknown, fallback: number) {
  const parsed = Number.parseInt(stringValue(value), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function validImage(file: File) {
  return ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type);
}

async function parseForm(
  c: Context,
  defaults?: { is_active: boolean; sort_order: number }
) {
  const body = await c.req.parseBody();
  const imageFile = body.image instanceof File ? body.image : undefined;
  const fields = fieldsSchema.parse({
    alt_text: stringValue(body.alt_text),
    caption: optionalString(body.caption),
    destination_url: stringValue(body.destination_url),
    is_active: booleanValue(body.is_active, defaults?.is_active ?? true),
    sort_order: numberValue(body.sort_order, defaults?.sort_order ?? 0),
  });
  return { fields, imageFile };
}

async function revalidateHomepage() {
  await triggerStorefrontRevalidation({ paths: ['/'], tags: ['homepage'] });
}

app.get('/', async (c) => {
  const posts = await db
    .select()
    .from(homepage_social_posts)
    .orderBy(
      asc(homepage_social_posts.sort_order),
      asc(homepage_social_posts.created_at)
    );
  return c.json({ posts });
});

app.post('/', async (c) => {
  try {
    const { fields, imageFile } = await parseForm(c);
    if (!imageFile) return c.json({ error: 'Image is required' }, 400);
    if (!validImage(imageFile)) {
      return c.json({ error: 'Image must be JPG, PNG, or WEBP' }, 400);
    }
    const upload = await uploadImageToCloudinary(imageFile, {
      folder: 'odhvica/homepage-social',
    });
    const [post] = await db
      .insert(homepage_social_posts)
      .values({ ...fields, image_url: upload.secureUrl })
      .returning();
    await revalidateHomepage();
    return c.json({ post }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Invalid social post', details: error.flatten() }, 400);
    }
    console.error('Error creating homepage social post:', error);
    return c.json({ error: 'Failed to create social post' }, 500);
  }
});

app.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const [existing] = await db
      .select()
      .from(homepage_social_posts)
      .where(eq(homepage_social_posts.id, id))
      .limit(1);
    if (!existing) return c.json({ error: 'Social post not found' }, 404);

    const { fields, imageFile } = await parseForm(c, {
      is_active: existing.is_active,
      sort_order: existing.sort_order,
    });
    let imageUrl = existing.image_url;
    if (imageFile) {
      if (!validImage(imageFile)) {
        return c.json({ error: 'Image must be JPG, PNG, or WEBP' }, 400);
      }
      imageUrl = (
        await uploadImageToCloudinary(imageFile, {
          folder: 'odhvica/homepage-social',
        })
      ).secureUrl;
    }
    const [post] = await db
      .update(homepage_social_posts)
      .set({ ...fields, image_url: imageUrl, updated_at: new Date() })
      .where(eq(homepage_social_posts.id, id))
      .returning();
    await revalidateHomepage();
    return c.json({ post });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Invalid social post', details: error.flatten() }, 400);
    }
    console.error('Error updating homepage social post:', error);
    return c.json({ error: 'Failed to update social post' }, 500);
  }
});

app.patch('/:id/toggle', async (c) => {
  const id = c.req.param('id');
  const [existing] = await db
    .select()
    .from(homepage_social_posts)
    .where(eq(homepage_social_posts.id, id))
    .limit(1);
  if (!existing) return c.json({ error: 'Social post not found' }, 404);
  const [post] = await db
    .update(homepage_social_posts)
    .set({ is_active: !existing.is_active, updated_at: new Date() })
    .where(eq(homepage_social_posts.id, id))
    .returning();
  await revalidateHomepage();
  return c.json({ post });
});

app.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const [post] = await db
    .delete(homepage_social_posts)
    .where(eq(homepage_social_posts.id, id))
    .returning();
  if (!post) return c.json({ error: 'Social post not found' }, 404);
  await revalidateHomepage();
  return c.json({ success: true });
});

export default app;
