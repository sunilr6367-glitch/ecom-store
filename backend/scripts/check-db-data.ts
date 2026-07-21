import { db } from "../src/db";
import { products, product_collections, category_circles, featured_products, categories, collection_products } from "../src/db/schema";
import { eq, and, isNull } from 'drizzle-orm';

async function check() {
  console.log("=== DB DATA AUDIT ===");

  try {
    // 1. Products
    const allProducts = await db.select().from(products);
    console.log(`\n--- Products ---`);
    console.log(`Total Products: ${allProducts.length}`);
    const published = allProducts.filter(p => p.status === 'published');
    const draft = allProducts.filter(p => p.status === 'draft');
    console.log(`Published: ${published.length}`);
    console.log(`Drafts: ${draft.length}`);
    console.log(`Wholesale only: ${allProducts.filter(p => p.is_wholesale_only).length}`);
    console.log(`Has handle: ${allProducts.filter(p => p.handle).length}`);
    console.log(`Has thumbnail: ${allProducts.filter(p => p.thumbnail).length}`);

    // Print first 10 products details
    console.log("\nFirst 10 products:");
    allProducts.slice(0, 10).forEach(p => {
      console.log(`- ID: ${p.id}, Title: "${p.title}", Handle: "${p.handle}", Status: "${p.status}", Thumbnail: "${p.thumbnail}"`);
    });

    // 2. Collections
    const allCollections = await db.select().from(product_collections);
    console.log(`\n--- Collections ---`);
    console.log(`Total Collections: ${allCollections.length}`);
    allCollections.forEach(c => {
      console.log(`- ID: ${c.id}, Title: "${c.title}", Handle: "${c.handle}", Status: "${c.status}", Homepage Section: "${c.homepage_section}", MegaMenu: ${c.show_in_megamenu}`);
    });

    // 3. Category Tree / categories
    const allCats = await db.select().from(categories);
    console.log(`\n--- Categories ---`);
    console.log(`Total Categories: ${allCats.length}`);
    allCats.forEach(c => {
      console.log(`- ID: ${c.id}, Name: "${c.name}", Slug: "${c.slug}", Active: ${c.is_active}, Show in Header: ${c.show_in_header}, Parent: ${c.parent_id}`);
    });

    // 4. Featured products (spotlights)
    const featured = await db.select().from(featured_products);
    console.log(`\n--- Featured Products (Spotlights) ---`);
    console.log(`Total Featured rows: ${featured.length}`);
    featured.forEach(f => {
      console.log(`- Product ID: ${f.product_id}, Spotlight Type: "${f.spotlight_type}", Sort Order: ${f.sort_order}`);
    });

    // 5. Collection Products
    const assignments = await db.select().from(collection_products);
    console.log(`\n--- Collection Product Assignments ---`);
    console.log(`Total Assignments: ${assignments.length}`);
    assignments.forEach(a => {
      console.log(`- Collection ID: ${a.collection_id}, Product ID: ${a.product_id}`);
    });

  } catch (error) {
    console.error("Failed to query DB:", error);
  } finally {
    process.exit(0);
  }
}

check();
