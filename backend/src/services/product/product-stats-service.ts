/**
 * Product Stats Service
 * Handles all statistics and analytics for products
 */

import { db } from '../../db/client';
import { products, product_variants } from '../../db/schema';
import { eq, sql } from 'drizzle-orm';

export interface ProductStats {
  total_products: number;
  published_products: number;
  draft_products: number;
  low_stock_products: number;
  out_of_stock_products: number;
}

export class ProductStatsService {
  /**
   * Get product statistics
   */
  async getStats(): Promise<ProductStats> {
    const [{ total_products }] = await db
      .select({ total_products: sql<number>`count(*)` })
      .from(products);
    const [{ published_products }] = await db
      .select({ published_products: sql<number>`count(*)` })
      .from(products)
      .where(eq(products.status, 'published'));
    const [{ draft_products }] = await db
      .select({ draft_products: sql<number>`count(*)` })
      .from(products)
      .where(eq(products.status, 'draft'));

    const [{ low_stock_products }] = await db
      .select({
        low_stock_products: sql<number>`count(distinct ${product_variants.product_id})`,
      })
      .from(product_variants)
      .where(
        sql`${product_variants.inventory_quantity} < 10 AND ${product_variants.manage_inventory} = true`
      );

    const [{ out_of_stock_products }] = await db
      .select({
        out_of_stock_products: sql<number>`count(distinct ${product_variants.product_id})`,
      })
      .from(product_variants)
      .where(
        sql`${product_variants.inventory_quantity} = 0 AND ${product_variants.manage_inventory} = true`
      );

    return {
      total_products: Number(total_products),
      published_products: Number(published_products),
      draft_products: Number(draft_products),
      low_stock_products: Number(low_stock_products),
      out_of_stock_products: Number(out_of_stock_products),
    };
  }
}

// Export singleton instance
export const productStatsService = new ProductStatsService();
