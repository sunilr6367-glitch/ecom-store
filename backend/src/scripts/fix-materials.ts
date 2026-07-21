import { db } from '../db';
import { products } from '../db/schema';
import { eq } from 'drizzle-orm';

async function main() {
  console.log('--- Checking for products with missing material ---');
  
  const allProducts = await db.select().from(products).execute();
  let updatedCount = 0;

  for (const product of allProducts) {
    if (!product.material || product.material.trim() === '') {
      await db.update(products)
        .set({ material: 'Cotton', updated_at: new Date() })
        .where(eq(products.id, product.id))
        .execute();
      updatedCount++;
    }
  }

  console.log(`--- Fixed ${updatedCount} products by setting default material to "Cotton" ---`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Error in material fix script:', err);
  process.exit(1);
});
