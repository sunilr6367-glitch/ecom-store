import { Hono } from 'hono';
import { verifyAdmin } from '../../middleware/auth';
import { z } from 'zod';
import { db } from '../../db/client';
import { bulk_discounts, products } from '../../db/schema';
import { eq, desc } from 'drizzle-orm';

const app = new Hono();

app.use('*', verifyAdmin);

// Validation schema
const bulkDiscountSchema = z.object({
  product_id: z.string().uuid().nullable().optional(),
  variant_id: z.string().uuid().nullable().optional(),
  min_quantity: z.number().int().min(1),
  discount_percent: z.number().int().min(1).max(100),
  description: z.string().nullable().optional(),
  active: z.boolean().default(true),
});

// GET /bulk-discounts — List all bulk discount rules
app.get('/', async (c) => {
  try {
    const discounts = await db
      .select({
        id: bulk_discounts.id,
        product_id: bulk_discounts.product_id,
        variant_id: bulk_discounts.variant_id,
        min_quantity: bulk_discounts.min_quantity,
        discount_percent: bulk_discounts.discount_percent,
        description: bulk_discounts.description,
        active: bulk_discounts.active,
        created_at: bulk_discounts.created_at,
        updated_at: bulk_discounts.updated_at,
        product_title: products.title,
      })
      .from(bulk_discounts)
      .leftJoin(products, eq(bulk_discounts.product_id, products.id))
      .orderBy(desc(bulk_discounts.created_at));

    return c.json({ bulk_discounts: discounts });
  } catch (error: any) {
    console.error('Error fetching bulk discounts:', error);
    return c.json({ error: 'Failed to fetch bulk discounts' }, 500);
  }
});

// POST /bulk-discounts — Create a new bulk discount rule
app.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const validated = bulkDiscountSchema.parse(body);

    // If product_id provided, verify product exists
    if (validated.product_id) {
      const [product] = await db
        .select({ id: products.id })
        .from(products)
        .where(eq(products.id, validated.product_id))
        .limit(1);

      if (!product) {
        return c.json({ error: 'Product not found' }, 400);
      }
    }

    const [discount] = await db
      .insert(bulk_discounts)
      .values({
        product_id: validated.product_id || null,
        variant_id: validated.variant_id || null,
        min_quantity: validated.min_quantity,
        discount_percent: validated.discount_percent,
        description: validated.description || null,
        active: validated.active,
      })
      .returning();

    return c.json({ bulk_discount: discount }, 201);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation failed', details: error.errors }, 400);
    }
    console.error('Error creating bulk discount:', error);
    return c.json({ error: 'Failed to create bulk discount' }, 500);
  }
});

// PUT /bulk-discounts/:id — Update an existing bulk discount rule
app.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const validated = bulkDiscountSchema.partial().parse(body);

    // Check if discount exists
    const [existing] = await db
      .select({ id: bulk_discounts.id })
      .from(bulk_discounts)
      .where(eq(bulk_discounts.id, id))
      .limit(1);

    if (!existing) {
      return c.json({ error: 'Bulk discount not found' }, 404);
    }

    const [updated] = await db
      .update(bulk_discounts)
      .set({
        ...validated,
        updated_at: new Date(),
      })
      .where(eq(bulk_discounts.id, id))
      .returning();

    return c.json({ bulk_discount: updated });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation failed', details: error.errors }, 400);
    }
    console.error('Error updating bulk discount:', error);
    return c.json({ error: 'Failed to update bulk discount' }, 500);
  }
});

// DELETE /bulk-discounts/:id — Delete a bulk discount rule
app.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');

    const [existing] = await db
      .select({ id: bulk_discounts.id })
      .from(bulk_discounts)
      .where(eq(bulk_discounts.id, id))
      .limit(1);

    if (!existing) {
      return c.json({ error: 'Bulk discount not found' }, 404);
    }

    await db.delete(bulk_discounts).where(eq(bulk_discounts.id, id));

    return c.json({
      success: true,
      message: 'Bulk discount deleted',
    });
  } catch (error: any) {
    console.error('Error deleting bulk discount:', error);
    return c.json({ error: 'Failed to delete bulk discount' }, 500);
  }
});

export default app;
