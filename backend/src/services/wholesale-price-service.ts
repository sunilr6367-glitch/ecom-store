import { db } from '../db/client';
import { product_variants, products } from '../db/schema';
import { eq } from 'drizzle-orm';

export const TIER_DISCOUNTS: Record<string, number> = {
  starter: 0.2, // 20% off
  growth: 0.3, // 30% off
  enterprise: 0.4, // 40% off
};

export interface WholesalePriceResult {
  variantId: string;
  productId: string;
  retailPrice: number;
  wholesalePrice: number;
  discountPercent: number;
  savings: number;
  tier: string | null;
}

export interface ProductPriceResult {
  productId: string;
  variants: WholesalePriceResult[];
  lowestWholesalePrice: number;
  hasWholesalePricing: boolean;
}

export const wholesalePriceService = {
  /**
   * Get discount percentage for a tier
   */
  getTierDiscount(tier: string | null | undefined): number {
    if (!tier) return 0;
    return TIER_DISCOUNTS[tier] || 0;
  },

  /**
   * Calculate wholesale price for a product variant
   */
  calculateWholesalePrice(
    retailPrice: number,
    wholesalePrice: number | null,
    tier: string | null
  ): {
    price: number;
    isWholesalePrice: boolean;
    discountPercent: number;
    savings: number;
  } {
    const discount = this.getTierDiscount(tier);

    // If variant has explicit wholesale price, use that
    if (wholesalePrice !== null && wholesalePrice > 0) {
      const savings = retailPrice - wholesalePrice;
      return {
        price: wholesalePrice,
        isWholesalePrice: true,
        discountPercent: (savings / retailPrice) * 100,
        savings,
      };
    }

    // Otherwise calculate from retail price using tier discount
    if (discount > 0) {
      const wholesalePrice = Math.round(retailPrice * (1 - discount));
      return {
        price: wholesalePrice,
        isWholesalePrice: true,
        discountPercent: discount * 100,
        savings: retailPrice - wholesalePrice,
      };
    }

    return {
      price: retailPrice,
      isWholesalePrice: false,
      discountPercent: 0,
      savings: 0,
    };
  },

  /**
   * Get wholesale price for a single variant
   */
  async getVariantPrice(
    variantId: string,
    tier: string | null
  ): Promise<WholesalePriceResult | null> {
    const [variant] = await db
      .select()
      .from(product_variants)
      .where(eq(product_variants.id, variantId))
      .limit(1);

    if (!variant) return null;

    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, variant.product_id))
      .limit(1);

    if (!product) return null;

    // Get retail price from money_amounts
    const { money_amounts } = await import('../db/schema');
    const [priceAmount] = await db
      .select()
      .from(money_amounts)
      .where(eq(money_amounts.variant_id, variantId))
      .limit(1);

    const retailPrice = priceAmount?.amount || 0;
    const wholesalePriceField = variant.wholesale_price || null;

    const calculation = this.calculateWholesalePrice(
      retailPrice,
      wholesalePriceField,
      tier
    );

    return {
      variantId: variant.id,
      productId: product.id,
      retailPrice,
      wholesalePrice: calculation.price,
      discountPercent: calculation.discountPercent,
      savings: calculation.savings,
      tier,
    };
  },

  /**
   * Get wholesale prices for multiple variants
   */
  async getBulkPrices(
    variantIds: string[],
    tier: string | null
  ): Promise<WholesalePriceResult[]> {
    const results: WholesalePriceResult[] = [];

    for (const variantId of variantIds) {
      try {
        const result = await this.getVariantPrice(variantId, tier);
        if (result) {
          results.push(result);
        }
      } catch (error: unknown) {
        console.error(`Error getting price for variant ${variantId}:`, error);
        // Skip invalid variants but continue processing others
      }
    }

    return results;
  },

  /**
   * Check if customer has wholesale access
   */
  async hasWholesaleAccess(customerId: string): Promise<{
    hasAccess: boolean;
    tier: string | null;
    companyName: string | null;
  }> {
    const { customers } = await import('../db/schema');
    const { eq } = await import('drizzle-orm');

    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);

    if (!customer) {
      return { hasAccess: false, tier: null, companyName: null };
    }

    const metadata = customer.metadata as Record<string, any> | null;
    const isWholesale = metadata?.wholesale_customer === true;
    const tier = metadata?.discount_tier || null;
    const companyName = metadata?.company_name || null;

    return {
      hasAccess: isWholesale && !!tier,
      tier,
      companyName,
    };
  },

  /**
   * Get MOQ for a variant
   */
  async getVariantMOQ(variantId: string): Promise<number> {
    const { eq } = await import('drizzle-orm');

    const [variant] = await db
      .select()
      .from(product_variants)
      .where(eq(product_variants.id, variantId))
      .limit(1);

    return variant?.moq || 1;
  },

  /**
   * Get bulk discounts for a variant
   */
  async getBulkDiscounts(variantId: string): Promise<
    Array<{
      min_quantity: number;
      discount_percent: number;
      description: string | null;
    }>
  > {
    const { bulk_discounts } = await import('../db/schema');
    const { eq, and, desc } = await import('drizzle-orm');

    const discounts = await db
      .select()
      .from(bulk_discounts)
      .where(
        and(
          eq(bulk_discounts.variant_id, variantId),
          eq(bulk_discounts.active, true)
        )
      )
      .orderBy(desc(bulk_discounts.min_quantity));

    return discounts.map((d) => ({
      min_quantity: d.min_quantity,
      discount_percent: d.discount_percent,
      description: d.description,
    }));
  },

  /**
   * Calculate price with bulk discount
   */
  calculateBulkPrice(
    basePrice: number,
    quantity: number,
    bulkDiscounts: Array<{ min_quantity: number; discount_percent: number }>
  ): {
    price: number;
    discountPercent: number;
    savings: number;
  } {
    // Sort by min_quantity descending to find highest applicable tier
    const applicableDiscount = bulkDiscounts
      .sort((a, b) => b.min_quantity - a.min_quantity)
      .find((d) => quantity >= d.min_quantity);

    if (!applicableDiscount) {
      return { price: basePrice, discountPercent: 0, savings: 0 };
    }

    const discountMultiplier = applicableDiscount.discount_percent / 100;
    const discountAmount = Math.round(basePrice * discountMultiplier);
    const discountedPrice = basePrice - discountAmount;

    return {
      price: discountedPrice,
      discountPercent: applicableDiscount.discount_percent,
      savings: discountAmount * quantity,
    };
  },

  /**
   * Check if product is wholesale-only
   */
  async isWholesaleOnly(productId: string): Promise<boolean> {
    const { eq } = await import('drizzle-orm');

    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    return product?.is_wholesale_only || false;
  },

  /**
   * Auto-assign tier based on customer's order history
   */
  async autoAssignTier(customerId: string): Promise<{
    tier: string | null;
    reason: string;
  }> {
    const { wholesale_tiers, orders, customers } = await import('../db/schema');
    const { eq, and, sql, desc } = await import('drizzle-orm');

    // Get customer
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);

    if (!customer) {
      return { tier: null, reason: 'Customer not found' };
    }

    // Check if already a wholesale customer
    const metadata = customer.metadata as Record<string, any> | null;
    const isWholesale = metadata?.wholesale_customer === true;

    if (!isWholesale) {
      return { tier: null, reason: 'Not a wholesale customer' };
    }

    // Get customer's total order stats
    const [orderStats] = await db
      .select({
        totalValue: sql<number>`sum(${orders.total})`,
        totalQuantity: sql<number>`sum(${orders.metadata}->>'total_items')::int`,
        orderCount: sql<number>`count(*)`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.customer_id, customerId),
          sql`${orders.metadata}->>'is_wholesale' = 'true'`,
          eq(orders.status, 'completed')
        )
      );

    const totalValue = Number(orderStats?.totalValue) || 0;
    const totalQuantity = Number(orderStats?.totalQuantity) || 0;
    const orderCount = Number(orderStats?.orderCount) || 0;

    // Get all active tiers sorted by priority (highest first)
    const tiers = await db
      .select()
      .from(wholesale_tiers)
      .where(eq(wholesale_tiers.active, true))
      .orderBy(desc(wholesale_tiers.priority));

    // Find the highest tier the customer qualifies for
    for (const tier of tiers) {
      const minOrderValue = tier.min_order_value ?? 0;
      const minOrderQuantity = tier.min_order_quantity ?? 0;
      const meetsValue = totalValue >= minOrderValue;
      const meetsQuantity = totalQuantity >= minOrderQuantity;

      if (meetsValue && meetsQuantity) {
        // Update customer's tier
        await db
          .update(customers)
          .set({
            metadata: {
              ...metadata,
              discount_tier: tier.slug,
            },
            updated_at: new Date(),
          })
          .where(eq(customers.id, customerId));

        return {
          tier: tier.slug,
          reason: `Qualified based on ${orderCount} orders totaling ${totalValue} with ${totalQuantity} items`,
        };
      }
    }

    return {
      tier: metadata?.discount_tier || null,
      reason: 'Does not qualify for higher tier',
    };
  },

  /**
   * Get customer's current tier eligibility
   */
  async getTierEligibility(customerId: string): Promise<{
    currentTier: string | null;
    eligibleTiers: Array<{
      slug: string;
      name: string;
      discount_percent: number;
      qualified: boolean;
      requirements: string;
    }>;
    orderStats: {
      totalValue: number;
      totalQuantity: number;
      orderCount: number;
    };
  }> {
    const { wholesale_tiers, orders, customers } = await import('../db/schema');
    const { eq, and, sql, desc } = await import('drizzle-orm');

    // Get customer
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);

    const metadata = customer?.metadata as Record<string, any> | null;
    const currentTier = metadata?.discount_tier || null;

    // Get customer's order stats
    const [orderStats] = await db
      .select({
        totalValue: sql<number>`coalesce(sum(${orders.total}), 0)`,
        totalQuantity: sql<number>`coalesce(sum((${orders.metadata}->>'total_items')::int), 0)`,
        orderCount: sql<number>`count(*)`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.customer_id, customerId),
          sql`${orders.metadata}->>'is_wholesale' = 'true'`,
          eq(orders.status, 'completed')
        )
      );

    const totalValue = Number(orderStats?.totalValue) || 0;
    const totalQuantity = Number(orderStats?.totalQuantity) || 0;
    const orderCount = Number(orderStats?.orderCount) || 0;

    // Get all active tiers
    const tiers = await db
      .select()
      .from(wholesale_tiers)
      .where(eq(wholesale_tiers.active, true))
      .orderBy(desc(wholesale_tiers.priority));

    const eligibleTiers = tiers.map((tier) => {
      const minOrderValue = tier.min_order_value ?? 0;
      const minOrderQuantity = tier.min_order_quantity ?? 0;
      const meetsValue = totalValue >= minOrderValue;
      const meetsQuantity = totalQuantity >= minOrderQuantity;

      let requirements = '';
      if (minOrderValue > 0) {
        requirements += `$${(minOrderValue / 100).toFixed(0)} order value`;
      }
      if (minOrderQuantity > 0) {
        if (requirements) requirements += ' + ';
        requirements += `${minOrderQuantity} items`;
      }
      if (!requirements) requirements = 'No minimum requirements';

      return {
        slug: tier.slug,
        name: tier.name,
        discount_percent: tier.discount_percent,
        qualified: meetsValue && meetsQuantity,
        requirements,
      };
    });

    return {
      currentTier,
      eligibleTiers,
      orderStats: {
        totalValue,
        totalQuantity,
        orderCount,
      },
    };
  },
};
