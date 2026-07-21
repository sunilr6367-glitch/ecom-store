import { db } from './src/db/client';
import { orders, line_items } from './src/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
  const allOrders = await db.select({ id: orders.id, display_id: orders.display_id }).from(orders).limit(5);
  console.log('Sample orders:', allOrders);
  
  if (allOrders.length > 0) {
    for (const order of allOrders) {
      const items = await db.select().from(line_items).where(eq(line_items.order_id, order.id));
      console.log(`Order ${order.display_id} (id: ${order.id}) has ${items.length} items`);
      if (items.length > 0) {
        console.log('Sample item:', items[0]);
      }
    }
  }
  process.exit(0);
}

main().catch(console.error);
