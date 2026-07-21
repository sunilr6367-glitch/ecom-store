import { Hono } from 'hono';
import { verify } from 'hono/jwt';
import { config } from '../../config';
import { wholesalePriceService } from '../../services/wholesale-price-service';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../../db/client';
import { wholesale_tiers, customers } from '../../db/schema';
import { eq } from 'drizzle-orm';

const app = new Hono();

const JWT_SECRET = config.jwt.secret;

const bulkPriceSchema = z.object({
  variantIds: z.array(z.string()).min(1),
});

const calculatePriceSchema = z.object({
  variantId: z.string(),
  quantity: z.number().min(1),
});

// Get wholesale pricing info for current logged-in customer
app.get('/prices', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    let customerId: string | null = null;
    let tier: string | null = null;
    let companyName: string | null = null;

    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const payload = await verify(token, JWT_SECRET, 'HS256');

        if (payload.role === 'customer') {
          customerId = payload.sub as string;

          const wholesaleInfo =
            await wholesalePriceService.hasWholesaleAccess(customerId);
          if (wholesaleInfo.hasAccess) {
            tier = wholesaleInfo.tier;
            companyName = wholesaleInfo.companyName;
          }
        }
      } catch (error: unknown) {
        // Invalid token, continue as guest
        console.error('Error parsing wholesale token:', error);
      }
    }

    let discountPercent = 0;
    if (tier) {
      const { wholesale_tiers } = await import('../../db/schema');
      const { eq } = await import('drizzle-orm');
      const { db } = await import('../../db/client');
      const [tierData] = await db
        .select({ discount_percent: wholesale_tiers.discount_percent })
        .from(wholesale_tiers)
        .where(eq(wholesale_tiers.slug, tier))
        .limit(1);
      discountPercent =
        tierData?.discount_percent ??
        wholesalePriceService.getTierDiscount(tier) * 100;
    }

    return c.json({
      hasWholesaleAccess: !!tier,
      tier,
      companyName,
      discountPercent,
      message: tier
        ? `You have ${discountPercent}% wholesale discount`
        : 'Login to see wholesale pricing',
    });
  } catch (error: any) {
    console.error('Error getting wholesale prices:', error);
    return c.json({ error: 'Failed to get wholesale prices' }, 500);
  }
});

// Get MOQ for a variant
app.get('/moq/:variantId', async (c) => {
  try {
    const { variantId } = c.req.param();
    const moq = await wholesalePriceService.getVariantMOQ(variantId);

    return c.json({
      variantId,
      moq,
    });
  } catch (error: any) {
    console.error('Error getting MOQ:', error);
    return c.json({ error: 'Failed to get MOQ' }, 500);
  }
});

// Get bulk discounts for a variant
app.get('/bulk-discounts/:variantId', async (c) => {
  try {
    const { variantId } = c.req.param();
    const discounts = await wholesalePriceService.getBulkDiscounts(variantId);

    return c.json({
      variantId,
      discounts,
    });
  } catch (error: any) {
    console.error('Error getting bulk discounts:', error);
    return c.json({ error: 'Failed to get bulk discounts' }, 500);
  }
});

// Calculate price with quantity (includes bulk discounts)
app.post('/calculate', zValidator('json', calculatePriceSchema), async (c) => {
  try {
    const { variantId, quantity } = c.req.valid('json');
    const authHeader = c.req.header('Authorization');
    let tier: string | null = null;

    // Check wholesale access
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const payload = await verify(token, JWT_SECRET, 'HS256');

        if (payload.role === 'customer') {
          const wholesaleInfo = await wholesalePriceService.hasWholesaleAccess(
            payload.sub as string
          );
          if (wholesaleInfo.hasAccess) {
            tier = wholesaleInfo.tier;
          }
        }
      } catch (e) {
        // Invalid token, continue as guest
      }
    }

    // Get base price
    const priceInfo = await wholesalePriceService.getVariantPrice(
      variantId,
      tier
    );
    if (!priceInfo) {
      return c.json({ error: 'Variant not found' }, 404);
    }

    // Check MOQ
    const moq = await wholesalePriceService.getVariantMOQ(variantId);
    if (quantity < moq) {
      return c.json(
        {
          error: 'Quantity below MOQ',
          moq,
          requestedQuantity: quantity,
        },
        400
      );
    }

    // Get bulk discounts
    const bulkDiscounts =
      await wholesalePriceService.getBulkDiscounts(variantId);

    // Calculate price with bulk discount
    const basePrice = priceInfo.wholesalePrice;
    const bulkCalculation = wholesalePriceService.calculateBulkPrice(
      basePrice,
      quantity,
      bulkDiscounts
    );

    return c.json({
      variantId,
      quantity,
      moq,
      retailPrice: priceInfo.retailPrice,
      baseWholesalePrice: basePrice,
      finalPrice: bulkCalculation.price,
      total: bulkCalculation.price * quantity,
      tier,
      tierDiscount: priceInfo.discountPercent,
      bulkDiscount: bulkCalculation.discountPercent,
      totalDiscount:
        priceInfo.discountPercent + bulkCalculation.discountPercent,
      savings: (priceInfo.retailPrice - bulkCalculation.price) * quantity,
    });
  } catch (error: any) {
    console.error('Error calculating price:', error);
    return c.json({ error: 'Failed to calculate price' }, 500);
  }
});

