import { Hono } from 'hono';
import { z } from 'zod';
import { asc, eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { trust_items } from '../../db/schema';
import { verifyAdminOrMcpService } from '../../middleware/auth';

const app = new Hono();

app.use('*', verifyAdminOrMcpService);

const trustItemSchema = z.object({
  label: z.string().trim().min(1).max(255),
  sub: z.string().trim().min(1).max(255),
  icon: z.string().trim().max(10).default('✦'),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().min(0).default(0),
});

function parseBoolean(value: unknown, defaultValue: boolean): boolean {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return defaultValue;
}

function parseSortOrder(value: unknown, defaultValue: number): number {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

app.get('/', async (c) => {
  try {
    const items = await db
      .select()
      .from(trust_items)
      .orderBy(asc(trust_items.sort_order), asc(trust_items.created_at));
    return c.json({ items });
  } catch (error) {
    console.error('Error fetching trust items:', error);
    return c.json({ error: 'Failed to fetch trust items' }, 500);
  }
});

app.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const fields = trustItemSchema.parse({
      label: body.label,
      sub: body.sub,
      icon: body.icon || '✦',
      is_active: parseBoolean(body.is_active, true),
      sort_order: parseSortOrder(body.sort_order, 0),
    });

    const [item] = await db.insert(trust_items).values(fields).returning();
    return c.json({ item }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Invalid trust item data', details: error.flatten() }, 400);
    }
    console.error('Error creating trust item:', error);
    return c.json({ error: 'Failed to create trust item' }, 500);
  }
});

app.put('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const [existing] = await db.select().from(trust_items).where(eq(trust_items.id, id)).limit(1);
    if (!existing) return c.json({ error: 'Trust item not found' }, 404);

    const body = await c.req.json();
    const fields = trustItemSchema.parse({
      label: body.label ?? existing.label,
      sub: body.sub ?? existing.sub,
      icon: body.icon ?? existing.icon,
      is_active: parseBoolean(body.is_active, existing.is_active ?? true),
      sort_order: parseSortOrder(body.sort_order, existing.sort_order ?? 0),
    });

    const [item] = await db.update(trust_items).set(fields).where(eq(trust_items.id, id)).returning();
    return c.json({ item });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Invalid trust item data', details: error.flatten() }, 400);
    }
    console.error('Error updating trust item:', error);
    return c.json({ error: 'Failed to update trust item' }, 500);
  }
});

app.delete('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const [existing] = await db.select().from(trust_items).where(eq(trust_items.id, id)).limit(1);
    if (!existing) return c.json({ error: 'Trust item not found' }, 404);
    await db.delete(trust_items).where(eq(trust_items.id, id));
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting trust item:', error);
    return c.json({ error: 'Failed to delete trust item' }, 500);
  }
});

app.patch('/:id/toggle', async (c) => {
  try {
    const { id } = c.req.param();
    const [existing] = await db.select().from(trust_items).where(eq(trust_items.id, id)).limit(1);
    if (!existing) return c.json({ error: 'Trust item not found' }, 404);
    const [item] = await db
      .update(trust_items)
      .set({ is_active: !existing.is_active })
      .where(eq(trust_items.id, id))
      .returning();
    return c.json({ item });
  } catch (error) {
    console.error('Error toggling trust item:', error);
    return c.json({ error: 'Failed to toggle trust item' }, 500);
  }
});

export default app;
