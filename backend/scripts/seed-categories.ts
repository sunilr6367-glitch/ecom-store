import { db } from '../src/db/client';
import { categories } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import 'dotenv/config';

// Top-level categories first, then subcategories (parent_slug used to resolve parent_id)
const CATEGORIES: {
  name: string;
  slug: string;
  description: string;
  emoji: string;
  display_order: number;
  show_in_header: boolean;
  parent_slug?: string;
}[] = [
  // ── Top-level ──────────────────────────────────────────────────
  {
    name: 'Sarees',
    slug: 'sarees',
    description: 'Handcrafted sarees in silk, cotton, georgette and more',
    emoji: '🥻',
    display_order: 1,
    show_in_header: true,
  },
  {
    name: 'Suits & Kurtas',
    slug: 'suits-kurtas',
    description: 'Salwar suits, kurta sets and ethnic separates',
    emoji: '👗',
    display_order: 2,
    show_in_header: true,
  },
  {
    name: 'Lehengas',
    slug: 'lehengas',
    description: 'Bridal and festive lehenga cholis',
    emoji: '✨',
    display_order: 3,
    show_in_header: true,
  },
  {
    name: 'Dupattas & Stoles',
    slug: 'dupattas-stoles',
    description: 'Handcrafted dupattas and stoles',
    emoji: '🧣',
    display_order: 4,
    show_in_header: true,
  },
  {
    name: 'Accessories',
    slug: 'accessories',
    description: 'Jewellery, bags, footwear and more',
    emoji: '💍',
    display_order: 5,
    show_in_header: true,
  },
  {
    name: 'Handmade',
    slug: 'handmade',
    description: 'Artisan handcrafted products',
    emoji: '🤲',
    display_order: 6,
    show_in_header: true,
  },
  {
    name: 'New Arrivals',
    slug: 'new-arrivals',
    description: 'Latest additions to the collection',
    emoji: '🆕',
    display_order: 7,
    show_in_header: true,
  },
  {
    name: 'Sale',
    slug: 'sale',
    description: 'Special discounts and offers',
    emoji: '🏷️',
    display_order: 8,
    show_in_header: true,
  },

  // ── Sarees subcategories ───────────────────────────────────────
  {
    name: 'Silk Sarees',
    slug: 'silk-sarees',
    description: 'Pure silk and blended silk sarees',
    emoji: '🥻',
    display_order: 1,
    show_in_header: false,
    parent_slug: 'sarees',
  },
  {
    name: 'Cotton Sarees',
    slug: 'cotton-sarees',
    description: 'Handloom and printed cotton sarees',
    emoji: '🥻',
    display_order: 2,
    show_in_header: false,
    parent_slug: 'sarees',
  },
  {
    name: 'Kantha Sarees',
    slug: 'kantha-sarees',
    description: 'Traditional Kantha embroidered sarees',
    emoji: '🥻',
    display_order: 3,
    show_in_header: false,
    parent_slug: 'sarees',
  },
  {
    name: 'Georgette Sarees',
    slug: 'georgette-sarees',
    description: 'Light and flowy georgette sarees',
    emoji: '🥻',
    display_order: 4,
    show_in_header: false,
    parent_slug: 'sarees',
  },

  // ── Accessories subcategories ──────────────────────────────────
  {
    name: 'Jewellery',
    slug: 'jewellery',
    description: 'Earrings, necklaces, bangles and more',
    emoji: '💎',
    display_order: 1,
    show_in_header: false,
    parent_slug: 'accessories',
  },
  {
    name: 'Bags & Clutches',
    slug: 'bags-clutches',
    description: 'Handcrafted bags and evening clutches',
    emoji: '👜',
    display_order: 2,
    show_in_header: false,
    parent_slug: 'accessories',
  },
];

async function seedCategories() {
  console.log('🗂️  Seeding categories...');
  let created = 0;
  let skipped = 0;

  // First pass: top-level categories (no parent_slug)
  const topLevel = CATEGORIES.filter((c) => !c.parent_slug);
  for (const cat of topLevel) {
    const existing = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, cat.slug))
      .limit(1);

    if (existing.length > 0) {
      console.log(`⏭️  Skipped: ${cat.name}`);
      skipped++;
    } else {
      await db.insert(categories).values({
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        emoji: cat.emoji,
        display_order: cat.display_order,
        show_in_header: cat.show_in_header,
        is_active: true,
      });
      console.log(`✅ ${cat.name}`);
      created++;
    }
  }

  // Second pass: subcategories (resolve parent_id)
  const subCategories = CATEGORIES.filter((c) => c.parent_slug);
  for (const cat of subCategories) {
    const existing = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, cat.slug))
      .limit(1);

    if (existing.length > 0) {
      console.log(`⏭️  Skipped: ${cat.name}`);
      skipped++;
      continue;
    }

    const parent = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, cat.parent_slug!))
      .limit(1);

    if (parent.length === 0) {
      console.log(`⚠️  Parent not found for ${cat.name} (parent: ${cat.parent_slug}) — skipping`);
      continue;
    }

    await db.insert(categories).values({
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      emoji: cat.emoji,
      display_order: cat.display_order,
      show_in_header: cat.show_in_header,
      parent_id: parent[0].id,
      is_active: true,
    });
    console.log(`✅ ${cat.name} (under ${cat.parent_slug})`);
    created++;
  }

  console.log(`\n🎉 Done! Created: ${created}, Skipped: ${skipped}`);
  process.exit(0);
}

seedCategories().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
