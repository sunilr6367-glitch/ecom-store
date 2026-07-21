import { db } from '../db/client';
import { line_items, orders, product_variants, order_status_history } from '../db/schema';
import { and, eq, sql } from 'drizzle-orm';

export async function releaseAbandonedOrderInventory() {
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  
  // 1. Find expired unpaid orders (ignoring those actively in payment gateways)
  const abandonedOrders = await db
    .select({ id: orders.id })
    .from(orders)
    .where(
      and(
        eq(orders.status, 'draft'),
        eq(orders.payment_status, 'unpaid'),
        sql`${orders.created_at} < ${thirtyMinutesAgo}`,
        sql`COALESCE(${orders.metadata}->>'razorpay_order_id', '') = ''`,
        sql`COALESCE(${orders.metadata}->>'paypal_order_id', '') = ''`
      )
    );

  let released = 0;
  
  // 2. Process each order in a transaction
  for (const order of abandonedOrders) {
    await db.transaction(async (tx) => {
      // Update order status
      await tx
        .update(orders)
        .set({
          status: 'cancelled',
          payment_status: 'failed',
          updated_at: new Date(),
        })
        .where(eq(orders.id, order.id));

      await tx.insert(order_status_history).values({
        order_id: order.id,
        from_status: 'draft',
        to_status: 'cancelled',
        changed_by: 'system',
        note: 'Auto-cancelled: payment not completed',
      });

      // Find and restore inventory for all items
      const items = await tx
        .select({ variantId: line_items.variant_id, quantity: line_items.quantity })
        .from(line_items)
        .where(eq(line_items.order_id, order.id));

      for (const item of items) {
        if (!item.variantId) continue;
        await tx
          .update(product_variants)
          .set({ inventory_quantity: sql`COALESCE(${product_variants.inventory_quantity}, 0) + ${item.quantity}` })
          .where(eq(product_variants.id, item.variantId));
      }
    });
    released++;
  }
  
  return { checked: abandonedOrders.length, released };
}
