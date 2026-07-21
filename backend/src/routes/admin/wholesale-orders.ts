import { Hono } from 'hono';
import { verifyAdmin } from '../../middleware/auth';
import { db } from '../../db/client';
import { orders, line_items, customers, addresses } from '../../db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

const app = new Hono();

app.use('*', verifyAdmin);

// Get all wholesale orders
app.get('/orders', async (c) => {
  try {
    const { status, page = '1', limit = '20' } = c.req.query();

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);
    const offset = (pageNum - 1) * limitNum;

    // Build query with wholesale filter
    const whereConditions = [sql`${orders.metadata}->>'is_wholesale' = 'true'`];

    if (status && status !== 'all') {
      whereConditions.push(eq(orders.status, status));
    }

    const wholesaleOrders = await db
      .select({
        order: orders,
        customer: customers,
      })
      .from(orders)
      .leftJoin(customers, eq(orders.customer_id, customers.id))
      .where(and(...whereConditions))
      .orderBy(desc(orders.created_at))
      .limit(limitNum)
      .offset(offset);

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(and(...whereConditions));

    const total = Number(countResult?.count) || 0;

    return c.json({
      orders: wholesaleOrders.map(({ order, customer }) => ({
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        payment_status: order.payment_status,
        fulfillment_status: order.fulfillment_status,
        total: order.total,
        currency_code: order.currency_code,
        created_at: order.created_at,
        metadata: order.metadata,
        customer: customer
          ? {
              id: customer.id,
              email: customer.email,
              first_name: customer.first_name,
              last_name: customer.last_name,
              company_name: (customer.metadata as any)?.company_name,
            }
          : null,
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error('Error fetching wholesale orders:', error);
    return c.json({ error: 'Failed to fetch orders' }, 500);
  }
});

// Get wholesale order stats
app.get('/orders/stats', async (c) => {
  try {
    const [stats] = await db
      .select({
        total: sql<number>`count(*)`,
        pending: sql<number>`count(*) filter (where status = 'pending')`,
        processing: sql<number>`count(*) filter (where status = 'processing')`,
        completed: sql<number>`count(*) filter (where status = 'completed')`,
        total_value: sql<number>`sum(total) filter (where status in ('completed', 'delivered'))`,
      })
      .from(orders)
      .where(sql`${orders.metadata}->>'is_wholesale' = 'true'`);

    return c.json({
      total: Number(stats.total),
      pending: Number(stats.pending),
      processing: Number(stats.processing),
      completed: Number(stats.completed),
      total_value: Number(stats.total_value) || 0,
    });
  } catch (error: any) {
    console.error('Error fetching wholesale order stats:', error);
    return c.json({ error: 'Failed to fetch stats' }, 500);
  }
});

// Get single wholesale order
app.get('/orders/:id', async (c) => {
  try {
    const { id } = c.req.param();

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);

    if (!order) {
      return c.json({ error: 'Order not found' }, 404);
    }

    // Get customer
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, order.customer_id || ''))
      .limit(1);

    // Get line items
    const items = await db
      .select()
      .from(line_items)
      .where(eq(line_items.order_id, id));

    // Get shipping address
    let shippingAddress = null;
    if (order.shipping_address_id) {
      const [address] = await db
        .select()
        .from(addresses)
        .where(eq(addresses.id, order.shipping_address_id))
        .limit(1);
      shippingAddress = address;
    }

    return c.json({
      order: {
        ...order,
        customer: customer
          ? {
              id: customer.id,
              email: customer.email,
              first_name: customer.first_name,
              last_name: customer.last_name,
              company_name: (customer.metadata as any)?.company_name,
              wholesale_tier: (customer.metadata as any)?.discount_tier,
            }
          : null,
        items,
        shipping_address: shippingAddress,
      },
    });
  } catch (error: any) {
    console.error('Error fetching wholesale order:', error);
    return c.json({ error: 'Failed to fetch order' }, 500);
  }
});

// Update wholesale order status
app.patch('/orders/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const { status, payment_status, fulfillment_status, admin_notes } =
      await c.req.json();

    const updateData: any = {
      updated_at: new Date(),
    };

    if (status) updateData.status = status;
    if (payment_status) updateData.payment_status = payment_status;
    if (fulfillment_status) updateData.fulfillment_status = fulfillment_status;
    if (admin_notes) {
      const [existing] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, id))
        .limit(1);

      if (existing) {
        const metadata = (existing.metadata as Record<string, any>) || {};
        updateData.metadata = {
          ...metadata,
          admin_notes,
        };
      }
    }

    const [updated] = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, id))
      .returning();

    if (!updated) {
      return c.json({ error: 'Order not found' }, 404);
    }

    return c.json({ order: updated });
  } catch (error: any) {
    console.error('Error updating wholesale order:', error);
    return c.json({ error: 'Failed to update order' }, 500);
  }
});

export default app;
