import { and, eq, inArray } from 'drizzle-orm';

import { line_items } from '../db/schema';

type RequestedReturnItem = {
  line_item_id: string;
  quantity: number;
  restock?: boolean;
};

export async function validateReturnItems(
  executor: any,
  orderId: string,
  requestedItems: RequestedReturnItem[]
) {
  const ids = requestedItems.map((item) => item.line_item_id);
  if (new Set(ids).size !== ids.length) {
    throw new Error('Duplicate line items are not allowed');
  }

  const purchasedItems = await executor
    .select({
      id: line_items.id,
      quantity: line_items.quantity,
      unit_price: line_items.unit_price,
      variant_id: line_items.variant_id,
    })
    .from(line_items)
    .where(
      and(
        eq(line_items.order_id, orderId),
        inArray(line_items.id, ids)
      )
    );

  if (purchasedItems.length !== requestedItems.length) {
    throw new Error('One or more return items do not belong to this order');
  }

  const purchasedById = new Map<
    string,
    {
      id: string;
      quantity: number;
      unit_price: number;
      variant_id: string | null;
    }
  >(
    purchasedItems.map((item: any) => [item.id, item])
  );

  let maximumRefundAmount = 0;
  for (const requested of requestedItems) {
    const purchased = purchasedById.get(requested.line_item_id);
    if (!purchased || requested.quantity > purchased.quantity) {
      throw new Error('Return quantity exceeds purchased quantity');
    }
    maximumRefundAmount += requested.quantity * Number(purchased.unit_price);
  }

  return { purchasedById, maximumRefundAmount };
}

export function applyOrderDiscountToRefund(
  itemAmount: number,
  orderSubtotal: number,
  orderDiscount: number
) {
  if (orderSubtotal <= 0 || orderDiscount <= 0) return itemAmount;
  const paidRatio = Math.max(
    0,
    Math.min(1, (orderSubtotal - orderDiscount) / orderSubtotal)
  );
  return Math.round(itemAmount * paidRatio);
}
