import { Hono } from 'hono';
import { z } from 'zod';
import { db } from '../../db/client';
import { back_in_stock_subscriptions, products, product_variants } from '../../db/schema';
import { and, eq } from 'drizzle-orm';

const router = new Hono();

const SubscribeSchema = z.object({
  product_id: z.string().uuid('Invalid product ID'),
  variant_id: z.string().uuid('Invalid variant ID').optional(),
  email: z.string().email('Invalid email address'),
});

// POST /store/back-in-stock — Subscribe to restock notification
router.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const parsed = SubscribeSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        {
          error: 'Validation failed',
          details: parsed.error.errors.map((e) => e.message),
        },
        400
      );
    }

    const data = parsed.data;

    // Verify product exists
    const [product] = await db
      .select({ id: products.id, title: products.title })
      .from(products)
      .where(eq(products.id, data.product_id))
      .limit(1);

    if (!product) {
      return c.json({ error: 'Product not found' }, 404);
    }

    // Prevent duplicate subscriptions for same product+email combo
    const existing = await db
      .select({ id: back_in_stock_subscriptions.id })
      .from(back_in_stock_subscriptions)
      .where(
        and(
          eq(back_in_stock_subscriptions.product_id, data.product_id),
          eq(back_in_stock_subscriptions.email, data.email.toLowerCase()),
          eq(back_in_stock_subscriptions.notified, false) // Allow re-subscribe if already notified
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return c.json({
        success: true,
        message: "You're already subscribed! We'll notify you when it's back.",
      });
    }

    await db.insert(back_in_stock_subscriptions).values({
      product_id: data.product_id,
      variant_id: data.variant_id,
      email: data.email.toLowerCase(),
    });

    return c.json(
      {
        success: true,
        message: `We'll email you at ${data.email} when "${product.title}" is back in stock.`,
      },
      201
    );
  } catch (error: any) {
    console.error('[BackInStock] POST error:', error.message);
    return c.json({ error: 'Failed to subscribe. Please try again.' }, 500);
  }
});

export default router;
