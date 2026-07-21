import { and, eq, inArray, sql } from 'drizzle-orm';

import { db } from '../db/client';
import { line_items, orders, product_variants } from '../db/schema';

const DEFAULT_RESERVATION_TTL_MS = 30 * 60 * 1000;

export type InventoryReservationMetadata = Record<string, unknown> & {
  inventory_reservation_expires_at?: string;
  inventory_reservation_released_at?: string;
  inventory_reservation_release_reason?: string;
};

export function getInventoryReservationTtlMs() {
  const configured = Number(process.env.INVENTORY_RESERVATION_TTL_MS);
  return Number.isFinite(configured) && configured >= 60_000
    ? configured
    : DEFAULT_RESERVATION_TTL_MS;
}

export function buildInventoryReservationMetadata(now = new Date()) {
  return {
    inventory_reservation_expires_at: new Date(
      now.getTime() + getInventoryReservationTtlMs()
    ).toISOString(),
  };
}

export function isInventoryReservationActive(
  metadata: InventoryReservationMetadata | null | undefined,
  now = new Date()
) {
  if (!metadata || metadata.inventory_reservation_released_at) return false;

  const expiresAt =
    typeof metadata.inventory_reservation_expires_at === 'string'
      ? new Date(metadata.inventory_reservation_expires_at)
      : null;

  return Boolean(
    expiresAt &&
      Number.isFinite(expiresAt.getTime()) &&
      expiresAt.getTime() > now.getTime()
  );
}

export function isInventoryReservationReleased(
  metadata: InventoryReservationMetadata | null | undefined
) {
  return Boolean(metadata?.inventory_reservation_released_at);
}

export async function releaseInventoryReservation(
  orderId: string,
  reason: string
) {
  return db.transaction(async (tx) => {
    const claim = await tx.execute(sql`
      UPDATE orders
      SET
        metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
          'inventory_reservation_released_at', NOW()::text,
          'inventory_reservation_release_reason', ${reason}
        ),
        status = CASE
          WHEN payment_status = 'captured' THEN status
          ELSE 'cancelled'
        END,
        payment_status = CASE
          WHEN payment_status = 'awaiting' THEN 'failed'
          ELSE payment_status
        END,
        updated_at = NOW()
      WHERE id = ${orderId}
        AND payment_status <> 'captured'
        AND COALESCE(metadata->>'inventory_reservation_released_at', '') = ''
      RETURNING id
    `);

    if (claim.length === 0) {
      return false;
    }

    const items = await tx
      .select({
        variantId: line_items.variant_id,
        quantity: line_items.quantity,
      })
      .from(line_items)
      .where(eq(line_items.order_id, orderId));

    for (const item of items) {
      if (!item.variantId) continue;
      await tx
        .update(product_variants)
        .set({
          inventory_quantity: sql`COALESCE(${product_variants.inventory_quantity}, 0) + ${item.quantity}`,
          updated_at: new Date(),
        })
        .where(eq(product_variants.id, item.variantId));
    }

    return true;
  });
}

export async function releaseExpiredInventoryReservations(now = new Date()) {
  const expired = await db
    .select({ id: orders.id })
    .from(orders)
    .where(
      and(
        inArray(orders.payment_status, ['awaiting', 'failed']),
        sql`${orders.metadata}->>'inventory_reservation_expires_at' IS NOT NULL`,
        sql`(${orders.metadata}->>'inventory_reservation_expires_at')::timestamptz <= ${now}`,
        sql`COALESCE(${orders.metadata}->>'inventory_reservation_released_at', '') = ''`
      )
    );

  let released = 0;
  for (const order of expired) {
    if (await releaseInventoryReservation(order.id, 'reservation_expired')) {
      released += 1;
    }
  }

  return { checked: expired.length, released };
}
