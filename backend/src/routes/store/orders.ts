import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq, and, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '../../db/client';
import { addresses, line_items, orders } from '../../db/schema';
import { successResponse } from '../../utils/api-response';
import { buildWorkflowSummary } from '../../utils/order-workflow';
import { logSecurityEvent, maskEmail } from '../../utils/security-events';

const shippingAddress = alias(addresses, 'shipping_address');
const storeOrdersRouter = new Hono();

const TrackOrderQuerySchema = z.object({
  order_number: z.string().min(1),
  email: z.string().email(),
});

storeOrdersRouter.get(
  '/track',
  zValidator('query', TrackOrderQuerySchema),
  async (c) => {
    const { order_number, email } = (c.req as any).valid('query');
    const numericDisplayId = Number(order_number.replaceAll(/[^0-9]/g, ''));

    if (!Number.isFinite(numericDisplayId)) {
      logSecurityEvent('warn', 'Invalid order tracking lookup', c, {
        order_number,
        email: maskEmail(email),
      });
      return c.json({ error: 'Invalid order number' }, 400);
    }

    const [order] = await db
      .select({
        id: orders.id,
        display_id: orders.display_id,
        status: orders.status,
        payment_status: orders.payment_status,
        fulfillment_status: orders.fulfillment_status,
        tracking_number: orders.tracking_number,
        tracking_link: orders.tracking_link,
        shipping_carrier: orders.shipping_carrier,
        created_at: orders.created_at,
        updated_at: orders.updated_at,
        metadata: orders.metadata,
        shipping_address: shippingAddress,
      })
      .from(orders)
      .leftJoin(shippingAddress, eq(orders.shipping_address_id, shippingAddress.id))
      .where(
        and(
          eq(orders.display_id, numericDisplayId),
          sql`lower(${orders.email}) = lower(${email})`
        )
      )
      .limit(1);

    if (!order) {
      logSecurityEvent('warn', 'Order tracking lookup not found', c, {
        order_number,
        email: maskEmail(email),
      });
      return c.json({ error: 'Order not found' }, 404);
    }

    const items = await db
      .select({
        id: line_items.id,
        title: line_items.title,
        quantity: line_items.quantity,
        price: line_items.unit_price,
      })
      .from(line_items)
      .where(eq(line_items.order_id, order.id));

    return successResponse(
      c,
      {
        ...order,
        status: buildWorkflowSummary(order).status,
        workflow: buildWorkflowSummary(order),
        items,
      },
      'Order tracking details retrieved successfully'
    );
  }
);

export default storeOrdersRouter;
