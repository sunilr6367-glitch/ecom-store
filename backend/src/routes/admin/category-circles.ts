import { Hono, type Context } from 'hono';
import { z } from 'zod';
import { asc, eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { category_circles } from '../../db/schema';
import { verifyAdmin } from '../../middleware/auth';
import { uploadImageToCloudinary } from '../../utils/cloudinary';

const app = new Hono();

app.use('*', verifyAdmin);

const categoryCircleFieldsSchema = z.object({
  category_id: z.string().uuid().nullable(),
  label: z.string().trim().min(1).max(255),
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

async function parseCategoryCircleForm(
  c: Context,
  defaults?: Partial<z.infer<typeof categoryCircleFieldsSchema>>
) {
  const body = await c.req.parseBody();
  const image = body.image || body.file;
  const imageFile = image instanceof File ? image : undefined;

  const fields = categoryCircleFieldsSchema.parse({
    category_id:
      typeof body.category_id === 'string' && body.category_id.trim()
        ? body.category_id.trim()
        : null,
    label: normalizeRequiredString(body.label),
    link_url: normalizeRequiredString(body.link_url),
    is_active: parseBoolean(body.is_active, defaults?.is_active ?? true),
    sort_order: parseSortOrder(body.sort_order, defaults?.sort_order ?? 0),
  });

  return { fields, imageFile };
}

app.get('/', async (c) => {
  try {
    const circles = await db
      .select()
      .from(category_circles)
      .orderBy(
        asc(category_circles.sort_order),
        asc(category_circles.created_at)
      );

    return c.json({ circles });
  } catch (error) {
    console.error('Error fetching category circles:', error);
    return c.json({ error: 'Failed to fetch category circles' }, 500);
  }
});

app.post('/', async (c) => {
  try {
    const { fields, imageFile } = await parseCategoryCircleForm(c);

    if (!imageFile) {
      return c.json({ error: 'Image is required' }, 400);
    }

    if (!isAcceptedImage(imageFile)) {
      return c.json({ error: 'Image must be JPG, PNG, or WEBP format' }, 400);
    }

    const upload = await uploadImageToCloudinary(imageFile, {
      folder: 'odhvica/category-circles',
    });

    const [circle] = await db
      .insert(category_circles)
      .values({
        ...fields,
        image_url: upload.secureUrl,
      })
      .returning();

    return c.json({ circle }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json(
        {
          error: 'Invalid category circle data',
          details: error.flatten(),
        },
        400
      );
    }

    console.error('Error creating category circle:', error);
    return c.json({ error: 'Failed to create category circle' }, 500);
  }
});

app.put('/:id', async (c) => {
  try {
    const { id } = c.req.param();

    const [existingCircle] = await db
      .select()
      .from(category_circles)
      .where(eq(category_circles.id, id))
      .limit(1);

    if (!existingCircle) {
      return c.json({ error: 'Category circle not found' }, 404);
    }

    const { fields, imageFile } = await parseCategoryCircleForm(c, {
      is_active: existingCircle.is_active ?? true,
      sort_order: existingCircle.sort_order ?? 0,
    });

    let imageUrl = existingCircle.image_url;

    if (imageFile) {
      if (!isAcceptedImage(imageFile)) {
        return c.json({ error: 'Image must be JPG, PNG, or WEBP format' }, 400);
      }

      const upload = await uploadImageToCloudinary(imageFile, {
        folder: 'odhvica/category-circles',
      });
      imageUrl = upload.secureUrl;
    }

    const [circle] = await db
      .update(category_circles)
      .set({
        ...fields,
        image_url: imageUrl,
      })
      .where(eq(category_circles.id, id))
      .returning();

    return c.json({ circle });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json(
        {
          error: 'Invalid category circle data',
          details: error.flatten(),
        },
        400
      );
    }

    console.error('Error updating category circle:', error);
    return c.json({ error: 'Failed to update category circle' }, 500);
  }
});

app.delete('/:id', async (c) => {
  try {
    const { id } = c.req.param();

    const [existingCircle] = await db
      .select()
      .from(category_circles)
      .where(eq(category_circles.id, id))
      .limit(1);

    if (!existingCircle) {
      return c.json({ error: 'Category circle not found' }, 404);
    }

    await db.delete(category_circles).where(eq(category_circles.id, id));
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting category circle:', error);
    return c.json({ error: 'Failed to delete category circle' }, 500);
  }
});

app.patch('/:id/toggle', async (c) => {
  try {
    const { id } = c.req.param();

    const [existingCircle] = await db
      .select()
      .from(category_circles)
      .where(eq(category_circles.id, id))
      .limit(1);

    if (!existingCircle) {
      return c.json({ error: 'Category circle not found' }, 404);
    }

    const [circle] = await db
      .update(category_circles)
      .set({
        is_active: !existingCircle.is_active,
      })
      .where(eq(category_circles.id, id))
      .returning();

    return c.json({ circle });
  } catch (error) {
    console.error('Error toggling category circle:', error);
    return c.json({ error: 'Failed to toggle category circle' }, 500);
  }
});

export default app;
