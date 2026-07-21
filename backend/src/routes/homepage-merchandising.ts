import { Hono } from 'hono';
import { and, asc, eq } from 'drizzle-orm';
import { db } from '../db/client';
import { homepage_merchandising_slots } from '../db/schema';
import { isStorefrontHref } from '../utils/media-url';

const app = new Hono();

app.get('/', async (c) => {
  try {
    const slot = c.req.query('slot');
    const rows = await db
      .select()
      .from(homepage_merchandising_slots)
      .where(
        slot
          ? and(
              eq(homepage_merchandising_slots.is_active, true),
              eq(homepage_merchandising_slots.slot_key, slot)
            )
          : eq(homepage_merchandising_slots.is_active, true)
      )
      .orderBy(
        asc(homepage_merchandising_slots.slot_key),
        asc(homepage_merchandising_slots.sort_order),
        asc(homepage_merchandising_slots.created_at)
      );

    return c.json({
      slots: rows.filter((row) => !row.link_url || isStorefrontHref(row.link_url)),
    });
  } catch (error) {
    console.error('Error fetching homepage merchandising slots:', error);
    return c.json({ error: 'Failed to fetch homepage merchandising slots' }, 500);
  }
});

export default app;
