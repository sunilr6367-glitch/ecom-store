import { db } from '../db/client';
import { products, product_variants, money_amounts } from '../db/schema';
import { randomUUID } from 'crypto';

async function seedProduct() {
  console.log('Creating Safari Jacket Product...');

  const productId = randomUUID();
  const variantId = randomUUID();

  // 1. Create Product
  await db.insert(products).values({
    id: productId,
    title: 'Hand-Embroidered Velvet Safari Jacket',
    subtitle: 'Reversible with Striped Cotton Lining',
    description:
      'Experience the wild elegance with our Hand-Embroidered Velvet Safari Jacket. This reversible masterpiece features intricate embroidery of rhinos, deers, and lush palm trees on a rich grey velvet base. The reverse side offers a classic striped cotton lining for a versatile, casual look. Perfectly handcrafted for the bohemian soul.',
    handle: 'hand-embroidered-velvet-safari-jacket',
    status: 'published',
    thumbnail: '/products/jacket-safari.jpg',
    weight: 800,
    length: 40,
    width: 30,
    height: 5,
    origin_country: 'IN',
    material: 'Velvet, Cotton',
    created_at: new Date(),
    updated_at: new Date(),
  });

  // 2. Create Variant
  await db.insert(product_variants).values({
    id: variantId,
    product_id: productId,
    title: 'Standard',
    sku: 'SAFARI-VEL-001',
    inventory_quantity: 25,
    manage_inventory: true,
    allow_backorder: false,
    hs_code: '620293',
    origin_country: 'IN',
    material: 'Velvet',
    weight: 800,
    created_at: new Date(),
    updated_at: new Date(),
  });

  // 3. Create Prices
  const prices = [
    { currency: 'usd', amount: 14500, region_id: 'reg_usa' }, // $145.00
    { currency: 'eur', amount: 13500, region_id: 'reg_eu' }, // €135.00
    { currency: 'inr', amount: 1200000, region_id: 'reg_india' }, // ₹12,000.00
  ];

  // Note: We need actual region IDs.
  // Let's fetch regions to be safe, or just insert with currency_code and hope for the best if searching by currency?
  // Our logic uses region_id. Let's try to lookup regions first.

  // Quick fix: Fetch all regions and map by currency
  const allRegions = await db.query.regions.findMany();

  for (const p of prices) {
    // Find region by currency (simple heuristic for this script)
    const region = allRegions.find((r) => r.currency_code === p.currency);
    if (region) {
      await db.insert(money_amounts).values({
        id: randomUUID(),
        variant_id: variantId,
        region_id: region.id,
        currency_code: p.currency,
        amount: p.amount,
        min_quantity: 1,
      });
      console.log(
        `Added price ${p.currency.toUpperCase()} ${p.amount / 100} for region ${region.name}`
      );
    } else {
      // Fallback: Just insert with available EUR/USD/INR regions or skip
      console.log(`Skipping price for ${p.currency} - Region not found`);
    }
  }

  console.log('✅ Product Created Successfully!');
  process.exit(0);
}

seedProduct().catch((e) => {
  console.error(e);
  process.exit(1);
});
