import { Hono } from 'hono';
import { verify } from 'hono/jwt';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { config } from '../../config';
import { db } from '../../db/client';
import { orders, line_items, addresses, customers } from '../../db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { wholesalePriceService } from '../../services/wholesale-price-service';

const app = new Hono();
const JWT_SECRET = config.jwt.secret;

// Validation schema for wholesale order
const createWholesaleOrderSchema = z.object({
  email: z.string().email(),
  po_number: z.string().optional(),
  payment_terms: z.enum(['net_30', 'net_45', 'net_60']),
  notes: z.string().optional(),
  shipping_address: z.object({
    first_name: z.string(),
    last_name: z.string(),
    company: z.string().optional(),
    address_1: z.string(),
    address_2: z.string().optional(),
    city: z.string(),
    postal_code: z.string(),
    province: z.string().optional(),
    country_code: z.string(),
    phone: z.string(),
  }),
  items: z
    .array(
      z.object({
        variant_id: z.string(),
        quantity: z.number().min(1),
        // 🔒 SEC: unit_price removed — calculated server-side from wholesalePriceService
      })
    )
    .min(1),
  is_wholesale: z.boolean(),
  wholesale_tier: z.string().optional(),
  // subtotal, tier_discount, bulk_discount, total are calculated server-side
});

// Middleware to verify wholesale customer
const verifyWholesaleCustomer = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    const payload = await verify(token, JWT_SECRET, 'HS256');

    if (payload.role !== 'customer') {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const wholesaleInfo = await wholesalePriceService.hasWholesaleAccess(
      payload.sub as string
    );
    if (!wholesaleInfo.hasAccess) {
      return c.json({ error: 'Wholesale access required' }, 403);
    }

    c.set('customerId', payload.sub);
    c.set('wholesaleInfo', wholesaleInfo);
    await next();
  } catch (error: unknown) {
    console.error('Error in wholesale auth:', error);
    return c.json({ error: 'Invalid token' }, 401);
  }
};

// Create wholesale order
app.post(
  '/orders',
  verifyWholesaleCustomer,
  zValidator('json', createWholesaleOrderSchema),
  async (c) => {
    try {
      const customerId = c.get('customerId');
      const wholesaleInfo = c.get('wholesaleInfo');
      const data = c.req.valid('json');

      // Validate all items meet MOQ and calculate prices server-side
      const tier = wholesaleInfo.tier || data.wholesale_tier || null;
      interface ResolvedItem {
        variant_id: string;
        quantity: number;
        unit_price: number;
        line_total: number;
        tier_discount_amount: number;
      }
      const resolvedItems: ResolvedItem[] = [];
      let subtotal = 0;
      let totalTierDiscount = 0;

      for (const item of data.items) {
        const moq = await wholesalePriceService.getVariantMOQ(item.variant_id);
        if (item.quantity < moq) {
          return c.json(
            {
              error: 'MOQ not met',
              message: `Minimum order quantity for one or more items is ${moq}`,
            },
            400
          );
        }

        // 🔒 SEC: Fetch price server-side — never trust client-supplied unit_price
        const priceResult = await wholesalePriceService.getVariantPrice(item.variant_id, tier);
        if (!priceResult) {
          return c.json({ error: `Variant ${item.variant_id} not found or not priced` }, 400);
        }

        const unitPrice = priceResult.wholesalePrice;
        const lineTotal = unitPrice * item.quantity;
        const tierDiscountAmount = (priceResult.retailPrice - unitPrice) * item.quantity;

        subtotal += priceResult.retailPrice * item.quantity;
        totalTierDiscount += tierDiscountAmount;

        resolvedItems.push({
          variant_id: item.variant_id,
          quantity: item.quantity,
          unit_price: unitPrice,
          line_total: lineTotal,
          tier_discount_amount: tierDiscountAmount,
        });
      }

      const total = subtotal - totalTierDiscount; // shipping + tax can be added later

      // Generate order number
      const timestamp = Date.now();
      const orderNumber = `WS-${timestamp}`;

      // Create shipping address
      const [shippingAddress] = await db
        .insert(addresses)
        .values({
          customer_id: customerId,
          first_name: data.shipping_address.first_name,
          last_name: data.shipping_address.last_name,
          company: data.shipping_address.company || wholesaleInfo.companyName,
          address_1: data.shipping_address.address_1,
          address_2: data.shipping_address.address_2,
          city: data.shipping_address.city,
          postal_code: data.shipping_address.postal_code,
          province: data.shipping_address.province,
          country_code: data.shipping_address.country_code,
          phone: data.shipping_address.phone,
        })
        .returning();

      // Create order
      const [order] = await db
        .insert(orders)
        .values({
          customer_id: customerId,
          email: data.email,
          status: 'pending', // Wholesale orders start as pending (awaiting approval)
          payment_status: 'awaiting', // No immediate payment for wholesale
          fulfillment_status: 'not_fulfilled',
          order_number: orderNumber,
          currency_code: 'usd',
          subtotal,
          tax_total: 0,
          shipping_total: 0,
          discount_total: totalTierDiscount,
          total,
          shipping_address_id: shippingAddress.id,
          billing_address_id: shippingAddress.id,
          metadata: {
            is_wholesale: true,
            wholesale_tier: tier,
            po_number: data.po_number,
            payment_terms: data.payment_terms,
            tier_discount: totalTierDiscount,
            bulk_discount: 0,
            customer_notes: data.notes,
          },
        })
        .returning();

      // Create line items using server-resolved prices
      for (const item of resolvedItems) {
        await db.insert(line_items).values({
          order_id: order.id,
          variant_id: item.variant_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.line_total,
        });
      }

      return c.json({
        success: true,
        order: {
          id: order.id,
          order_number: order.order_number,
          status: order.status,
          total: order.total,
          payment_terms: data.payment_terms,
        },
      });
    } catch (error: any) {
      console.error('Error creating wholesale order:', error);
      return c.json(
        {
          error: 'Failed to create order',
          details: error.message,
        },
        500
      );
    }
  }
);

// Get wholesale orders for customer
app.get('/orders', verifyWholesaleCustomer, async (c) => {
  try {
    const customerId = c.get('customerId');

    const customerOrders = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.customer_id, customerId),
          eq(sql`${orders.metadata}->>'is_wholesale'`, 'true')
        )
      )
      .orderBy(desc(orders.created_at));

    return c.json({
      orders: customerOrders.map((order) => ({
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        payment_status: order.payment_status,
        fulfillment_status: order.fulfillment_status,
        total: order.total,
        currency_code: order.currency_code,
        created_at: order.created_at,
        metadata: order.metadata,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching wholesale orders:', error);
    return c.json({ error: 'Failed to fetch orders' }, 500);
  }
});

// Get single wholesale order
app.get('/orders/:id', verifyWholesaleCustomer, async (c) => {
  try {
    const customerId = c.get('customerId');
    const { id } = c.req.param();

    const [order] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, id), eq(orders.customer_id, customerId)))
      .limit(1);

    if (!order) {
      return c.json({ error: 'Order not found' }, 404);
    }

    // Get line items
    const items = await db
      .select()
      .from(line_items)
      .where(eq(line_items.order_id, id));

    return c.json({
      order: {
        ...order,
        items,
      },
    });
  } catch (error: any) {
    console.error('Error fetching wholesale order:', error);
    return c.json({ error: 'Failed to fetch order' }, 500);
  }
});

export default app;
