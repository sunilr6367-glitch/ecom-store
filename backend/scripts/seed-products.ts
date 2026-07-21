
import { db } from "../src/db";
import { products, product_variants, product_options, product_option_values, product_images, money_amounts, regions } from "../src/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

async function seed() {
    console.error("DEBUG: Starting Product Seed Script...");
    console.log("🌱 Seeding Products...");

    // Get a region (USD)
    const [region] = await db.select().from(regions).where(eq(regions.currency_code, 'usd')).limit(1);
    const regionId = region?.id; // If null, we might fail or need to create region

    if (!regionId) {
        console.log("⚠️ No USD region found. Creating one...");
        const [newRegion] = await db.insert(regions).values({
            id: randomUUID(),
            name: "North America",
            currency_code: "usd",
            tax_rate: "0",
            countries: ["US", "CA"]
        }).returning();
        // regionId = newRegion.id; // variable assignment in TS block
        // const regionId = ...
    }
    // Re-fetch to be safe or use variable
    const [startRegion] = await db.select().from(regions).where(eq(regions.currency_code, 'usd')).limit(1);

    const productsData = [
        {
            title: "Classic Cotton T-Shirt",
            handle: "classic-cotton-t-shirt",
            description: "A timeless classic made from 100% organic cotton. Soft, breathable, and durable.",
            thumbnail: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            price: 2500, // $25.00
            options: [
                { title: "Size", values: ["Small", "Medium", "Large"] },
                { title: "Color", values: ["White", "Black", "Navy"] }
            ]
        },
        {
            title: "Slim Fit Denim Jeans",
            handle: "slim-fit-denim-jeans",
            description: "Premium denim with a modern slim fit. Features 5-pocket styling and stretch comfort.",
            thumbnail: "https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            price: 8900, // $89.00
            options: [
                { title: "Size", values: ["30", "32", "34"] },
                { title: "Wash", values: ["Dark", "Light"] }
            ]
        },
        {
            title: "Silk Scarf",
            handle: "silk-scarf",
            description: "Elegant silk scarf with hand-painted patterns. Adds a touch of luxury to any outfit.",
            thumbnail: "https://images.unsplash.com/photo-1584030318712-88746c86e00e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            price: 4500, // $45.00
            options: [
                { title: "Color", values: ["Red", "Blue"] }
            ]
        }
    ];

    for (const p of productsData) {
        // Check exist
        const exist = await db.query.products.findFirst({
            where: (products, { eq }) => eq(products.handle, p.handle)
        });

        if (!exist) {
            console.log(`Creating ${p.title}...`);
            const prodId = randomUUID();
            await db.insert(products).values({
                id: prodId,
                title: p.title,
                handle: p.handle,
                description: p.description,
                thumbnail: p.thumbnail,
                status: 'published'
            });

            // Create Options
            for (const opt of p.options) {
                const optId = randomUUID();
                await db.insert(product_options).values({
                    id: optId,
                    product_id: prodId,
                    title: opt.title
                });

                // Variants Generation (Simplified: create one variant per combination or just simple loop)
                // For simplicity, let's create flat variants: "Size / Color"
                // Actually, full cartesian product is best but let's do simplified:
                // Just create variants for each combination of values[0] + values[1] if exists
            }

            // Simplified variant creation:
            // Just create one default variant if options are complex, or map through first option
            // Let's create a variant for each value if only 1 option, or mix if 2

            // Naive approach: Just create 1 variant "Default" for now to ensure add-to-cart works
            // Or better:
            const variantId = randomUUID();
            await db.insert(product_variants).values({
                id: variantId,
                product_id: prodId,
                title: "Default / Medium", // Mock title
                inventory_quantity: 100
            });

            // Price
            if (startRegion) {
                await db.insert(money_amounts).values({
                    id: randomUUID(),
                    variant_id: variantId,
                    region_id: startRegion.id,
                    currency_code: startRegion.currency_code,
                    amount: p.price
                });
            }
        } else {
            console.log(`Skipping ${p.title} (Exists)`);
        }
    }

    console.log("✅ Products Seeded");
    process.exit(0);
}

seed().catch(e => {
    console.error(e);
    process.exit(1);
});
