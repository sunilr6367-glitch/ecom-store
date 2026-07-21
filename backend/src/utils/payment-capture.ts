import { and, eq, sql } from 'drizzle-orm';
import { trackMetaServerEvent } from './meta-capi';

import { db } from '../db';
import { orders } from '../db/schema';

export async function finalizeCapturedPayment(
  orderId: string,
  metadataPatch: Record<string, unknown>
) {
  const [existingOrder] = await db
    .select({ payment_status: orders.payment_status })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (existingOrder?.payment_status === 'captured') {
    console.warn(`[Payment Capture] Order ${orderId} already finalized, skipping`);
    return true;
  }
  const [captured] = await db
    .update(orders)
    .set({
      payment_status: 'captured',
      status: 'processing',
      metadata: sql`COALESCE(${orders.metadata}, '{}'::jsonb) || ${JSON.stringify(metadataPatch)}::jsonb`,
      updated_at: new Date(),
    })
    .where(
      and(
        eq(orders.id, orderId),
        sql`COALESCE(${orders.metadata}->>'inventory_reservation_released_at', '') = ''`
      )
    )
    .returning({ id: orders.id });

  if (captured) {
    // Fire-and-forget Meta Conversions API Purchase Event
    triggerMetaPurchase(orderId).catch((err) =>
      console.error('[Meta CAPI] Purchase tracking error:', err)
    );
    return true;
  }

  await db
    .update(orders)
    .set({
      payment_status: 'payment_review',
      metadata: sql`COALESCE(${orders.metadata}, '{}'::jsonb) || ${JSON.stringify({
        ...metadataPatch,
        payment_review_reason: 'payment_captured_after_inventory_release',
      })}::jsonb`,
      updated_at: new Date(),
    })
    .where(eq(orders.id, orderId));

  return false;
}

async function triggerMetaPurchase(orderId: string) {
  try {
    const orderDetails = (await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      with: {
        customer: true,
      },
    } as any)) as any;

    if (!orderDetails) return;

    await trackMetaServerEvent(
      'Purchase',
      orderId,
      {
        email: orderDetails.customer?.email || orderDetails.email,
        phone: orderDetails.customer?.phone,
      },
      {
        value: Number(orderDetails.total) / 100,
        currency: orderDetails.currency_code,
        orderId: orderDetails.display_id?.toString() || orderId,
      }
    );
  } catch (err) {
    console.error('[Meta CAPI] Failed to trigger purchase event query:', err);
  }
}
