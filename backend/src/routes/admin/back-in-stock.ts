import { Hono } from 'hono';
import { db } from '../../db/client';
import { back_in_stock_subscriptions, products } from '../../db/schema';
import { verifyAdmin } from '../../middleware/auth';
import { eq, desc, and, sql } from 'drizzle-orm';

const bisRouter = new Hono();

// GET /admin/back-in-stock — List all subscriptions (admin only)
bisRouter.get('/', verifyAdmin, async (c) => {
  try {
    const { notified, product_id } = c.req.query();

    const conditions = [];
    if (notified === 'false') conditions.push(eq(back_in_stock_subscriptions.notified, false));
    if (notified === 'true') conditions.push(eq(back_in_stock_subscriptions.notified, true));
    if (product_id) conditions.push(eq(back_in_stock_subscriptions.product_id, product_id));

    const subscriptions = await db
      .select({
        id: back_in_stock_subscriptions.id,
        email: back_in_stock_subscriptions.email,
        product_id: back_in_stock_subscriptions.product_id,
        variant_id: back_in_stock_subscriptions.variant_id,
        notified: back_in_stock_subscriptions.notified,
        notified_at: back_in_stock_subscriptions.notified_at,
        created_at: back_in_stock_subscriptions.created_at,
        product_title: products.title,
        product_handle: products.handle,
        product_thumbnail: products.thumbnail,
      })
      .from(back_in_stock_subscriptions)
      .leftJoin(products, eq(back_in_stock_subscriptions.product_id, products.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(back_in_stock_subscriptions.created_at))
      .limit(500);

    // Stats
    const [stats] = await db
      .select({
        total: sql<number>`count(*)`,
        pending: sql<number>`count(*) filter (where notified = false)`,
        notified: sql<number>`count(*) filter (where notified = true)`,
      })
      .from(back_in_stock_subscriptions);

    return c.json({
      subscriptions,
      stats: {
        total: Number(stats?.total || 0),
        pending: Number(stats?.pending || 0),
        notified: Number(stats?.notified || 0),
      },
    });
  } catch (error: any) {
    console.error('[BIS Admin] GET error:', error.message);
    return c.json({ error: 'Failed to fetch subscriptions' }, 500);
  }
});

// DELETE /admin/back-in-stock/:id — Remove a subscription
bisRouter.delete('/:id', verifyAdmin, async (c) => {
  try {
    const id = c.req.param('id');
    await db
      .delete(back_in_stock_subscriptions)
      .where(eq(back_in_stock_subscriptions.id, id));
    return c.json({ success: true });
  } catch (error: any) {
    console.error('[BIS Admin] DELETE error:', error.message);
    return c.json({ error: 'Failed to delete subscription' }, 500);
  }
});

export default bisRouter;
