import { Hono } from 'hono';
import { verifyAdmin } from '../../middleware/auth';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../../db/client';
import { wholesale_tiers } from '../../db/schema';
import { eq, asc } from 'drizzle-orm';

const app = new Hono();

app.use('*', verifyAdmin);

const createTierSchema = z.object({
  name: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9_-]+$/),
  discount_percent: z.number().min(0).max(100),
  min_order_value: z.number().min(0).default(0),
  min_order_quantity: z.number().min(0).default(0),
  default_moq: z.number().min(1).default(1),
  payment_terms: z.enum(['net_30', 'net_45', 'net_60']).default('net_30'),
  description: z.string().optional(),
  color: z.string().default('#3B82F6'),
  active: z.boolean().default(true),
  priority: z.number().default(0),
});

const updateTierSchema = createTierSchema.partial();

// GET /admin/tiers/stats/overview — MUST be before /:id
app.get('/stats/overview', async (c) => {
  try {
    const { customers, orders } = await import('../../db/schema');
    const { sql } = await import('drizzle-orm');

    const tiers = await db.select().from(wholesale_tiers);

    const stats = await Promise.all(
      tiers.map(async (tier) => {
        const [customerCount] = await db
          .select({ count: sql<number>`count(*)` })
          .from(customers)
          .where(sql`${customers.metadata}->>'discount_tier' = ${tier.slug}`);

        const [orderCount] = await db
          .select({ count: sql<number>`count(*)` })
          .from(orders)
          .where(sql`${orders.metadata}->>'wholesale_tier' = ${tier.slug}`);

        return {
          tier: tier.name,
          slug: tier.slug,
          customerCount: Number(customerCount?.count) || 0,
          orderCount: Number(orderCount?.count) || 0,
          discountPercent: tier.discount_percent,
        };
      })
    );

    return c.json({ stats });
  } catch (error: any) {
    console.error('Error fetching tier stats:', error);
    return c.json({ error: 'Failed to fetch tier stats' }, 500);
  }
});

// GET /admin/tiers
app.get('/', async (c) => {
  try {
    const { active } = c.req.query();

    let query = db.select().from(wholesale_tiers);

    if (active === 'true') {
      query = query.where(eq(wholesale_tiers.active, true));
    }

    const tiers = await query.orderBy(asc(wholesale_tiers.priority));

    return c.json({ tiers });
  } catch (error: any) {
    console.error('Error fetching wholesale tiers:', error);
    return c.json({ error: 'Failed to fetch tiers' }, 500);
  }
});

// GET /admin/tiers/:id
app.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();

    const [tier] = await db
      .select()
      .from(wholesale_tiers)
      .where(eq(wholesale_tiers.id, id))
      .limit(1);

    if (!tier) {
      return c.json({ error: 'Tier not found' }, 404);
    }

    return c.json({ tier });
  } catch (error: any) {
    console.error('Error fetching wholesale tier:', error);
    return c.json({ error: 'Failed to fetch tier' }, 500);
  }
});

// POST /admin/tiers
app.post('/', zValidator('json', createTierSchema), async (c) => {
  try {
    const data = c.req.valid('json');

    const [existing] = await db
      .select()
      .from(wholesale_tiers)
      .where(eq(wholesale_tiers.slug, data.slug))
      .limit(1);

    if (existing) {
      return c.json({ error: 'Tier with this slug already exists' }, 400);
    }

    const [tier] = await db.insert(wholesale_tiers).values(data).returning();

    return c.json({ tier }, 201);
  } catch (error: any) {
    console.error('Error creating wholesale tier:', error);
    return c.json({ error: 'Failed to create tier' }, 500);
  }
});

// PATCH /admin/tiers/:id
app.patch('/:id', zValidator('json', updateTierSchema), async (c) => {
  try {
    const { id } = c.req.param();
    const data = c.req.valid('json');

    const [existing] = await db
      .select()
      .from(wholesale_tiers)
      .where(eq(wholesale_tiers.id, id))
      .limit(1);

    if (!existing) {
      return c.json({ error: 'Tier not found' }, 404);
    }

    if (data.slug && data.slug !== existing.slug) {
      const [slugExists] = await db
        .select()
        .from(wholesale_tiers)
        .where(eq(wholesale_tiers.slug, data.slug))
        .limit(1);

      if (slugExists) {
        return c.json({ error: 'Tier with this slug already exists' }, 400);
      }
    }

    const [tier] = await db
      .update(wholesale_tiers)
      .set({ ...data, updated_at: new Date() })
      .where(eq(wholesale_tiers.id, id))
      .returning();

    return c.json({ tier });
  } catch (error: any) {
    console.error('Error updating wholesale tier:', error);
    return c.json({ error: 'Failed to update tier' }, 500);
  }
});

// DELETE /admin/tiers/:id
app.delete('/:id', async (c) => {
  try {
    const { id } = c.req.param();

    const [existing] = await db
      .select()
      .from(wholesale_tiers)
      .where(eq(wholesale_tiers.id, id))
      .limit(1);

    if (!existing) {
      return c.json({ error: 'Tier not found' }, 404);
    }

    await db.delete(wholesale_tiers).where(eq(wholesale_tiers.id, id));

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting wholesale tier:', error);
    return c.json({ error: 'Failed to delete tier' }, 500);
  }
});

export default app;
