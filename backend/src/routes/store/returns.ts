import { Hono } from 'hono';
import { z } from 'zod';
import { db } from '../../db/client';
import { returns, return_items, orders } from '../../db/schema';
import { eq, sql } from 'drizzle-orm';
import { verifyCustomer } from '../../middleware/customer-auth';
import { deriveWorkflowStatus } from '../../utils/order-workflow';
import {
  applyOrderDiscountToRefund,
  validateReturnItems,
} from '../../utils/return-validation';

const router = new Hono();

const ReturnSchema = z.object({
  order_id: z.string().uuid(),
  reason: z.string().min(10, 'Please describe your reason (min 10 chars)').max(1000),
  items: z.array(
    z.object({
      line_item_id: z.string().uuid(),
      quantity: z.number().int().min(1),
      restock: z.boolean().optional().default(true),
    })
  ).min(1, 'At least one item required'),
});

// POST /store/returns — Customer submits a return request
router.post('/', verifyCustomer, async (c) => {
  try {
    const user = c.get('customer') as { sub: string };
    const body = await c.req.json();
    const data = ReturnSchema.parse(body);

    // Verify order belongs to this customer
    const [order] = await db
      .select({
        id: orders.id,
        customer_id: orders.customer_id,
        status: orders.status,
        payment_status: orders.payment_status,
        fulfillment_status: orders.fulfillment_status,
        tracking_number: orders.tracking_number,
        metadata: orders.metadata,
        subtotal: orders.subtotal,
        discount_total: orders.discount_total,
      })
      .from(orders)
      .where(eq(orders.id, data.order_id))
      .limit(1);

    if (!order) {
      return c.json({ error: 'Order not found' }, 404);
    }

    // 🔒 SEC: Ensure order belongs to authenticated customer
    if (!order.customer_id || order.customer_id !== user.sub) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    // Allow returns once the order is in a delivered/completed state
    const workflowStatus = deriveWorkflowStatus(order);
    if (workflowStatus !== 'delivered' && order.status !== 'completed') {
      return c.json({ error: 'Returns can only be requested for delivered orders' }, 400);
    }

    const newReturn = await db.transaction(async (tx) => {
      await tx.execute(
        sql`SELECT id FROM orders WHERE id = ${data.order_id} FOR UPDATE`
      );

      const [existing] = await tx
        .select({ id: returns.id, status: returns.status })
        .from(returns)
        .where(eq(returns.order_id, data.order_id))
        .limit(1);

      if (existing) {
        throw new Error(
          `RETURN_EXISTS:A return request for this order already exists (status: ${existing.status})`
        );
      }

      const { maximumRefundAmount } = await validateReturnItems(
        tx,
        data.order_id,
        data.items
      );
      const refundAmount = applyOrderDiscountToRefund(
        maximumRefundAmount,
        Number(order.subtotal),
        Number(order.discount_total || 0)
      );

      const [created] = await tx
        .insert(returns)
        .values({
          order_id: data.order_id,
          customer_id: order.customer_id || null,
          reason: data.reason,
          status: 'pending',
          refund_amount: refundAmount,
        })
        .returning();

      await tx.insert(return_items).values(
        data.items.map((item) => ({
          return_id: created.id,
          line_item_id: item.line_item_id,
          quantity: item.quantity,
          restock: item.restock ?? true,
        }))
      );

      return created;
    });

    return c.json(
      {
        success: true,
        return_id: newReturn.id,
        message: 'Return request submitted successfully. Our team will review it within 2-3 business days.',
      },
      201
    );
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return c.json({ error: e.errors[0].message }, 400);
    }
    if (e.message?.startsWith('RETURN_EXISTS:')) {
      return c.json({ error: e.message.slice('RETURN_EXISTS:'.length) }, 409);
    }
    if (
      e.message?.includes('return items') ||
      e.message?.includes('Return quantity') ||
      e.message?.includes('Duplicate line')
    ) {
      return c.json({ error: e.message }, 400);
    }
    return c.json({ error: e.message || 'Internal server error' }, 500);
  }
});

// GET /store/returns — Customer views their return requests
router.get('/', verifyCustomer, async (c) => {
  try {
    const user = c.get('customer') as { sub: string };

    const customerReturns = await db
      .select()
      .from(returns)
      .where(eq(returns.customer_id, user.sub))
      .orderBy(returns.created_at);

    return c.json({ returns: customerReturns });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

export default router;
