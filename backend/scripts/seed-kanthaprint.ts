import 'dotenv/config';
import { db } from '../src/db';
import {
  products,
  product_variants,
  product_categories,
  category_assignments,
  product_collections,
  collection_products,
  product_images,
  tags,
  product_tags,
  settings,
} from '../src/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
const uuidv4 = () => crypto.randomUUID();

async function seed() {
  console.log('--- Seeding Kanthaprint Catalog ---');

  // Clear existing catalog data to give a clean slate
  await db.delete(collection_products);
  await db.delete(category_assignments);
  await db.delete(product_tags);
  await db.delete(product_images);
  await db.delete(product_variants);
  await db.delete(products);
  await db.delete(product_collections);
  await db.delete(product_categories);
  await db.delete(tags);

  console.log('Cleared existing catalog data.');

  // Create Categories & Collections
  const categoriesToCreate = [
    { name: 'Kantha Jackets', handle: 'kantha-jackets', image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=600&auto=format&fit=crop' },
    { name: 'Bohemian Dresses', handle: 'bohemian-dresses', image: 'https://images.unsplash.com/photo-1515347619362-e61e2f7b8098?q=80&w=600&auto=format&fit=crop' },
    { name: 'Tops & Shirts', handle: 'tops-and-shirts', image: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?q=80&w=600&auto=format&fit=crop' },
    { name: 'Quilted Bags', handle: 'quilted-bags', image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=600&auto=format&fit=crop' },
    { name: 'Sale', handle: 'sale', image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=600&auto=format&fit=crop' }
  ];

  const categoryMap = new Map();
  const collectionMap = new Map();

  for (const cat of categoriesToCreate) {
    // Insert Category
    const catId = uuidv4();
    await db.insert(product_categories).values({
      id: catId,
      name: cat.name,
      slug: cat.handle,
      description: `Beautiful handmade ${cat.name.toLowerCase()} for your wardrobe.`,
      image: cat.image,
      is_active: true,
      display_order: 0,
      show_in_header: true,
    });
    categoryMap.set(cat.handle, catId);

    // Insert Matching Collection for Homepage & Quick Links
    const colId = uuidv4();
    await db.insert(product_collections).values({
      id: colId,
      title: cat.name,
      handle: cat.handle,
      description: `Shop our exclusive ${cat.name.toLowerCase()}.`,
      status: 'active',
      rule_type: 'manual',
      homepage_section: 'collections',
      cover_image_url: cat.image,
    });
    collectionMap.set(cat.handle, colId);
  }

  // Also create a "Best Sellers" collection just in case
  const bestsellerColId = uuidv4();
  await db.insert(product_collections).values({
    id: bestsellerColId,
    title: 'Best Sellers',
    handle: 'bestsellers',
    description: 'Our most loved products.',
    status: 'active',
    rule_type: 'manual',
    homepage_section: 'collections',
    cover_image_url: 'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=600&auto=format&fit=crop',
  });

  // Create Tags
  const tagBestsellerId = uuidv4();
  const tagNewId = uuidv4();
  await db.insert(tags).values([
    { id: tagBestsellerId, name: 'Bestseller', slug: 'bestseller' },
    { id: tagNewId, name: 'New Arrival', slug: 'new-arrival' },
  ]);

  console.log('Created Categories, Collections, and Tags.');

  // Create Products
  const productsToCreate = [
    // Jackets
    { title: 'Vintage Kantha Reversible Jacket', price: '4500.00', category: 'kantha-jackets', image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800', isBestseller: true },
    { title: 'Indigo Block Print Kimono', price: '3800.00', category: 'kantha-jackets', image: 'https://images.unsplash.com/photo-1548624313-0396c75e4b1a?w=800', isBestseller: false },
    { title: 'Quilted Cotton Short Jacket', price: '4200.00', category: 'kantha-jackets', image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800', isBestseller: true },
    { title: 'Hand-Stitched Patchwork Coat', price: '5500.00', category: 'kantha-jackets', image: 'https://images.unsplash.com/photo-1520975954732-57dd22299614?w=800', isBestseller: false },
    
    // Dresses
    { title: 'Summer Breeze Cotton Maxi', price: '3200.00', category: 'bohemian-dresses', image: 'https://images.unsplash.com/photo-1515347619362-e61e2f7b8098?w=800', isBestseller: true },
    { title: 'Floral Block Print Midi Dress', price: '2800.00', category: 'bohemian-dresses', image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800', isBestseller: false },
    { title: 'Hand-Dyed Indigo Tiered Dress', price: '3500.00', category: 'bohemian-dresses', image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800', isBestseller: true },
    { title: 'Desert Rose Anarkali Suit', price: '4800.00', category: 'bohemian-dresses', image: 'https://images.unsplash.com/photo-1583391733958-d25e07fac0ec?w=800', isBestseller: false },

    // Tops
    { title: 'Linen Button-Down Tunic', price: '2200.00', category: 'tops-and-shirts', image: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800', isBestseller: true },
    { title: 'Block Print Peplum Blouse', price: '1800.00', category: 'tops-and-shirts', image: 'https://images.unsplash.com/photo-1554568218-0f1715e72254?w=800', isBestseller: false },
    { title: 'Embroidered Cotton Kaftan', price: '2500.00', category: 'tops-and-shirts', image: 'https://images.unsplash.com/photo-1564257631407-4ebd1f9c18f0?w=800', isBestseller: true },
    { title: 'Handwoven Silk Camisole', price: '2900.00', category: 'tops-and-shirts', image: 'https://images.unsplash.com/photo-1516826957135-700ede19c6ce?w=800', isBestseller: false },

    // Bags
    { title: 'Oversized Quilted Weekender', price: '3600.00', category: 'quilted-bags', image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800', isBestseller: true },
    { title: 'Block Print Canvas Tote', price: '1500.00', category: 'quilted-bags', image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800', isBestseller: false },
    { title: 'Vintage Kantha Sling Bag', price: '1800.00', category: 'quilted-bags', image: 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?w=800', isBestseller: true },
    { title: 'Hand-Embroidered Clutch', price: '1200.00', category: 'quilted-bags', image: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=800', isBestseller: false },
  ];

  for (const p of productsToCreate) {
    const prodId = uuidv4();
    const handle = p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    
    // Insert Product
    await db.insert(products).values({
      id: prodId,
      title: p.title,
      handle: handle,
      description: `Authentic ${p.title} from Kanthaprint. Handcrafted with love and care, perfect for any occasion.`,
      status: 'published',
      vendor: 'Kanthaprint',
      thumbnail: p.image,
      avg_rating: 4.8 + Math.random() * 0.2, // Fake rating
      review_count: Math.floor(Math.random() * 50) + 10,
    });

    // Insert Image
    await db.insert(product_images).values({
      id: uuidv4(),
      product_id: prodId,
      url: p.image,
      position: 0,
      alt_text: p.title,
    });

    // Insert Variant (for price)
    await db.insert(product_variants).values({
      id: uuidv4(),
      product_id: prodId,
      title: 'Default Title',
      sku: `KP-${Math.floor(Math.random() * 10000)}`,
      inventory_quantity: 10,
      requires_shipping: true,
      price_inr: p.price,
      price_usd: (parseFloat(p.price) / 80).toFixed(2),
    });

    // Assign Category
    const catId = categoryMap.get(p.category);
    if (catId) {
      await db.insert(category_assignments).values({
        product_id: prodId,
        category_id: catId,
        is_primary: true,
      });
    }

    // Assign Collection
    const colId = collectionMap.get(p.category);
    if (colId) {
      await db.insert(collection_products).values({
        collection_id: colId,
        product_id: prodId,
        position: 0,
      });
    }

    // Best seller tag / collection
    if (p.isBestseller) {
      await db.insert(product_tags).values({
        product_id: prodId,
        tag_id: tagBestsellerId,
      });
      await db.insert(collection_products).values({
        collection_id: bestsellerColId,
        product_id: prodId,
        position: 0,
      });
    }
  }

  // Update Settings for circle categories
  const newCircles = categoriesToCreate.map(c => ({
    name: c.name,
    image_url: c.image,
    link_url: `/collections/${c.handle}`
  }));
  
  await db.update(settings).set({
    setting_value: newCircles
  }).where(eq(settings.setting_key, 'homepage_category_circles'));

  console.log(`Seeded ${productsToCreate.length} products.`);
  console.log('--- Done Seeding ---');
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
