import { Hono } from 'hono';
import { asc, eq } from 'drizzle-orm';
import { db } from '../db/client';
import { trust_items } from '../db/schema';

const app = new Hono();

app.get('/', async (c) => {
  try {
    const items = await db
      .select()
      .from(trust_items)
      .where(eq(trust_items.is_active, true))
      .orderBy(asc(trust_items.sort_order), asc(trust_items.created_at));
    return c.json({ items });
  } catch (error) {
    console.error('Error fetching trust items:', error);
    return c.json({ error: 'Failed to fetch trust items' }, 500);
  }
});

export default app;
