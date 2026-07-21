import { Hono, type Context } from 'hono';
import { z } from 'zod';
import { asc, eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { homepage_categories } from '../../db/schema';
import { verifyAdminOrMcpService } from '../../middleware/auth';
import { uploadImageToCloudinary } from '../../utils/cloudinary';

const app = new Hono();

app.use('*', verifyAdminOrMcpService);

const homepageCategoryFieldsSchema = z.object({
  category_id: z.string().uuid().nullable(),
  name: z.string().trim().min(1).max(255),
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

async function parseHomepageCategoryForm(
  c: Context,
  defaults?: Partial<z.infer<typeof homepageCategoryFieldsSchema>>
) {
  const body = await c.req.parseBody();
  const image = body.image || body.file;
  const imageFile = image instanceof File ? image : undefined;

  const fields = homepageCategoryFieldsSchema.parse({
    category_id:
      typeof body.category_id === 'string' && body.category_id.trim()
        ? body.category_id.trim()
        : null,
    name: normalizeRequiredString(body.name),
    link_url: normalizeRequiredString(body.link_url),
    is_active: parseBoolean(body.is_active, defaults?.is_active ?? true),
    sort_order: parseSortOrder(body.sort_order, defaults?.sort_order ?? 0),
  });

  return {
    fields,
    imageFile,
  };
}

app.get('/', async (c) => {
  try {
    const items = await db
      .select()
      .from(homepage_categories)
      .orderBy(
        asc(homepage_categories.sort_order),
        asc(homepage_categories.created_at)
      );

    return c.json({ categories: items });
  } catch (error) {
    console.error('Error fetching homepage categories:', error);
    return c.json({ error: 'Failed to fetch homepage categories' }, 500);
  }
});

app.post('/', async (c) => {
  try {
    const { fields, imageFile } = await parseHomepageCategoryForm(c);

    if (!imageFile) {
      return c.json({ error: 'Image is required' }, 400);
    }

    if (!isAcceptedImage(imageFile)) {
      return c.json({ error: 'Image must be JPG, PNG, or WEBP format' }, 400);
    }

    const upload = await uploadImageToCloudinary(imageFile, {
      folder: 'odhvica/homepage-categories',
    });

    const [category] = await db
      .insert(homepage_categories)
      .values({
        ...fields,
        image_url: upload.secureUrl,
      })
      .returning();

    return c.json({ category }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json(
        {
          error: 'Invalid homepage category data',
          details: error.flatten(),
        },
        400
      );
    }

    console.error('Error creating homepage category:', error);
    return c.json({ error: 'Failed to create homepage category' }, 500);
  }
});

app.put('/:id', async (c) => {
  try {
    const { id } = c.req.param();

    const [existingCategory] = await db
      .select()
      .from(homepage_categories)
      .where(eq(homepage_categories.id, id))
      .limit(1);

    if (!existingCategory) {
      return c.json({ error: 'Homepage category not found' }, 404);
    }

    const { fields, imageFile } = await parseHomepageCategoryForm(c, {
      is_active: existingCategory.is_active ?? true,
      sort_order: existingCategory.sort_order ?? 0,
    });

    let imageUrl = existingCategory.image_url;

    if (imageFile) {
      if (!isAcceptedImage(imageFile)) {
        return c.json({ error: 'Image must be JPG, PNG, or WEBP format' }, 400);
      }

      const upload = await uploadImageToCloudinary(imageFile, {
        folder: 'odhvica/homepage-categories',
      });
      imageUrl = upload.secureUrl;
    }

    const [category] = await db
      .update(homepage_categories)
      .set({
        ...fields,
        image_url: imageUrl,
      })
      .where(eq(homepage_categories.id, id))
      .returning();

    return c.json({ category });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json(
        {
          error: 'Invalid homepage category data',
          details: error.flatten(),
        },
        400
      );
    }

    console.error('Error updating homepage category:', error);
    return c.json({ error: 'Failed to update homepage category' }, 500);
  }
});

app.delete('/:id', async (c) => {
  try {
    const { id } = c.req.param();

    const [existingCategory] = await db
      .select()
      .from(homepage_categories)
      .where(eq(homepage_categories.id, id))
      .limit(1);

    if (!existingCategory) {
      return c.json({ error: 'Homepage category not found' }, 404);
    }

    await db.delete(homepage_categories).where(eq(homepage_categories.id, id));

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting homepage category:', error);
    return c.json({ error: 'Failed to delete homepage category' }, 500);
  }
});

app.patch('/:id/toggle', async (c) => {
  try {
    const { id } = c.req.param();

    const [existingCategory] = await db
      .select()
      .from(homepage_categories)
      .where(eq(homepage_categories.id, id))
      .limit(1);

    if (!existingCategory) {
      return c.json({ error: 'Homepage category not found' }, 404);
    }

    const [category] = await db
      .update(homepage_categories)
      .set({
        is_active: !existingCategory.is_active,
      })
      .where(eq(homepage_categories.id, id))
      .returning();

    return c.json({ category });
  } catch (error) {
    console.error('Error toggling homepage category:', error);
    return c.json({ error: 'Failed to toggle homepage category' }, 500);
  }
});

export default app;
