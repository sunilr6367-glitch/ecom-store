import { db } from '../db/client';
import { products, product_variants, money_amounts } from '../db/schema';
import { randomUUID } from 'crypto';

async function seedLuxuryProducts() {
  console.log('Creating Luxury Collection...');

  const allRegions = await db.query.regions.findMany();

  const productsData = [
    {
      title: 'Royal Cashmere Pashmina Shawl',
      subtitle: 'Hand-spun in Kashmir',
      description:
        'Woven from the finest Changthangi goat wool, this Pashmina shawl represents centuries of Kashmiri craftsmanship. Ultra-soft, lightweight, yet incredibly warm. A timeless accessory for the sophisticated wardrobe.',
      handle: 'royal-cashmere-pashmina-shawl',
      priceUSD: 29500, // $295.00
      priceEUR: 27500, // €275.00
      priceINR: 2500000, // ₹25,000
      inventory: 15,
      weight: 200,
      material: '100% Cashmere',
    },
    {
      title: 'Florentine Leather Weekender',
      subtitle: 'Vegetable Tanned Full-Grain Leather',
      description:
        'Handcrafted in Florence, Italy, this weekend bag is made from premium full-grain leather that ages beautifully. Features solid brass hardware and a spacious interior lined with durable cotton canvas.',
      handle: 'florentine-leather-weekender',
      priceUSD: 55000, // $550.00
      priceEUR: 49500, // €495.00
      priceINR: 4800000, // ₹48,000
      inventory: 20,
      weight: 2500,
      material: 'Full-Grain Leather',
    },
    {
      title: 'Banarasi Silk Heritage Saree',
      subtitle: 'Gold Zari Work',
      description:
        'A masterpiece of Indian weaving, this Banarasi silk saree features intricate floral motifs woven with real gold zari threads. Perfect for weddings and grand celebrations, symbolizing elegance and tradition.',
      handle: 'banarasi-silk-heritage-saree-gold',
      priceUSD: 45000, // $450.00
      priceEUR: 42000, // €420.00
      priceINR: 3500000, // ₹35,000
      inventory: 10,
      weight: 1200,
      material: 'Pure Silk, Gold Zari',
    },
  ];

  for (const data of productsData) {
    const productId = randomUUID();
    const variantId = randomUUID();

    // 1. Create Product
    await db.insert(products).values({
      id: productId,
      title: data.title,
      subtitle: data.subtitle,
      description: data.description,
      handle: data.handle,
      status: 'published',
      thumbnail: '', // Placeholder, will update if images available
      weight: data.weight,
      origin_country: 'IN', // Simplified
      material: data.material,
      created_at: new Date(),
      updated_at: new Date(),
    });

    // 2. Create Variant
    await db.insert(product_variants).values({
      id: variantId,
      product_id: productId,
      title: 'Standard',
      sku: `${data.handle}-001`,
      inventory_quantity: data.inventory,
      manage_inventory: true,
      allow_backorder: false,
      material: data.material,
      weight: data.weight,
      created_at: new Date(),
      updated_at: new Date(),
    });

    // 3. Create Prices
    const priceMap = [
      { curr: 'usd', amount: data.priceUSD },
      { curr: 'eur', amount: data.priceEUR },
      { curr: 'inr', amount: data.priceINR },
      { curr: 'gbp', amount: Math.floor(data.priceUSD * 0.8) }, // Approx
    ];

    for (const p of priceMap) {
      const region = allRegions.find((r) => r.currency_code === p.curr);
      if (region) {
        await db.insert(money_amounts).values({
          id: randomUUID(),
          variant_id: variantId,
          region_id: region.id,
          currency_code: p.curr,
          amount: p.amount,
          min_quantity: 1,
        });
      }
    }
    console.log(`Created ${data.title}`);
  }

  console.log('✅ Luxury Collection Seeded!');
  process.exit(0);
}

seedLuxuryProducts().catch((e) => {
  console.error(e);
  process.exit(1);
});
