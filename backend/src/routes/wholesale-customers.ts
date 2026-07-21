import { Hono } from 'hono';
import { db } from '../db';
import { customers } from '../db/schema';
import { eq, desc, like, sql, and } from 'drizzle-orm';
import { verifyAdmin } from '../middleware/auth';

const app = new Hono();

app.use('*', verifyAdmin);

app.get('/', async (c) => {
  try {
    const { search, page = '1', limit = '20', tier } = c.req.query();

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];

    if (search) {
      const sanitizedSearch = search.trim();
      if (sanitizedSearch) {
        const pattern = `%${sanitizedSearch}%`;
        conditions.push(like(customers.email, pattern));
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // PERF-002: Filter wholesale customers in SQL, not in memory
    const wholesaleCondition = sql`${customers.metadata}->>'wholesale_customer' = 'true'`;
    const tierCondition = tier && tier !== 'all'
      ? sql`${customers.metadata}->>'discount_tier' = ${tier}`
      : undefined;

    const allConditions = [wholesaleCondition, ...(conditions ?? []), ...(tierCondition ? [tierCondition] : [])];
    const finalWhere = and(...allConditions);

    const [{ count: totalCount }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(customers)
      .where(finalWhere);

    const count = Number(totalCount);
    const totalPages = Math.ceil(count / limitNum);

    const paginatedCustomers = await db
      .select()
      .from(customers)
      .where(finalWhere)
      .orderBy(desc(customers.created_at))
      .limit(limitNum)
      .offset(offset);

    return c.json({
      customers: paginatedCustomers.map((customer) => {
        const metadata = customer.metadata as Record<string, any> | null;
        return {
          id: customer.id,
          email: customer.email,
          first_name: customer.first_name,
          last_name: customer.last_name,
          phone: customer.phone,
          company_name: metadata?.company_name || null,
          discount_tier: metadata?.discount_tier || null,
          wholesale_inquiry_id: metadata?.wholesale_inquiry_id || null,
          created_at: customer.created_at,
          email_verified: customer.email_verified,
        };
      }),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count,
        pages: totalPages,
      },
    });
  } catch (error: any) {
    console.error('Error fetching wholesale customers:', error);
    return c.json({ error: 'Failed to fetch customers' }, 500);
  }
});

app.get('/stats', async (c) => {
  try {
    // PERF-002: Use SQL aggregation instead of fetching all customers into memory
    const wholesaleCondition = sql`${customers.metadata}->>'wholesale_customer' = 'true'`;

    const rows = await db
      .select({
        tier: sql<string>`${customers.metadata}->>'discount_tier'`,
        count: sql<number>`count(*)`,
      })
      .from(customers)
      .where(wholesaleCondition)
      .groupBy(sql`${customers.metadata}->>'discount_tier'`);

    const tiers: Record<string, number> = { starter: 0, growth: 0, enterprise: 0 };
    let total = 0;

    for (const row of rows) {
      const n = Number(row.count);
      total += n;
      if (row.tier && tiers[row.tier] !== undefined) {
        tiers[row.tier] = n;
      }
    }

    return c.json({
      total,
      starter: tiers.starter,
      growth: tiers.growth,
      enterprise: tiers.enterprise,
    });
  } catch (error: any) {
    console.error('Error fetching wholesale customer stats:', error);
    return c.json({ error: 'Failed to fetch stats' }, 500);
  }
});

app.patch('/:id/tier', async (c) => {
  try {
    const { id } = c.req.param();
    const { discount_tier } = await c.req.json().catch(() => ({}));

    if (!discount_tier) {
      return c.json({ error: 'Discount tier is required' }, 400);
    }

    const [existing] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, id))
      .limit(1);

    if (!existing) {
      return c.json({ error: 'Customer not found' }, 404);
    }

    const metadata = (existing.metadata as Record<string, any>) || {};

    const [updated] = await db
      .update(customers)
      .set({
        metadata: {
          ...metadata,
          discount_tier,
        },
        updated_at: new Date(),
      })
      .where(eq(customers.id, id))
      .returning();

    return c.json({ customer: updated });
  } catch (error: any) {
    console.error('Error updating customer tier:', error);
    return c.json({ error: 'Failed to update tier' }, 500);
  }
});

export default app;
