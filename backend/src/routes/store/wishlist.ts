import { Hono } from 'hono';
import { db } from '../../db/client';
import { wishlists, products, product_variants } from '../../db/schema';
import { and, eq } from 'drizzle-orm';
import { verifyCustomer } from '../../middleware/customer-auth';

const wishlistRouter = new Hono();

// All wishlist routes require customer authentication
wishlistRouter.use('*', verifyCustomer);

// GET /store/wishlist — Get customer's wishlist with product details
wishlistRouter.get('/', async (c) => {
  try {
    const customer = c.get('customer') as { sub: string };
    const customerId = customer.sub;

    const items = await db
      .select({
        id: wishlists.id,
        product_id: wishlists.product_id,
        variant_id: wishlists.variant_id,
        created_at: wishlists.created_at,
        product_title: products.title,
        product_thumbnail: products.thumbnail,
        product_handle: products.handle,
        product_status: products.status,
      })
      .from(wishlists)
      .leftJoin(products, eq(wishlists.product_id, products.id))
      .where(eq(wishlists.customer_id, customerId));

    return c.json({ wishlist: items });
  } catch (error: any) {
    console.error('[Wishlist] GET error:', error.message);
    return c.json({ error: 'Failed to fetch wishlist' }, 500);
  }
});

// POST /store/wishlist — Add item to wishlist
wishlistRouter.post('/', async (c) => {
  try {
    const customer = c.get('customer') as { sub: string };
    const customerId = customer.sub;
    const body = await c.req.json();
    const { product_id, variant_id } = body;

    if (!product_id) {
      return c.json({ error: 'product_id is required' }, 400);
    }

    // Check if product exists
    const [product] = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.id, product_id))
      .limit(1);

    if (!product) {
      return c.json({ error: 'Product not found' }, 404);
    }

    // Upsert — ignore if already in wishlist
    try {
      await db.insert(wishlists).values({
        customer_id: customerId,
        product_id,
        variant_id: variant_id || null,
      });
      return c.json({ success: true, action: 'added' }, 201);
    } catch (insertError: any) {
      // Composite PK violation = already exists → treat as success
      if (insertError.message?.includes('duplicate') || insertError.code === '23505') {
        return c.json({ success: true, action: 'already_exists' });
      }
      throw insertError;
    }
  } catch (error: any) {
    console.error('[Wishlist] POST error:', error.message);
    return c.json({ error: 'Failed to add to wishlist' }, 500);
  }
});

// DELETE /store/wishlist/:productId — Remove from wishlist
wishlistRouter.delete('/:productId', async (c) => {
  try {
    const customer = c.get('customer') as { sub: string };
    const customerId = customer.sub;
    const productId = c.req.param('productId');

    await db
      .delete(wishlists)
      .where(
        and(
          eq(wishlists.customer_id, customerId),
          eq(wishlists.product_id, productId)
        )
      );

    return c.json({ success: true, action: 'removed' });
  } catch (error: any) {
    console.error('[Wishlist] DELETE error:', error.message);
    return c.json({ error: 'Failed to remove from wishlist' }, 500);
  }
});

export default wishlistRouter;
