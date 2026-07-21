import { Hono } from 'hono';
import { verifyAdmin } from '../../middleware/auth';
import { db } from '../../db/client';
import { saved_carts, customers } from '../../db/schema';
import { eq, sql, desc, and, lt } from 'drizzle-orm';

const app = new Hono();

app.use('*', verifyAdmin);

// GET /abandoned-carts — List abandoned carts with stats
app.get('/', async (c) => {
  try {
    const period = c.req.query('period') || '30d';

    // Calculate cutoff date based on period
    let periodHours: number;
    switch (period) {
      case '24h':
        periodHours = 24;
        break;
      case '7d':
        periodHours = 7 * 24;
        break;
      case '30d':
      default:
        periodHours = 30 * 24;
        break;
    }

    const periodCutoff = new Date(Date.now() - periodHours * 60 * 60 * 1000);
    
    // NOTE: orders table has no direct cart_id reference.
    // Abandoned detection relies on updated_at only.
    // This is acceptable if checkout flow deletes saved_carts on order creation.
    // A cart is considered "abandoned" if updated_at is older than 1 hour.
    const abandonedCutoff = new Date(Date.now() - 1 * 60 * 60 * 1000);

    // Query saved_carts LEFT JOIN customers for email/name
    const carts = await db
      .select({
        id: saved_carts.id,
        customer_id: saved_carts.customer_id,
        session_id: saved_carts.session_id,
        items: saved_carts.items,
        recovery_sent: saved_carts.recovery_sent,
        recovery_sent_at: saved_carts.recovery_sent_at,
        created_at: saved_carts.created_at,
        updated_at: saved_carts.updated_at,
        customer_email: customers.email,
        customer_first_name: customers.first_name,
        customer_last_name: customers.last_name,
      })
      .from(saved_carts)
      .leftJoin(customers, eq(saved_carts.customer_id, customers.id))
      .where(
        and(
          lt(saved_carts.updated_at, abandonedCutoff),
          sql`${saved_carts.updated_at} >= ${periodCutoff.toISOString()}`
        )
      )
      .orderBy(desc(saved_carts.updated_at));

    // Calculate cart values and format response
    const formattedCarts = carts.map((cart) => {
      const items = (cart.items as any[]) || [];
      let cartValue = 0;
      let itemCount = 0;

      for (const item of items) {
        const price = Number(item.unit_price || item.price || 0);
        const qty = Number(item.quantity || 1);
        cartValue += price * qty;
        itemCount += qty;
      }

      return {
        id: cart.id,
        customer_id: cart.customer_id,
        session_id: cart.session_id,
        customer_email: cart.customer_email || 'Guest',
        customer_name: cart.customer_first_name
          ? `${cart.customer_first_name} ${cart.customer_last_name || ''}`.trim()
          : 'Guest',
        items,
        cart_value: cartValue,
        item_count: itemCount,
        created_at: cart.created_at,
        updated_at: cart.updated_at,
        recovery_sent: cart.recovery_sent ?? false,
        recovery_sent_at: cart.recovery_sent_at,
      };
    });

    // Calculate stats
    const totalAbandonedValue = formattedCarts.reduce((sum, c) => sum + c.cart_value, 0);
    const totalCount = formattedCarts.length;
    const avgCartValue = totalCount > 0 ? totalAbandonedValue / totalCount : 0;

    return c.json({
      carts: formattedCarts,
      stats: {
        total_abandoned_value: totalAbandonedValue,
        total_count: totalCount,
        avg_cart_value: Math.round(avgCartValue * 100) / 100,
      },
    });
  } catch (error: any) {
    console.error('Error fetching abandoned carts:', error);
    return c.json({ error: 'Failed to fetch abandoned carts' }, 500);
  }
});

// POST /abandoned-carts/:id/recover — Mark cart as recovery email sent
app.post('/:id/recover', async (c) => {
  try {
    const id = c.req.param('id');

    // Check if cart exists
    const [cart] = await db
      .select()
      .from(saved_carts)
      .where(eq(saved_carts.id, id))
      .limit(1);

    if (!cart) {
      return c.json({ error: 'Abandoned cart not found' }, 404);
    }

    if (cart.recovery_sent) {
      return c.json({
        success: true,
        message: 'Recovery email was already sent for this cart',
        cart_id: id,
      });
    }

    // Mark as recovery sent
    await db
      .update(saved_carts)
      .set({
        recovery_sent: true,
        recovery_sent_at: new Date(),
        updated_at: new Date(),
      })
      .where(eq(saved_carts.id, id));

    return c.json({
      success: true,
      message: 'Recovery email marked as sent',
      cart_id: id,
    });
  } catch (error: any) {
    console.error('Error recovering abandoned cart:', error);
    return c.json({ error: 'Failed to mark recovery' }, 500);
  }
});

// DELETE /abandoned-carts/:id — Delete an abandoned cart
app.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');

    // Check if cart exists
    const [cart] = await db
      .select({ id: saved_carts.id })
      .from(saved_carts)
      .where(eq(saved_carts.id, id))
      .limit(1);

    if (!cart) {
      return c.json({ error: 'Abandoned cart not found' }, 404);
    }

    await db.delete(saved_carts).where(eq(saved_carts.id, id));

    return c.json({
      success: true,
      message: 'Abandoned cart deleted',
    });
  } catch (error: any) {
    console.error('Error deleting abandoned cart:', error);
    return c.json({ error: 'Failed to delete abandoned cart' }, 500);
  }
});

export default app;