// Get wholesale prices for specific variants
app.post('/prices/bulk', zValidator('json', bulkPriceSchema), async (c) => {
  try {
    const { variantIds } = c.req.valid('json');
    const authHeader = c.req.header('Authorization');
    let tier: string | null = null;

    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const payload = await verify(token, JWT_SECRET, 'HS256');

        if (payload.role === 'customer') {
          const wholesaleInfo = await wholesalePriceService.hasWholesaleAccess(
            payload.sub as string
          );
          if (wholesaleInfo.hasAccess) {
            tier = wholesaleInfo.tier;
          }
        }
      } catch (e) {
        // Invalid token, continue as guest
      }
    }

    const prices = await wholesalePriceService.getBulkPrices(variantIds, tier);

    return c.json({
      tier,
      hasWholesaleAccess: !!tier,
      prices,
      totalVariants: variantIds.length,
      foundVariants: prices.length,
    });
  } catch (error: any) {
    console.error('Error getting bulk wholesale prices:', error);
    return c.json(
      {
        error: 'Failed to get wholesale prices',
        details: error.message,
      },
      500
    );
  }
});

// Get tier eligibility for current customer
app.get('/tier/eligibility', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');

    if (!authHeader) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const payload = await verify(token, JWT_SECRET, 'HS256');

    if (payload.role !== 'customer') {
      return c.json({ error: 'Customer access required' }, 403);
    }

    const eligibility = await wholesalePriceService.getTierEligibility(
      payload.sub as string
    );

    return c.json(eligibility);
  } catch (error: any) {
    console.error('Error getting tier eligibility:', error);
    return c.json({ error: 'Failed to get tier eligibility' }, 500);
  }
});

// Auto-assign tier based on order history
app.post('/tier/auto-assign', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');

    if (!authHeader) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const payload = await verify(token, JWT_SECRET, 'HS256');

    if (payload.role !== 'customer') {
      return c.json({ error: 'Customer access required' }, 403);
    }

    const result = await wholesalePriceService.autoAssignTier(
      payload.sub as string
    );

    return c.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Error auto-assigning tier:', error);
    return c.json({ error: 'Failed to auto-assign tier' }, 500);
  }
});

// Admin endpoint to manually assign tier
app.post('/admin/tier/assign/:customerId', async (c) => {
  try {
    const { customerId } = c.req.param();
    const { tierSlug } = await c.req.json();

    if (!tierSlug) {
      return c.json({ error: 'tierSlug is required' }, 400);
    }

    // Verify tier exists
    const [tier] = await db
      .select()
      .from(wholesale_tiers)
      .where(eq(wholesale_tiers.slug, tierSlug))
      .limit(1);

    if (!tier) {
      return c.json({ error: 'Tier not found' }, 404);
    }

    // Update customer metadata
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);

    if (!customer) {
      return c.json({ error: 'Customer not found' }, 404);
    }

    const existingMeta = (customer.metadata as Record<string, unknown>) || {};

    await db
      .update(customers)
      .set({
        metadata: {
          ...existingMeta,
          discount_tier: tierSlug,
          wholesale_customer: true,
        },
        updated_at: new Date(),
      })
      .where(eq(customers.id, customerId));

    return c.json({
      success: true,
      message: `Customer assigned to ${tier.name} tier`,
      tier: tierSlug,
    });
  } catch (error: any) {
    console.error('Error assigning tier:', error);
    return c.json({ error: 'Failed to assign tier' }, 500);
  }
});

export default app;
